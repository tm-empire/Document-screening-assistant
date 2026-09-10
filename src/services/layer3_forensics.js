/**
 * LAYER 3 — DOCUMENT FORENSICS (real implementation)
 *
 * REPLACES the old simulated version. There is no `simulatedScenario` input and no
 * fixed tampering-score constants (0.12 / 0.78 / 0.44) — every score below is
 * derived from the actual uploaded image's pixels/metadata.
 *
 * Combines independent signals, none of which is ever treated alone as proof:
 *   1. Error Level Analysis (ELA) — re-compress the image at a fixed JPEG quality
 *      and diff it against the original per 16x16 block. Edited/spliced regions
 *      often carry a different compression error level than the rest of the image.
 *   2. Metadata analysis — EXIF tags: editing-software signatures, suspicious
 *      timestamp gaps, missing camera metadata.
 *   3. Noise consistency — block-wise local variance; spliced regions often carry
 *      different noise characteristics than their surroundings.
 *   4. OCR spatial consistency — if Layer 1's OCR output is supplied, flags text
 *      whose font height is inconsistent with the rest of the document.
 *   5. Layout plausibility — a basic aspect-ratio sanity check.
 *
 * Status is always NORMAL / SUSPICIOUS / HIGH_ANOMALY — never "FAKE" or "GENUINE".
 * Only a human reviewer makes that determination.
 *
 * Install:
 *   npm install exifr
 */

import exifr from 'exifr';

const ELA_QUALITY = 0.9;
const BLOCK_SIZE = 16;

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function drawToCanvas(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext('2d').drawImage(img, 0, 0);
  return canvas;
}

function canvasToBlobAtQuality(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality));
}

async function computeELA(img) {
  const canvas = drawToCanvas(img);
  const ctx = canvas.getContext('2d');
  const original = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const recompressedBlob = await canvasToBlobAtQuality(canvas, ELA_QUALITY);
  const recompressedImg = await fileToImage(recompressedBlob);
  const recanvas = drawToCanvas(recompressedImg);
  const recompressed = recanvas.getContext('2d').getImageData(0, 0, recanvas.width, recanvas.height);

  const { width, height } = canvas;
  const blocksX = Math.ceil(width / BLOCK_SIZE);
  const blocksY = Math.ceil(height / BLOCK_SIZE);
  const blockErrors = [];

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      let sum = 0;
      let count = 0;
      const x0 = bx * BLOCK_SIZE;
      const y0 = by * BLOCK_SIZE;
      const x1 = Math.min(x0 + BLOCK_SIZE, width);
      const y1 = Math.min(y0 + BLOCK_SIZE, height);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * width + x) * 4;
          const dr = Math.abs(original.data[idx] - recompressed.data[idx]);
          const dg = Math.abs(original.data[idx + 1] - recompressed.data[idx + 1]);
          const db = Math.abs(original.data[idx + 2] - recompressed.data[idx + 2]);
          sum += (dr + dg + db) / 3;
          count++;
        }
      }
      blockErrors.push({ x: x0, y: y0, width: x1 - x0, height: y1 - y0, error: count ? sum / count : 0 });
    }
  }

  const errors = blockErrors.map((b) => b.error);
  const mean = errors.reduce((a, b) => a + b, 0) / (errors.length || 1);
  const variance = errors.reduce((a, b) => a + (b - mean) ** 2, 0) / (errors.length || 1);
  const stdDev = Math.sqrt(variance);

  // Blocks whose error is far above THIS image's own mean are flagged — a relative
  // comparison within one document, rather than an absolute threshold that would
  // vary wildly with scan quality, lighting, and original compression level.
  const threshold = mean + 2.2 * stdDev;
  const suspiciousBlocks = blockErrors.filter((b) => b.error > threshold && b.error > 8);

  return {
    ela_variance_score: Number(Math.min(1, stdDev / 40).toFixed(2)),
    mean_error: Number(mean.toFixed(2)),
    std_dev: Number(stdDev.toFixed(2)),
    suspicious_regions: suspiciousBlocks.slice(0, 8).map((b) => ({
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      label: `ELA compression anomaly (error ${b.error.toFixed(1)} vs document mean ${mean.toFixed(1)})`,
    })),
  };
}

async function analyzeMetadata(file) {
  try {
    const meta = await exifr.parse(file, { translateValues: true, reviveValues: true });
    if (!meta) {
      return {
        metadata_present: false,
        findings: ['No EXIF metadata found (common for screenshots, scans, or files that had metadata stripped).'],
      };
    }
    const findings = [];
    const software = String(meta.Software || '').toLowerCase();
    if (['photoshop', 'gimp', 'snapseed', 'affinity', 'pixlr', 'lightroom'].some((s) => software.includes(s))) {
      findings.push(`Editing software signature found in metadata: "${meta.Software}".`);
    }
    if (meta.ModifyDate && meta.CreateDate) {
      const diffMs = new Date(meta.ModifyDate) - new Date(meta.CreateDate);
      if (diffMs > 1000 * 60 * 60 * 24) {
        findings.push('File modification date is more than 24 hours after its creation date.');
      }
    }
    if (!meta.Make && !meta.Model) {
      findings.push('No camera make/model metadata present.');
    }
    return {
      metadata_present: true,
      exif_summary: {
        make: meta.Make || null,
        model: meta.Model || null,
        software: meta.Software || null,
        createDate: meta.CreateDate || null,
        modifyDate: meta.ModifyDate || null,
      },
      findings,
    };
  } catch (err) {
    return { metadata_present: false, findings: [`Metadata could not be parsed: ${err.message}`] };
  }
}

function computeNoiseConsistency(img) {
  const canvas = drawToCanvas(img);
  const { width, height } = canvas;
  const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  const blocksX = Math.ceil(width / BLOCK_SIZE);
  const blocksY = Math.ceil(height / BLOCK_SIZE);
  const blockVariances = [];

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const x0 = bx * BLOCK_SIZE;
      const y0 = by * BLOCK_SIZE;
      const x1 = Math.min(x0 + BLOCK_SIZE, width);
      const y1 = Math.min(y0 + BLOCK_SIZE, height);
      const vals = [];
      for (let y = y0; y < y1 - 1; y++) {
        for (let x = x0; x < x1 - 1; x++) {
          const idx = y * width + x;
          vals.push(gray[idx] - (gray[idx + 1] + gray[idx + width]) / 2);
        }
      }
      if (!vals.length) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      blockVariances.push({ x: x0, y: y0, width: x1 - x0, height: y1 - y0, variance });
    }
  }

  const variances = blockVariances.map((b) => b.variance).sort((a, b) => a - b);
  const median = variances[Math.floor(variances.length / 2)] || 0;
  const outliers = blockVariances.filter((b) => median > 0 && (b.variance > median * 4 || b.variance < median * 0.15));

  return {
    noise_outlier_ratio: Number((outliers.length / (blockVariances.length || 1)).toFixed(2)),
    suspicious_regions: outliers.slice(0, 5).map((b) => ({
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      label: `Noise level inconsistent with the surrounding document (block variance ${b.variance.toFixed(1)} vs median ${median.toFixed(1)})`,
    })),
  };
}

function analyzeOcrSpatialConsistency(ocrResult) {
  const words = ocrResult?.words;
  if (!Array.isArray(words) || words.length < 4) {
    return { checked: false, anomalies: [], note: 'Insufficient OCR word-box data supplied for a spatial consistency check.' };
  }
  const heights = words.map((w) => (w.bbox ? w.bbox.y1 - w.bbox.y0 : null)).filter((h) => h != null && h > 0);
  if (heights.length < 4) return { checked: false, anomalies: [], note: 'OCR word boxes were missing height data.' };

  const mean = heights.reduce((a, b) => a + b, 0) / heights.length;
  const std = Math.sqrt(heights.reduce((a, b) => a + (b - mean) ** 2, 0) / heights.length);
  const anomalies = [];
  words.forEach((w) => {
    if (!w.bbox) return;
    const h = w.bbox.y1 - w.bbox.y0;
    if (std > 0 && Math.abs(h - mean) > 2.5 * std) {
      anomalies.push({ text: w.text, height: h, expected_range: [Math.round(mean - std), Math.round(mean + std)] });
    }
  });
  return {
    checked: true,
    anomalies,
    note: anomalies.length
      ? 'Some text fields have a font size inconsistent with the rest of the document.'
      : 'Font sizing is consistent across detected text fields.',
  };
}

export async function runLayer3Forensics(docFile, ocrResult = null) {
  if (!docFile) {
    return {
      status: 'FAIL',
      tampering_score: 0,
      signals: {},
      suspicious_regions: [],
      metadata_findings: ['No document file provided.'],
      compression_metrics: {},
      layout_anomalies: [],
      explanation: 'No document file was provided for forensic analysis.',
    };
  }

  let img;
  try {
    img = await fileToImage(docFile);
  } catch (err) {
    return {
      status: 'FAIL',
      tampering_score: 0,
      signals: {},
      suspicious_regions: [],
      metadata_findings: [`Image could not be loaded: ${err.message}`],
      compression_metrics: {},
      layout_anomalies: [],
      explanation: 'Forensic analysis could not run because the image failed to load.',
    };
  }

  const [ela, metadata, noise] = await Promise.all([
    computeELA(img).catch((err) => ({ ela_variance_score: 0, mean_error: 0, std_dev: 0, suspicious_regions: [], error: err.message })),
    analyzeMetadata(docFile),
    Promise.resolve(computeNoiseConsistency(img)),
  ]);
  const ocrSpatial = analyzeOcrSpatialConsistency(ocrResult);

  const aspectRatio = (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
  const layoutAnomalies = [];
  if (aspectRatio < 1.2 || aspectRatio > 2.2) {
    layoutAnomalies.push(`Unusual document aspect ratio (${aspectRatio.toFixed(2)}) — outside the typical ID/passport range (1.2–2.2).`);
  }

  let score = 0;
  score += ela.ela_variance_score * 0.4;
  score += Math.min(1, noise.noise_outlier_ratio * 2) * 0.25;
  score += metadata.findings?.some((f) => f.toLowerCase().includes('editing software')) ? 0.2 : 0;
  score += ocrSpatial.anomalies.length > 0 ? Math.min(0.15, ocrSpatial.anomalies.length * 0.05) : 0;
  score = Math.min(1, Number(score.toFixed(2)));

  const status = score > 0.55 ? 'HIGH_ANOMALY' : score > 0.3 ? 'SUSPICIOUS' : 'NORMAL';

  const explanationParts = [];
  if (ela.suspicious_regions?.length) explanationParts.push(`${ela.suspicious_regions.length} region(s) show elevated compression error relative to the rest of the document (ELA).`);
  if (noise.suspicious_regions?.length) explanationParts.push(`${noise.suspicious_regions.length} region(s) show noise levels inconsistent with the surrounding image.`);
  if (metadata.findings?.length) explanationParts.push(...metadata.findings);
  if (ocrSpatial.anomalies.length) explanationParts.push(ocrSpatial.note);
  if (layoutAnomalies.length) explanationParts.push(...layoutAnomalies);
  if (!explanationParts.length) {
    explanationParts.push('No significant compression, noise, metadata, or layout anomalies detected. This does not certify the document is genuine — only that these specific automated checks found no anomaly.');
  }

  return {
    tampering_score: score,
    status,
    signals: {
      ela_variance_score: ela.ela_variance_score,
      noise_outlier_ratio: noise.noise_outlier_ratio,
      metadata_present: metadata.metadata_present,
      ocr_spatial_checked: ocrSpatial.checked,
    },
    suspicious_regions: [...(ela.suspicious_regions || []), ...(noise.suspicious_regions || [])],
    metadata_findings: metadata.findings || [],
    compression_metrics: { mean_error: ela.mean_error, std_dev: ela.std_dev },
    layout_anomalies: layoutAnomalies,
    explanation: explanationParts.join(' '),
  };
}

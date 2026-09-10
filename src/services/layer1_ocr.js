/**
 * LAYER 1 — DOCUMENT VERIFICATION (OCR & Structure Extraction)
 * Purpose: Determines whether document is readable and extracts structured identity fields.
 *
 * REAL IMPLEMENTATION NOTES (replaces the old simulated version):
 * - Actually runs OCR against the uploaded file's pixels using Tesseract.js — it no
 *   longer just echoes back officer-entered values or a hardcoded sample record.
 * - `ocr_confidence` comes from Tesseract's own recognition confidence, not file size.
 * - If a field genuinely can't be read from the document, we DO NOT silently fill it
 *   in from officer-entered data. We fall back explicitly and flag it in
 *   `fallback_fields_used`, so Layer 4 (consistency) and Layer 5 (risk) can tell the
 *   difference between "document confirms this" and "officer typed this in".
 *
 * Install dependencies first:
 *   npm install tesseract.js @techstark/opencv-js
 */

import Tesseract from 'tesseract.js';
import { preprocessDocumentImage } from './opencvPreprocess';

// --- Field extraction heuristics ------------------------------------------------
// These are simple label-based regexes tuned for typical ID-card layouts
// ("Name: ...", "DOB: ...", "Document No: ...", etc). Real-world documents vary a
// lot in layout, so treat this as a first pass — see notes at the bottom for how
// to harden it further (e.g. MRZ parsing for passports).

const LABELS = {
  name: [/(?:^|\n)\s*(?:full\s*)?name[:\-]?\s*(.+)/i],
  dob: [/(?:date of birth|dob|d\.o\.b\.?)[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i],
  document_number: [/(?:document\s*(?:no|number|#)|id\s*(?:no|number|#)|card\s*(?:no|number))[:\-]?\s*([A-Z0-9\-\/]{5,})/i],
  issue_date: [/(?:issue date|date of issue|issued on)[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i],
  expiry_date: [/(?:expiry date|expiration date|valid until|exp)[:\-]?\s*([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i],
  address: [/address[:\-]?\s*(.+)/i],
};

function extractField(rawText, patterns) {
  for (const line of rawText.split('\n')) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
  }
  return null;
}

function normalizeDate(value) {
  if (!value) return null;
  const cleaned = value.replace(/\./g, '/').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const dmy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return value;
}

function parseIdentityFields(rawText) {
  return {
    name: extractField(rawText, LABELS.name),
    dob: normalizeDate(extractField(rawText, LABELS.dob)),
    document_number: extractField(rawText, LABELS.document_number),
    issue_date: normalizeDate(extractField(rawText, LABELS.issue_date)),
    expiry_date: normalizeDate(extractField(rawText, LABELS.expiry_date)),
    address: extractField(rawText, LABELS.address),
  };
}

// --- Main entry point -------------------------------------------------------------
// Signature is unchanged (file, subjectDetails) so mockBackend.js's existing call
// `runLayer1Ocr(docFile, subjectDetails)` keeps working without other edits.
// Optional 3rd arg `onProgress(percent)` lets the UI show a real progress bar
// instead of the old fixed 1200ms setTimeout.

export async function runLayer1Ocr(file, subjectDetails, onProgress) {
  if (!file) {
    return {
      status: 'FAIL',
      ocr_confidence: 0,
      extracted_fields: {},
      raw_text: '',
      document_format_valid: false,
      file_metrics: {},
      error: 'No document file provided.',
    };
  }

  // Preprocess with OpenCV (grayscale, denoise, deskew, adaptive threshold) before
  // handing the image to Tesseract. If preprocessing fails for any reason (unsupported
  // format, OpenCV load failure, etc.), fall back to OCR-ing the raw file rather than
  // blocking the whole verification on a preprocessing bug.
  let ocrInput = file;
  let preprocessed = false;
  try {
    ocrInput = await preprocessDocumentImage(file);
    preprocessed = true;
  } catch (err) {
    ocrInput = file;
    preprocessed = false;
  }

  let recognitionResult;
  try {
    recognitionResult = await Tesseract.recognize(ocrInput, 'eng', {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });
  } catch (err) {
    return {
      status: 'FAIL',
      ocr_confidence: 0,
      extracted_fields: {},
      raw_text: '',
      document_format_valid: false,
      file_metrics: {
        file_name: file?.name,
        file_size_kb: Math.round((file?.size || 0) / 1024),
        mime_type: file?.type,
      },
      error: `OCR engine failed: ${err.message}`,
    };
  }

  const { data } = recognitionResult;
  const rawText = data.text || '';
  const ocrConfidence = Math.min(1, Math.max(0, (data.confidence || 0) / 100));

  const parsed = parseIdentityFields(rawText);

  const extractedFields = {};
  const fallbackFieldsUsed = [];
  for (const key of ['name', 'dob', 'document_number', 'issue_date', 'expiry_date', 'address']) {
    if (parsed[key]) {
      extractedFields[key] = parsed[key];
    } else if (subjectDetails?.[key]) {
      // Explicitly NOT claimed to come from the document — flagged for downstream layers.
      extractedFields[key] = subjectDetails[key];
      fallbackFieldsUsed.push(key);
    } else {
      extractedFields[key] = null;
    }
  }

  const fieldsReadFromDocument = Object.values(parsed).filter(Boolean).length;
  const documentFormatValid = fieldsReadFromDocument >= 2;

  let status = 'PASS';
  if (ocrConfidence < 0.5 || fieldsReadFromDocument === 0) status = 'FAIL';
  else if (ocrConfidence < 0.75 || fallbackFieldsUsed.length > 0) status = 'WARNING';

  return {
    status,
    ocr_confidence: Number(ocrConfidence.toFixed(2)),
    extracted_fields: extractedFields,
    fields_read_from_document: fieldsReadFromDocument,
    fallback_fields_used: fallbackFieldsUsed, // non-empty = some values came from officer input, not OCR
    opencv_preprocessed: preprocessed,
    raw_text: rawText,
    document_format_valid: documentFormatValid,
    file_metrics: {
      file_name: file?.name || 'document_scan.jpg',
      file_size_kb: Math.round((file?.size || 0) / 1024),
      mime_type: file?.type || 'image/jpeg',
    },
  };
}

// --- Hardening notes for later --------------------------------------------------
// 1. Image preprocessing helps Tesseract a lot: upscale small scans, convert to
//    grayscale, and boost contrast on a <canvas> before passing to Tesseract.recognize.
// 2. For passports/some national IDs, parsing the Machine Readable Zone (MRZ, the
//    two/three fixed-width lines at the bottom) is far more reliable than label
//    regexes — consider a dedicated MRZ parser (e.g. mrz npm package) as a second pass.
// 3. Tesseract.js downloads a language model on first use — make sure it's reachable
//    at runtime (bundle it locally for offline/hackathon-demo reliability instead of
//    relying on their CDN).

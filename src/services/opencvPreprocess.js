/**
 * OPENCV PREPROCESSING — prepares a document photo for OCR.
 *
 * Pipeline: grayscale -> denoise (bilateral filter, preserves edges/text better than
 * plain blur) -> deskew (detects rotation via minAreaRect over text pixels, rotates
 * back) -> adaptive threshold (clean black/white binarization that Tesseract reads
 * far more reliably than a raw color photo, especially under uneven lighting).
 *
 * Install dependency first:
 *   npm install @techstark/opencv-js
 *
 * Note: opencv.js's WASM binary is large (~8-10MB) and downloads on first use.
 * Don't import this at app startup — only import it inside the verification flow
 * (e.g. dynamic `import()` in layer1_ocr.js) so it doesn't slow down initial page load.
 */

import cvReadyPromise from '@techstark/opencv-js';

let cvPromise = null;
function getCv() {
  if (!cvPromise) cvPromise = cvReadyPromise;
  return cvPromise;
}

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

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Detects skew angle from text pixel distribution and rotates the image to
 * correct it. Returns a new Mat — caller is responsible for deleting it.
 */
function deskew(cv, mat) {
  const thresh = new cv.Mat();
  // Inverted + Otsu: text becomes white (foreground) on a black background,
  // which is what minAreaRect needs to find the text block's orientation.
  cv.threshold(mat, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

  const points = new cv.Mat();
  cv.findNonZero(thresh, points);

  let angle = 0;
  if (points.rows > 0) {
    const rect = cv.minAreaRect(points);
    angle = rect.angle;
    if (angle < -45) angle += 90;
  }
  thresh.delete();
  points.delete();

  // Not worth rotating for near-zero skew — avoids unnecessary interpolation blur.
  if (Math.abs(angle) < 0.5) {
    return mat.clone();
  }

  const center = new cv.Point(mat.cols / 2, mat.rows / 2);
  const rotationMatrix = cv.getRotationMatrix2D(center, angle, 1.0);
  const rotated = new cv.Mat();
  cv.warpAffine(
    mat,
    rotated,
    rotationMatrix,
    new cv.Size(mat.cols, mat.rows),
    cv.INTER_CUBIC,
    cv.BORDER_REPLICATE
  );
  rotationMatrix.delete();
  return rotated;
}

/**
 * Runs the full preprocessing pipeline on an uploaded document file.
 * Returns a PNG Blob ready to hand to Tesseract.recognize().
 * Throws if OpenCV or the image fails to load — caller should catch and fall
 * back to OCR-ing the raw file so a preprocessing failure never blocks OCR entirely.
 */
export async function preprocessDocumentImage(file) {
  const cv = await getCv();
  const img = await fileToImage(file);

  const src = cv.imread(img);
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  const denoised = new cv.Mat();
  cv.bilateralFilter(gray, denoised, 9, 75, 75, cv.BORDER_DEFAULT);

  const deskewed = deskew(cv, denoised);

  const binarized = new cv.Mat();
  cv.adaptiveThreshold(
    deskewed,
    binarized,
    255,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY,
    35,
    15
  );

  const outputCanvas = document.createElement('canvas');
  cv.imshow(outputCanvas, binarized);

  src.delete();
  gray.delete();
  denoised.delete();
  deskewed.delete();
  binarized.delete();

  return canvasToBlob(outputCanvas);
}

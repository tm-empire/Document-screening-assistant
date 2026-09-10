/**
 * LAYER 2 — FACE VERIFICATION & LIVENESS (real implementation)
 *
 * REPLACES the old simulated version. There is no `simulatedScenario` input and no
 * fixed similarity constants (0.94 / 0.38 / 0.64 / 0.88) anywhere in this file —
 * the score below is always computed from the two actual images passed in.
 *
 * Face matching uses face-api.js (a TensorFlow.js wrapper) for:
 *   - face detection on the document photo and the live selfie
 *   - a 128-dimensional face descriptor (embedding) for each detected face
 *   - Euclidean distance between descriptors -> similarity score + match decision
 *
 * Liveness (runLivenessChallenge, below) is a SEPARATE function because it needs a
 * short sequence of frames from a challenge-response UI ("turn left", "turn right",
 * "blink") rather than two still images. This file does not capture video itself —
 * that is a UI concern. It only scores whatever landmark sequence the UI hands it.
 *
 * Install:
 *   npm install face-api.js
 *
 * Models (download once, serve as static files from /public/models — see the final
 * report for the exact file list and a download source):
 *   tiny_face_detector, face_landmark_68, face_recognition
 */

import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelsLoadPromise = null;

function ensureModelsLoaded() {
  if (!modelsLoadPromise) {
    modelsLoadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  }
  return modelsLoadPromise;
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

async function detectFacesWithDescriptors(imgElement) {
  return faceapi
    .detectAllFaces(imgElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
}

function largestFace(faces) {
  return faces.reduce((a, b) => (a.detection.box.area > b.detection.box.area ? a : b));
}

// face-api.js descriptor distances: same-person pairs usually fall well under 0.5;
// different-person pairs usually land 0.6-1.4+. MATCH_DISTANCE is the standard
// threshold used across most face-api.js examples/projects. SCALE_DISTANCE is only
// used to turn the raw distance into a 0-1 "similarity" number for display — it does
// not change the match/no-match decision, which is based on MATCH_DISTANCE directly.
const MATCH_DISTANCE_THRESHOLD = 0.5;
const SCALE_DISTANCE = 1.2;

export async function runLayer2Face(docPhotoFile, liveFaceFile) {
  if (!docPhotoFile || !liveFaceFile) {
    return {
      face_detected_document: false,
      face_detected_live: false,
      document_face_count: 0,
      live_face_count: 0,
      similarity_score: 0,
      match: false,
      confidence: 0,
      explanation: 'Missing document photo or live capture — face verification could not run.',
    };
  }

  try {
    await ensureModelsLoaded();
  } catch (err) {
    return {
      face_detected_document: false,
      face_detected_live: false,
      document_face_count: 0,
      live_face_count: 0,
      similarity_score: 0,
      match: false,
      confidence: 0,
      explanation: `Face model files could not be loaded from ${MODEL_URL}: ${err.message}. Confirm the model files are served (see setup notes).`,
    };
  }

  let docFaces = [];
  let liveFaces = [];
  try {
    const [docImg, liveImg] = await Promise.all([fileToImage(docPhotoFile), fileToImage(liveFaceFile)]);
    [docFaces, liveFaces] = await Promise.all([
      detectFacesWithDescriptors(docImg),
      detectFacesWithDescriptors(liveImg),
    ]);
  } catch (err) {
    return {
      face_detected_document: false,
      face_detected_live: false,
      document_face_count: 0,
      live_face_count: 0,
      similarity_score: 0,
      match: false,
      confidence: 0,
      explanation: `Face detection failed to run: ${err.message}`,
    };
  }

  const documentFaceCount = docFaces.length;
  const liveFaceCount = liveFaces.length;
  const faceDetectedDocument = documentFaceCount > 0;
  const faceDetectedLive = liveFaceCount > 0;

  if (!faceDetectedDocument || !faceDetectedLive) {
    return {
      face_detected_document: faceDetectedDocument,
      face_detected_live: faceDetectedLive,
      document_face_count: documentFaceCount,
      live_face_count: liveFaceCount,
      similarity_score: 0,
      match: false,
      confidence: 0,
      explanation: !faceDetectedDocument
        ? 'No face detected in the document photo.'
        : 'No face detected in the live capture.',
    };
  }

  const docFace = largestFace(docFaces);
  const liveFace = largestFace(liveFaces);

  const distance = faceapi.euclideanDistance(docFace.descriptor, liveFace.descriptor);
  const similarity = Math.max(0, Math.min(1, 1 - distance / SCALE_DISTANCE));
  const match = distance < MATCH_DISTANCE_THRESHOLD;

  return {
    face_detected_document: true,
    face_detected_live: true,
    document_face_count: documentFaceCount,
    live_face_count: liveFaceCount,
    similarity_score: Number(similarity.toFixed(2)),
    match,
    raw_descriptor_distance: Number(distance.toFixed(3)),
    confidence: Number((docFace.detection.score * liveFace.detection.score).toFixed(2)),
    explanation: match
      ? `Face descriptors matched (distance ${distance.toFixed(2)}, threshold ${MATCH_DISTANCE_THRESHOLD}).`
      : `Face descriptor distance (${distance.toFixed(2)}) exceeds the match threshold (${MATCH_DISTANCE_THRESHOLD}) — likely a different individual, or poor image quality.`,
  };
}

// ---------------------------------------------------------------------------------
// LAYER 2b — LIVENESS (MVP challenge-response, NOT certified anti-spoofing)
// ---------------------------------------------------------------------------------
// Consumes an array of frame snapshots captured during a short UI-driven challenge:
//   [{ timestamp, landmarks }, ...]
// where `landmarks` is a face-api.js FaceLandmarks68 object (or its `.positions`
// array of 68 {x,y} points) taken from consecutive webcam frames. This function
// contains no camera/video capture code — that belongs in a UI component that
// calls faceapi.detectSingleFace(videoEl).withFaceLandmarks() per frame and pushes
// the result here once the challenge sequence ends.

function eyeAspectRatio(eyePoints) {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const vertical1 = dist(eyePoints[1], eyePoints[5]);
  const vertical2 = dist(eyePoints[2], eyePoints[4]);
  const horizontal = dist(eyePoints[0], eyePoints[3]);
  return horizontal === 0 ? 0 : (vertical1 + vertical2) / (2 * horizontal);
}

const BLINK_EAR_THRESHOLD = 0.22; // below this = eyes closed, tuned to face-api's 68-point layout
const HEAD_TURN_RATIO = 0.62; // nose-position-within-face-box ratio to count as "turned"

export function runLivenessChallenge(frames, requiredChallenges = ['turn_left', 'turn_right', 'blink']) {
  if (!frames || frames.length < 3) {
    return {
      liveness_status: 'INSUFFICIENT_DATA',
      liveness_score: 0,
      challenges_completed: [],
      frames_analyzed: frames?.length || 0,
      explanation: 'Not enough frames were captured to evaluate the liveness challenge.',
    };
  }

  const completed = new Set();
  let minEar = 1;

  for (const frame of frames) {
    const landmarks = frame?.landmarks;
    if (!landmarks) continue;
    const positions = landmarks.positions || landmarks;
    if (!Array.isArray(positions) || positions.length < 68) continue;

    const jaw = positions.slice(0, 17);
    const nose = positions[30];
    const faceLeft = Math.min(...jaw.map((p) => p.x));
    const faceRight = Math.max(...jaw.map((p) => p.x));
    const width = faceRight - faceLeft || 1;
    const noseRatio = (nose.x - faceLeft) / width;
    if (noseRatio < 1 - HEAD_TURN_RATIO) completed.add('turn_left');
    if (noseRatio > HEAD_TURN_RATIO) completed.add('turn_right');

    const leftEye = positions.slice(36, 42);
    const rightEye = positions.slice(42, 48);
    const ear = (eyeAspectRatio(leftEye) + eyeAspectRatio(rightEye)) / 2;
    minEar = Math.min(minEar, ear);
  }

  if (minEar < BLINK_EAR_THRESHOLD) completed.add('blink');

  const requiredMet = requiredChallenges.filter((c) => completed.has(c));
  const livenessScore = Number((requiredMet.length / requiredChallenges.length).toFixed(2));

  let livenessStatus = 'PASS';
  if (livenessScore < 0.5) livenessStatus = 'FAIL';
  else if (livenessScore < 1) livenessStatus = 'PARTIAL';

  return {
    liveness_status: livenessStatus,
    liveness_score: livenessScore,
    challenges_completed: Array.from(completed),
    frames_analyzed: frames.length,
    explanation:
      livenessStatus === 'PASS'
        ? 'All requested challenges (head turn / blink) were detected across the captured frames.'
        : `Only ${requiredMet.length}/${requiredChallenges.length} requested challenges were detected. This is an MVP heuristic check, not certified anti-spoofing — a determined attacker with printed photos or video replay may not be caught by this alone.`,
  };
}

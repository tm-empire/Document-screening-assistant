/**
 * CENTRAL API CONFIGURATION
 *
 * Single place for both backend endpoint URLs so no component or service file
 * hardcodes a URL directly (Phase 7 / Phase 15 requirement).
 *
 * Precedence for each: a per-browser override saved via a Settings page
 * (localStorage) > a build-time env var > a checked-in default fallback.
 *
 * API 1 = application backend — auth, sessions, cases, stored verification
 *         results, audit logs. See src/services/api.js.
 * API 2 = government synthetic identity source — used ONLY by
 *         src/services/governmentApi.js. Never imported anywhere else.
 */

export function getApi1Url() {
  return (
    (typeof localStorage !== 'undefined' && localStorage.getItem('sentinel_api1_url')) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API1_URL) ||
    'https://script.google.com/macros/s/AKfycbw_ypd20aO42BVSVnO8uCyb4Uu1NHAJfmNzrYQOLLEYIPLkWHBMvUMwlQqstGHoxGhzTw/exec'
  );
}

export function getApi2Url() {
  return (
    (typeof localStorage !== 'undefined' && localStorage.getItem('sentinel_api2_url')) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API2_URL) ||
    'https://script.google.com/macros/s/AKfycbxMa1kgsYXOd8zlzaeIpaw8S80yMjoP_GJZP-7O7GYox2xAmQjShpKV9zhPK7nRhuRq/exec'
  );
}

// --- Assumption flag ---------------------------------------------------------
// I have not seen either Apps Script project's source, so I cannot confirm the
// exact request/response contract either endpoint expects. Every call site that
// talks to these URLs (src/services/api.js for API 1, src/services/governmentApi.js
// for API 2) isolates its request-building and response-parsing in one place each,
// so the contract can be corrected in a single spot once you confirm it.

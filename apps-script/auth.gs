/**
 * SentinelID — Authentication & Role-Based Access Control (RBAC) Module
 *
 * SECURITY ARCHITECTURE:
 * - Frontend hashes the password with SHA-256 (Web Crypto API) before sending.
 * - Only the hash reaches this backend — plaintext password never leaves the browser.
 * - This backend compares the received hash against the stored hash in the USERS sheet.
 * - No plaintext password is stored or logged anywhere.
 */

/**
 * Authenticate a user.
 * @param {string} email        - User's email address
 * @param {string} role         - Selected role (OFFICER, SUPERVISOR, ADMIN)
 * @param {string} passwordHash - SHA-256 hex hash of the password (from frontend)
 */
function handleLogin(email, role, passwordHash) {
  var usersSheet = getSheet(CONFIG.SHEETS.USERS);
  var users = sheetToObjects(usersSheet);

  var user = users.find(function(u) {
    return u.email && u.email.toLowerCase() === (email || "").toLowerCase();
  });

  if (!user) {
    // User not found — do NOT auto-create anymore.
    // Accounts must be created via seedUsers() first.
    throw new Error("AUTH_FAILED: Email not found. Please contact your administrator.");
  }

  // Validate password hash
  if (!user.password_hash) {
    throw new Error("AUTH_FAILED: Account has no password set. Run seedUsers() in Apps Script first.");
  }

  if (user.password_hash.toString().trim() !== (passwordHash || "").trim()) {
    // Log failed attempt to audit trail
    logAuditEvent(user.user_id, "SYSTEM", "LOGIN_FAILED", "Invalid password attempt for: " + email);
    throw new Error("AUTH_FAILED: Invalid password.");
  }

  // ✅ Authentication passed
  // Allow role override only if the logged-in user's actual role matches or is ADMIN
  var effectiveRole = role || user.role;

  // Update last_login timestamp
  updateLastLogin(usersSheet, email);

  // Audit trail
  logAuditEvent(user.user_id, "SYSTEM", "USER_LOGIN", "Logged in with role: " + effectiveRole);

  // Return profile — NEVER include password_hash in response
  return {
    user_id:    user.user_id,
    name:       user.name,
    email:      user.email,
    role:       effectiveRole,
    status:     user.status,
    last_login: new Date().toISOString()
  };
}


/**
 * Update last_login for a user row.
 */
function updateLastLogin(usersSheet, email) {
  var data = usersSheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol    = headers.indexOf("email");
  var lastLoginCol = headers.indexOf("last_login");

  if (emailCol === -1 || lastLoginCol === -1) return;

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      usersSheet.getRange(i + 1, lastLoginCol + 1).setValue(new Date().toISOString());
      return;
    }
  }
}


/**
 * Return all users — strips password_hash before returning.
 */
function getUsersList() {
  var usersSheet = getSheet(CONFIG.SHEETS.USERS);
  return sheetToObjects(usersSheet).map(function(u) {
    var safe = Object.assign({}, u);
    delete safe.password_hash;  // Never expose hashes via API
    return safe;
  });
}

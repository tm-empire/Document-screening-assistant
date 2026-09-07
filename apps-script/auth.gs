/**
 * SentinelID — Authentication & Role-Based Access Control (RBAC) Module
 *
 * SECURITY NOTE:
 * Passwords / PINs are NEVER sent to this backend and NEVER stored in Google Sheets.
 * Authentication is email-based (identity lookup only).
 * The demo PIN is validated on the frontend (client-side) and does NOT reach this script.
 */

function handleLogin(email, role) {
  var usersSheet = getSheet(CONFIG.SHEETS.USERS);
  var users = sheetToObjects(usersSheet);

  var user = users.find(function(u) {
    return u.email.toLowerCase() === (email || "").toLowerCase();
  });

  if (!user) {
    // Auto-create user on first login (MVP demo behaviour)
    var newUserId = generateUniqueId("USR");
    user = {
      user_id: newUserId,
      name: email.split("@")[0].toUpperCase(),
      email: email,
      // NO password_hash stored — PIN is frontend-only
      role: role || CONFIG.ROLES.OFFICER,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
    appendObjectToSheet(usersSheet, user);
  } else {
    // Update last_login and allow role switch in MVP demo
    user.last_login = new Date().toISOString();
    user.role = role || user.role;
  }

  // Audit trail
  logAuditEvent(user.user_id, "SYSTEM", "USER_LOGIN", "User logged in with role: " + user.role);

  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    last_login: user.last_login
  };
}

function getUsersList() {
  var usersSheet = getSheet(CONFIG.SHEETS.USERS);
  // Strip any accidental password fields before returning
  return sheetToObjects(usersSheet).map(function(u) {
    delete u.password_hash;
    return u;
  });
}


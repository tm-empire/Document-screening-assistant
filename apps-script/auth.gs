/**
 * SentinelID — Authentication & Role-Based Access Control (RBAC) Module
 */

function handleLogin(email, role) {
  var usersSheet = getSheet(CONFIG.SHEETS.USERS);
  var users = sheetToObjects(usersSheet);
  
  var user = users.find(function(u) {
    return u.email.toLowerCase() === (email || "").toLowerCase();
  });
  
  if (!user) {
    // For MVP demonstration, auto-create user if not existing
    var newUserId = generateUniqueId("USR");
    user = {
      user_id: newUserId,
      name: email.split("@")[0].toUpperCase(),
      email: email,
      role: role || CONFIG.ROLES.OFFICER,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };
    appendObjectToSheet(usersSheet, user);
  } else {
    // Update last_login
    user.last_login = new Date().toISOString();
    user.role = role || user.role; // allow switching role in MVP demo UI
  }
  
  // Log login action
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
  return sheetToObjects(usersSheet);
}

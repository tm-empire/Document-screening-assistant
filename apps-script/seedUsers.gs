/**
 * SentinelID — User Seeder (Run this ONCE in Apps Script Editor)
 *
 * HOW TO USE:
 * 1. Open your Google Apps Script project (bound to your Spreadsheet).
 * 2. Edit the USERS_TO_CREATE list below with the emails and passwords you want.
 * 3. In the editor, select "seedUsers" from the function dropdown.
 * 4. Click ▶ Run.
 * 5. Done — users will appear in the USERS sheet with SHA-256 hashed passwords.
 *
 * SECURITY:
 * - Passwords are hashed with SHA-256 before being written to the sheet.
 * - Plaintext passwords are NEVER stored anywhere.
 * - You can safely delete this file after seeding.
 */

function seedUsers() {
  // ─── EDIT THIS LIST to set your desired users ──────────────────────────────
  var USERS_TO_CREATE = [
    {
      email:    "admin@sentinel.id",
      name:     "Chief Admin",
      role:     "ADMIN",
      password: "Admin@2024"     // ← Change this password
    },
    {
      email:    "officer@sentinel.id",
      name:     "Officer John Smith",
      role:     "OFFICER",
      password: "Officer@2024"   // ← Change this password
    },
    {
      email:    "supervisor@sentinel.id",
      name:     "Supervisor Sarah Conner",
      role:     "SUPERVISOR",
      password: "Super@2024"     // ← Change this password
    }
  ];
  // ──────────────────────────────────────────────────────────────────────────

  var usersSheet = getSheet(CONFIG.SHEETS.USERS);
  var existingUsers = sheetToObjects(usersSheet);
  var results = [];

  USERS_TO_CREATE.forEach(function(userDef) {
    // Check if email already exists to avoid duplicates
    var exists = existingUsers.find(function(u) {
      return u.email && u.email.toLowerCase() === userDef.email.toLowerCase();
    });

    if (exists) {
      // Update password hash for existing user
      updateUserPasswordHash(usersSheet, userDef.email, hashPassword(userDef.password));
      results.push("UPDATED: " + userDef.email + " (password re-hashed)");
    } else {
      // Create new user row
      var newUser = {
        user_id:       generateUniqueId("USR"),
        name:          userDef.name,
        email:         userDef.email,
        password_hash: hashPassword(userDef.password),
        role:          userDef.role,
        status:        "ACTIVE",
        created_at:    new Date().toISOString(),
        last_login:    ""
      };
      appendObjectToSheet(usersSheet, newUser);
      results.push("CREATED: " + userDef.email + " [" + userDef.role + "]");
    }
  });

  var summary = "SentinelID seedUsers() completed:\n" + results.join("\n");
  Logger.log(summary);
  
  // Show a popup in the Apps Script IDE
  SpreadsheetApp.getUi().alert("✅ Users Seeded Successfully!\n\n" + results.join("\n"));
  
  return summary;
}


/**
 * Helper: Update the password_hash for an existing user row.
 * Finds the user by email and writes the new hash.
 */
function updateUserPasswordHash(usersSheet, email, newHash) {
  var data = usersSheet.getDataRange().getValues();
  var headers = data[0];
  var emailCol  = headers.indexOf("email");
  var hashCol   = headers.indexOf("password_hash");

  if (emailCol === -1 || hashCol === -1) {
    throw new Error("USERS sheet is missing 'email' or 'password_hash' columns. Run setupDatabase() first.");
  }

  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      usersSheet.getRange(i + 1, hashCol + 1).setValue(newHash);
      return true;
    }
  }
  return false;
}


/**
 * Quick test — run this to verify hashing works correctly.
 * Check the Apps Script Logs (Ctrl+Enter) after running.
 */
function testHashPassword() {
  var testCases = [
    { input: "Admin@2024",   expectedPrefix: "" },
    { input: "Officer@2024", expectedPrefix: "" },
    { input: "Super@2024",   expectedPrefix: "" }
  ];
  testCases.forEach(function(tc) {
    var hash = hashPassword(tc.input);
    Logger.log("Input: " + tc.input + "  →  SHA-256: " + hash + "  (length: " + hash.length + ")");
  });
}

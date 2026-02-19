// 10. perm-error.js
const fs = require('fs');
// Try to write to a typically protected location or use a mocked error if need be.
// Windows protected paths are harder to guarantee failure without admin, but let's try reading a directory as a file.
// Or just emit a custom error code.
const err = new Error("Permission Denied");
err.code = 'EACCES';
throw err;

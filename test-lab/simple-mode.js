// 9. simple-mode.js
// This script configures whylog to simple mode manually
require('../dist/register').configure({ simple: true });
throw new Error("This should be simple output!");

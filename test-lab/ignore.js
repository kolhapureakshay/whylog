// test-lab/ignore.js
// Configure whylog to ignore "IgnoredError"
const { configure } = require('../dist/index'); // Adjust path to built version
configure({ ignore: ['IgnoredError'] });

throw new Error('IgnoredError: This should not be reported by whylog');

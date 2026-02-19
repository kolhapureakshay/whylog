// 3. bad-import.js
// Tricky to simulate in pure CommonJS execution without actually using ES6 syntax that node might reject early.
// But we can try to force the error object if we can't trigger the syntax error safely.
// Actually, let's just write invalid syntax that whylog CLI should catch during compilation/parsing if possible,
// or runtime.
import { something } from 'somewhere';

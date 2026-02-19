// test-lab/syntax-loader.js
// Requires a file with broken syntax. Node should throw a SyntaxError.
// whylog should show the location in the *bad* file, not here.

console.log('Loading faulty module...');
try {
    require('./syntax-bad-file.js');
} catch (e) {
    // Rethrow to let whylog catch it naturally, or if whylog is loaded it might catch it globaly
    throw e;
}

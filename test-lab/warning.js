// test-lab/warning.js
process.emitWarning('This is a test warning', 'TestWarning');
// Keep process alive briefly to ensure async warning handling if any
setTimeout(() => {}, 100);

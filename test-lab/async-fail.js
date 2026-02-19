// 2. async-fail.js
async function failAsync() {
  throw new Error('This promise was rejected!');
}
failAsync();

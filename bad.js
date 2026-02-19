// bad.js
function a() {
  b();
}

function b() {
  c();
}

function c() {
  throw new Error("This is a test error from whylog!");
}

a();

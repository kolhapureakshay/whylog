// Mock test for Express.js error tracking
const { expressErrorHandler } = require('../dist/index.js');

async function testExpressError() {
  const error = new Error('Database connection failed (mock express error)');
  
  const req = {};
  const res = {
    headersSent: false,
    status: function(code) { return this; },
    json: function(data) { }
  };
  const next = (err) => {};

  // Calling the whylog express plugin manually
  await expressErrorHandler(error, req, res, next);
}

testExpressError();

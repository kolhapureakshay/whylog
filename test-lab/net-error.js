// 7. net-error.js
const net = require('net');
const s1 = net.createServer().listen(4000);
const s2 = net.createServer().listen(4000);

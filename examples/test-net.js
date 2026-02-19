const net = require('net');
const server = net.createServer();
server.listen(3000, () => {
  const server2 = net.createServer();
  server2.listen(3000); // Crash
});

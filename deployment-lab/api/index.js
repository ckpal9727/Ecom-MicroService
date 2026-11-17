const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3000;
const containerId = os.hostname(); // The unique ID of this specific container replica

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'success',
    message: 'Hello from Scaled Production API!',
    servedByReplica: containerId, // Shows which container handled your request
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`API Replica [${containerId}] listening on port ${PORT}`);
});

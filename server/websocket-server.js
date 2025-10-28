// server/websocket-server.js
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const wss = new WebSocket.Server({ port: 8080 });
const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 }); // Adjust port
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  parser.on('data', (data) => {
    if (data.includes('<ZEPH>')) {
      ws.send(data);
      console.log(data)
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

console.log('WebSocket server running on port 8080');
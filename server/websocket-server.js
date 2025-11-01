// server/websocket-server.js
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
// const { parse } = require('next/dist/build/swc/generated-native');

const wss = new WebSocket.Server({ port: 8080 });
// const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 }); // Adjust port
const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200 }); // Adjust port
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

function parseTelemetry(packet) {
  if (!packet.startsWith('<ZEPH>')) return null;

  const clean = packet.replace('<ZEPH>', '').trim();
  let parts = clean.split(',');
  parts = parts.slice(1);

  if (parts.length !== 19) {
    console.log("Bad packet length:", parts.length, parts);
    return null;
  }

  const [timestamp, temperature, humidity, pressure, accelX, accelY, accelZ, gyroX, gyroY, gyroZ, pitch, roll, heading, lat, lon, altitude, satCount, hdop, hum_status] = parts;

  return {
    timestamp: parseInt(timestamp),
    temperature: parseFloat(temperature),
    humidity: parseFloat(humidity),
    pressure: parseFloat(pressure),
    accelX: parseFloat(accelX),
    accelY: parseFloat(accelY),
    accelZ: parseFloat(accelZ),
    gyroX: parseFloat(gyroX),
    gyroY: parseFloat(gyroY),
    gyroZ: parseFloat(gyroZ),
    pitch: parseFloat(pitch),
    roll: parseFloat(roll),
    heading: parseFloat(heading),
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    altitude: parseFloat(altitude),
    satelliteCount: parseInt(satCount),
    hdop: parseFloat(hdop),
    hum_status: parseInt(hum_status)
  };
}


// ✅ Single parser listener for all clients
parser.on('data', (line) => {
  if (!line.includes('<ZEPH>')) {
    console.log('Ignored:', line);
    return;
  }

  const data = parseTelemetry(line);
  if (!data) return;

  const json = JSON.stringify(data);
  console.log("TX:", json);

  // ✅ Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
});

wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
  });
});

console.log('✅ WebSocket server running on ws://localhost:8080');

// wss.on('connection', (ws) => {
//   console.log('WebSocket client connected');
  
//   parser.on('data', (data) => {
//     if (data.includes('<ZEPH>')) {
//       const parsedData = parseTelemetry(data);
//       if (!parsedData) return;
      
//       ws.send(data);
//       console.log(data)
//     }
//     else {
//       console.log('Ignored data:', data);
//     }
//   });

//   ws.on('close', () => {
//     console.log('WebSocket client disconnected');
//   });
// });

// console.log('WebSocket server running on port 8080');
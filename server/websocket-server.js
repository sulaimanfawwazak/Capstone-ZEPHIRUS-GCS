// server/websocket-server.js
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const wss = new WebSocket.Server({ port: 8080 });

let port;
let parser

async function connectPort() {
  const ports = await SerialPort.list();
  console.log("Available serial ports:", ports.map(p => p.path));

  // Prefer ttyUSB0, otherwise ttyACM0
  const device = ports.find(p => p.path.includes('ttyUSB0')) || ports.find(p => p.path.includes('ttyACM0'));

  if (!device) {
    console.error("❌ No serial port found! Retrying...");
    setTimeout(connectPort, 2000);
    return;
  }

  console.log("✅ Connecting to:", device.path);

  port = new SerialPort({
    path: device.path,
    baudRate: 115200,
    autoOpen: false
  });

  port.open(err => {
    if (err) {
      console.log("Open failed:", err.message);
    }
  });

  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

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

  // Handle unplug event
  port.on('close', () => {
    console.log("Serial disconnected!");

    if (parser) parser.removeAllListeners();
    if (port) port.removeAllListeners();

    port = null;
    parser = null;

    setTimeout(connectPort, 2000); // Retry later
  });

  port.on('error', (err) => {
    console.error("Serial error", err.message);

    if (parser) parser.removeAllListeners();
    if (port) port.removeAllListeners();

    port = null;
    parser = null;
    
    setTimeout(connectPort, 2000); // Retry later

  });
}

connectPort();

function parseTelemetry(packet) {
  if (!packet.startsWith('<ZEPH>')) return null;

  const clean = packet.replace('<ZEPH>', '').trim();
  let parts = clean.split(',');
  parts = parts.slice(1);

  if (parts.length !== 21) {
    console.log("Bad packet length:", parts.length, parts);
    return null;
  }

  const [
    timestamp, 
    temperature, 
    humidity, 
    pressure, 
    accelX, 
    accelY, 
    accelZ, 
    gyroX, 
    gyroY, 
    gyroZ, 
    pitch, 
    roll, 
    heading, 
    lat, 
    lon, 
    altitude, 
    satCount, 
    hdop,
    groundSpeed, 
    hum_status,
    rssi
  ] = parts;

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
    groundSpeed: parseFloat(groundSpeed),
    hum_status: parseInt(hum_status),
    signalStrength: parseInt(rssi)
  };
}

wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
  });
});

console.log('✅ WebSocket server running on ws://localhost:8080');
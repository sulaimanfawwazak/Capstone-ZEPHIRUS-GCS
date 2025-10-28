// hooks/useWebSocket.js
import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    if (!url) return;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.current.onmessage = (event) => {
      try {
        const parsedData = parseTelemetryData(event.data);
        setData(parsedData);
      } catch (err) {
        console.error('Error parsing telemetry data:', err);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return { data, isConnected, error };
}

// Parse the CSV data from ESP32
function parseTelemetryData(csvLine) {
  // Remove any whitespace and split by commas
  const cleanedLine = csvLine.trim().replace('<ZEPH>,', '');
  const values = cleanedLine.split(',');

  if (values.length < 15) {
    throw new Error('Invalid data format');
  }

  return {
    timestamp: parseInt(values[0]),
    temperature: parseFloat(values[1]),
    humidity: parseFloat(values[2]),
    pressure: parseFloat(values[3]),
    accelX: parseFloat(values[4]),
    accelY: parseFloat(values[5]),
    accelZ: parseFloat(values[6]),
    gyroX: parseFloat(values[7]),
    gyroY: parseFloat(values[8]),
    gyroZ: parseFloat(values[9]),
    heading: parseFloat(values[10]),
    lat: parseFloat(values[11]),
    lon: parseFloat(values[12]),
    altitude: parseFloat(values[13]),
    hum_status: parseInt(values[14]),
    
    // Derived values
    groundSpeed: calculateGroundSpeed(parseFloat(values[4]), parseFloat(values[5]), parseFloat(values[6])),
    satelliteCount: Math.floor(Math.random() * 12) + 4, // Mock satellite count
    hdop: (Math.random() * 2).toFixed(1), // Mock HDOP
    signalStrength: Math.floor(Math.random() * 30) + 70, // Mock signal strength
  };
}

function calculateGroundSpeed(accelX, accelY, accelZ) {
  // Simple ground speed calculation from acceleration
  const speed = Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
  return Math.min(speed * 10, 50); // Scale and limit speed
}
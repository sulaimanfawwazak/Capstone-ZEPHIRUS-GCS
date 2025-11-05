// hooks/useWebSocket.js
import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState("OFF");
  const [error, setError] = useState(null);
  
  const ws = useRef(null);
  const timeoutRef = useRef(null);

  const DISCONNECT_TIMEOUT = 5000; // 5 seconds
  const RSSI_THRESHOLD = 5; // 5%

  useEffect(() => {
    if (!url) return;

    ws.current = new WebSocket(url);

    // When connected successfully
    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setServerStatus("CONNECTED");
      setError(null);
    };

    ws.current.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);  // ✅ <-- direct JSON
        setData(json);

        // Make sure receiving data means "CONNECTED"
        setIsConnected(true);
        setServerStatus("CONNECTED");

        // ✅ check RSSI if exists
        if (json.rssi !== undefined && json.rssi < RSSI_THRESHOLD) {
          console.log("Signal too weak!");
          setIsConnected(false);
        }

        // ✅ reset timeout when data arrives
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          console.log("No data for 5 seconds → DISCONNECTED");
          setIsConnected(false);
          setServerStatus("DISCONNECTED");
        }, DISCONNECT_TIMEOUT);

      } catch (err) {
        console.error('Error parsing JSON:', err);
      }
    };

    // When server is OFF (connection refused)
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      setServerStatus("OFF");
      setError('Connection error');
    };

    // When server was connected but later disconnected
    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setServerStatus("OFF");
    };

    return () => {
      clearTimeout(timeoutRef.current);
      if (ws.current) ws.current.close();
    };
  }, [url]);

  return { data, isConnected, serverStatus, error };
}
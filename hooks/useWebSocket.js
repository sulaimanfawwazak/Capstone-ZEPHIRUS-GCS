// hooks/useWebSocket.js
import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url) {
  const [data, setData] = useState(null);
  // const [isConnected, setIsConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState("OFF");
  const [error, setError] = useState(null);
  
  const ws = useRef(null);
  const timeoutRef = useRef(null);
  const lastDataTimeRef = useRef(null);

  const DISCONNECT_TIMEOUT = 5000; // 5 seconds without data = disconnected
  const RSSI_THRESHOLD = 5; // 5%

  useEffect(() => {
    if (!url) return;

    ws.current = new WebSocket(url);

    // When connected successfully
    ws.current.onopen = () => {
      console.log('WebSocket connected to server');
      // setIsConnected(true);
      setServerStatus("CONNECTED"); // Set to CONNECTED first, but no UAV data yet
      setError(null);
      // lastDataTimeRef.current = Date.now();
      
      // Start checking for data timeout immediately
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        console.log("No UAV data received after connection → DISCONNECTED");
        setServerStatus("DISCONNECTED"); // Set to DISCONNECTED if the data hasn't arrived after 5 seconds
      }, DISCONNECT_TIMEOUT);
    };

    ws.current.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);
        setData(json);
        
        // Update last data time
        // lastDataTimeRef.current = Date.now();
        
        // ✅ We have UAV data - check signal strength
        if (json.rssi !== undefined && json.rssi < RSSI_THRESHOLD) {
          console.log("Signal too weak - DISCONNECTED");
          setServerStatus("DISCONNECTED");
        } else {
          // ✅ Good signal and data - we're CONNECTED
          setServerStatus("CONNECTED");
        }

        // ✅ Reset timeout when new data arrives
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          console.log("No UAV data for 5 seconds → DISCONNECTED");
          setServerStatus("DISCONNECTED");
        }, DISCONNECT_TIMEOUT);

      } catch (err) {
        console.error('Error parsing JSON:', err);
      }
    };

    // When server is OFF (connection refused)
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // setIsConnected(false);
      setServerStatus("OFF");
      setError('Connection error');
      clearTimeout(timeoutRef.current);
    };

    // When server was connected but later disconnected
    ws.current.onclose = () => {
      console.log('WebSocket disconnected from server');
      // setIsConnected(false);
      setServerStatus("OFF");
      clearTimeout(timeoutRef.current);
    };

    // Cleanup
    return () => {
      clearTimeout(timeoutRef.current);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  // return { data, isConnected, serverStatus, error };
  return { data, serverStatus, error };
}
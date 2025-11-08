// hooks/useFlightRecorder.js
import { useState, useRef, useEffect, useCallback } from 'react';

export function useFlightRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const recordingRef = useRef([]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    recordingRef.current = []; // Clear previous recording
    setRecordedData([]);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordedData([...recordingRef.current]);
    setRecordingStartTime(null);
  };

  const addDataPoint = useCallback((telemetryData) => {
    if (isRecording && telemetryData) {
      const dataPoint = {
        ...telemetryData,
        recordingTimestamp: Date.now() - recordingStartTime,
        absoluteTimestamp: Date.now()
      };
      recordingRef.current.push(dataPoint);
      setRecordedData([...recordingRef.current]);
    }
  }, [isRecording, recordingStartTime]);

  const clearRecording = () => {
    setIsRecording(false);
    setRecordedData([]);
    recordingRef.current = [];
    setRecordingStartTime(null);
  };

  // Export data in different formats
  const exportData = (format = 'csv') => {
    if (recordedData.length === 0) return null;

    switch (format) {
      case 'json':
        return JSON.stringify(recordedData, null, 2);
      
      case 'csv':
        return convertToCSV(recordedData);
      
      case 'txt':
        return convertToTXT(recordedData);
      
      default:
        return JSON.stringify(recordedData, null, 2);
    }
  };

  const downloadRecording = (format = 'csv') => {
    const data = exportData(format);
    if (!data) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'csv' ? 'csv' : format === 'txt' ? 'txt' : 'json';
    const filename = `flight-recording-${timestamp}.${extension}`;
    
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    isRecording,
    recordedData,
    recordingStartTime,
    startRecording,
    stopRecording,
    clearRecording,
    addDataPoint,
    exportData,
    downloadRecording,
    recordingDuration: recordingStartTime ? Date.now() - recordingStartTime : 0,
    dataPointsCount: recordedData.length
  };
}

// Helper function to convert to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

// Helper function to convert to formatted TXT
function convertToTXT(data) {
  return data.map((point, index) => 
    `Data Point ${index + 1}:\n${Object.entries(point)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n')}`
  ).join('\n\n');
}
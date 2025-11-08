// components/RecordingUploader.jsx
"use client";
import { useCallback, useRef } from 'react';
import { FaUpload, FaPlay, FaPause, FaStop, FaForward, FaBackward } from 'react-icons/fa';
import { IoIosCloseCircle } from "react-icons/io";

export default function RecordingUploader({ onRecordingLoaded, playback, serverStatus, onExitPlayback }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let data;
        
        // Try to parse as JSON first
        try {
          data = JSON.parse(content);
        } catch (jsonError) {
          // If JSON fails, try CSV
          data = parseCSV(content);
        }
        
        if (data && Array.isArray(data)) {
          onRecordingLoaded(data);
        } else {
          alert('Invalid recording file format');
        }
      } catch (error) {
        console.error('Error parsing recording file:', error);
        alert('Error loading recording file');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvContent) => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      
      headers.forEach((header, index) => {
        let value = values[index];
        // Try to parse numbers
        if (!isNaN(value) && value !== '') {
          value = parseFloat(value);
        }
        // Parse boolean strings
        else if (value === 'true' || value === 'false') {
          value = value === 'true';
        }
        row[header] = value;
      });
      
      data.push(row);
    }
    
    return data;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }
  };

  return (
    <div className="space-y-3">
      {/* File Upload */}
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json,.csv,.txt"
          className="hidden"
        />
        <button
          onClick={handleUploadClick}
          disabled={serverStatus !== "OFF"} // Disable during live flight
          className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          // title={isConnected ? "Stop live flight to load recording" : "Load flight recording"}
        >
          <FaUpload className="w-4 h-4" />
          Load Recording
        </button>
      </div>

      {/* Playback Controls */}
      {playback.hasRecording && (
        <div className="p-3 space-y-3 rounded-lg bg-gray-700/50">
          {/* Exit button */}
          <button
            onClick={onExitPlayback}
            className="text-red-500 transition-colors hover:text-red-600"
            title="Exit Playbacks"
          >
            <IoIosCloseCircle className="w-4 h-4"/>
          </button>
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-300">
              <span>{formatTime(playback.currentTime)}</span>
              <span>{formatTime(playback.duration)}</span>
            </div>
            <div className="w-full h-2 overflow-hidden bg-gray-600 rounded-full">
              <div 
                className="h-full transition-all duration-200 bg-green-500"
                style={{ width: `${(playback.currentFrameIndex + 1) / playback.frameCount * 100}% ` }}

              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={playback.stopPlayback}
                className="p-2 text-gray-300 transition-colors hover:text-white"
                title="Stop"
              >
                <FaStop className="w-4 h-4" />
              </button>
              
              {!playback.isPlaying ? (
                <button
                  onClick={playback.startPlayback}
                  className="p-2 text-gray-300 transition-colors hover:text-white"
                  title="Play"
                >
                  <FaPlay className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={playback.pausePlayback}
                  className="p-2 text-gray-300 transition-colors hover:text-white"
                  title="Pause"
                >
                  <FaPause className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Frame Info */}
            <div className="text-xs text-gray-300">
              {playback.currentFrameIndex + 1} / {playback.frameCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
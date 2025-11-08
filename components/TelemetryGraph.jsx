//components/TelemetryGraph.jsx
"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function TelemetryGraph({ data }) {
  const [selectedGraph, setSelectedGraph] = useState("Altitude");

  // Define available graph types
  const graphOptions = [
    "Altitude",
    "Accelerometer",
    "Gyroscope",
    "Temperature",
    "Humidity",
    "Heading",
    "Ground Speed",
    "Pitch",
    "Roll",
    "RSSI"
  ];

  // Choose which data keys to show based on selection
  let lines = [];
  switch (selectedGraph) {
    case "Accelerometer":
      lines = [
        { key: "accelX", name: "Accel X", color: "#8884d8" },
        { key: "accelY", name: "Accel Y", color: "#82ca9d" },
        { key: "accelZ", name: "Accel Z", color: "#ffc658" }
      ];
      break;
    case "Gyroscope":
      lines = [
        { key: "gyroX", name: "Gyro X", color: "#8884d8" },
        { key: "gyroY", name: "Gyro Y", color: "#82ca9d" },
        { key: "gyroZ", name: "Gyro Z", color: "#ffc658" }
      ];
      break;
    case "Altitude":
      lines = [{ key: "altitude", name: "Altitude (m)", color: "#00ff00" }];
      break;
    case "Temperature":
      lines = [{ key: "temperature", name: "Temperature (°C)", color: "#ff4444" }];
      break;
    case "Humidity":
      lines = [{ key: "humidity", name: "Humidity (%)", color: "#ff00ff" }];
      break;
    case "Heading":
      lines = [{ key: "heading", name: "Heading (°)", color: "#ff00ff" }];
      break;
    case "Ground Speed":
      lines = [{ key: "groundSpeed", name: "Ground Speed (m/s)", color: "#ff00ff" }];
      break;
    case "Pitch":
      lines = [{ key: "pitch", name: "Pitch (°)", color: "#ff00ff" }];
      break;
    case "Roll":
      lines = [{ key: "roll", name: "Roll (°)", color: "#ff00ff" }];
      break;
    case "RSSI":
      lines = [{ key: "signalStrength", name: "RSSI (%)", color: "#ff00ff"}];
      break;
  }

  return (
    <div className="flex flex-col w-full h-full p-2">
      {/* Dropdown selector */}
      <div className="flex justify-end mb-1">
        <select
          value={selectedGraph}
          onChange={(e) => setSelectedGraph(e.target.value)}
          className="p-1 text-sm bg-white border rounded-md"
        >
          {graphOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="timestamp"
              // tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip 
              // labelFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <Legend />
            {lines.map((line) => (
              <Line 
                key={line.key} 
                type="monotone" 
                dataKey={line.key}
                stroke={line.color}
                name={line.name}
                dot={false}
                strokeWidth={3}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

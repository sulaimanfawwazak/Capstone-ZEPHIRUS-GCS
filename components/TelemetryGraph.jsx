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
    "Ground Speed"
  ];

  // Choose which data keys to show based on selection
  let lines = [];
  switch (selectedGraph) {
    case "Accelerometer":
      lines = ["ACCEL_X", "ACCEL_Y", "ACCEL_Z"];
      break;
    case "Gyroscope":
      lines = ["GYRO_X", "GYRO_Y", "GYRO_Z"];
      break;
    case "Altitude":
      lines = ["ALTITUDE"];
      break;
    case "Temperature":
      lines = ["TEMPERATURE"];
      break;
    case "Humidity":
      lines = ["RELATIVE_HUMIDITY"];
      break;
    case "Heading":
      lines = ["HEADING"];
      break;
    case "Ground Speed":
      lines = ["GROUND_SPEED"];
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
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="TIMESTAMP" />
            <YAxis />
            <Tooltip />
            <Legend />
            {lines.map((lineKey) => (
              <Line key={lineKey} type="monotone" dataKey={lineKey} stroke="green" dot={false} strokeWidth={3}/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// pages/index.jsx
import dynamic from 'next/dynamic';
import Head from 'next/head';
import TelemetryGraph from '@/components/TelemetryGraph';
import FlightIndicators from '@/components/FlightIndicators';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FaLocationArrow, FaArrowsAltV, FaSatellite, FaWifi, FaSignal } from "react-icons/fa";
import { FaMapLocationDot, FaTemperatureHalf, FaRotate, FaPlaneCircleCheck, FaPlaneCircleXmark, FaPlaneUp } from "react-icons/fa6";
import { WiHumidity } from "react-icons/wi";
import { PiShowerFill } from "react-icons/pi";
import { GiSatelliteCommunication, GiPathDistance } from "react-icons/gi";
import { IoIosSpeedometer } from "react-icons/io";
import { IoLocationSharp, IoWaterSharp, IoHomeSharp } from "react-icons/io5";
import { TbAntennaBars5, TbRulerMeasure2 } from "react-icons/tb";
import { RiPinDistanceFill } from "react-icons/ri";
import { MdSatelliteAlt } from "react-icons/md";
import { useState, useEffect } from 'react';

// load only on client
const Map = dynamic(() => import("../components/Map"), { ssr: false });

// WebSocket server URL (you'll need to set this up)
const WS_URL = 'ws://localhost:8080';

// const planeLocation = { 
//   // set map view to DTETI
//   lat: -7.765719073300151, 
//   lng: 110.37171384759249
// }

// const sampleData = [
//   { TIMESTAMP: 1, ALTITUDE: 10, TEMPERATURE: 28, RELATIVE_HUMIDITY: 80, ACCEL_X: 0, ACCEL_Y: 0, ACCEL_Z: 1 },
//   { TIMESTAMP: 2, ALTITUDE: 12, TEMPERATURE: 29, RELATIVE_HUMIDITY: 81, ACCEL_X: 0.1, ACCEL_Y: 0.05, ACCEL_Z: 1.02 },
// ]

export default function Home() {
  const { data: telemetryData, isConnected, error } = useWebSocket(WS_URL);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  
  // Update history when new data arrives
  useEffect(() => {
    if (telemetryData) {
      setTelemetryHistory(prev => {
        const newHistory = [...prev, telemetryData];
        // Keep only last 50 data points for performance
        return newHistory.slice(-50);
      });
    }
  }, [telemetryData]);

  const homeLocation = {
    lat:-7.765199289055551,
    lng: 110.37247797203575
  }

  // Use real data or fallback to defaults
  const currentData = telemetryData || {
    temperature: 20,
    humidity: 80,
    altitude: 120.4,
    groundSpeed: 15,
    satelliteCount: 8,
    hdop: 0.9,
    signalStrength: 90,
    pitch: 1,
    roll: 2,
    heading: 127,
    lat: -7.765719073300151,
    lon: 110.37171384759249,
    hum_status: 0
  };

  const planeLocation = {
    lat: currentData.lat,
    lng: currentData.lon
  };

  // Icons for the map
  const planeIcon = {
    iconUrl: '/plane-logo-yellow.png',
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
  };
  const homeIcon = {
    iconUrl: '/home-logo.png',
    iconSize:     [40, 40], // size of the icon
    iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location    // shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
  };

  // Status color function
  const getStatusColor = (value, type) => {
    switch(type) {
      case 'signal':
        return  value >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                value >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                'bg-gradient-to-r from-red-500 to-red-600';
      case 'satellite':
        return  value >= 6 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                value >= 4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                'bg-gradient-to-r from-red-500 to-red-600';
      case 'system':
        return  value === 'ON' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                'bg-gradient-to-r from-red-500 to-red-600';
      default:
        return  'bg-gradient-to-r from-gray-700 to-gray-800';
    }
  };

  const planeStatus = "DISCONNECTED";

  return (
    <>
      {/* METADATA START */}
      <Head>
        <title>ZEPHIRUS GCS</title>
        <meta charSet='UTF-8'></meta>
        <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'></meta>
        <link rel='icon' href='/plane-emoji.png' sizes='any'/>
        <script src="js/reactjs/main.js" type = "text/babel"></script>
      </Head>
      {/* METADATA END */}
        
      {/* full width */}
      <div className='fixed inset-0 flex bg-gray-900'>
        
        {/* Left Side */}
        <div className='flex flex-col w-4/5 h-full'>
          
          {/* 3/4 of height - Map */}
          <div className='relative overflow-hidden h-3/4 '>
            <div className='absolute inset-0 z-0 bg-gradient-to-br from-blue-900/20 to-purple-900/10'></div>
            <Map
              homeLocation={homeLocation}
              planeLocation={planeLocation}
              homeIcon={homeIcon}
              planeIcon={planeIcon}
            />
          </div>

          {/* 1/4 of height - Graph */}
          <div className='border-gray-700 h-1/4 bg-gray-800/80 backdrop-blur-sm rounded-t-2xl'>
            <TelemetryGraph data={telemetryHistory}/>
          </div>
        </div>

        {/* 1/5 of width - Flight Data */}
        <div className='flex flex-col w-1/5 h-full border-l border-gray-700 bg-gray-800/90 backdrop-blur-sm'>

          {/* Header */}
          <div className='p-6 border-b border-gray-700'>
            <div className='flex items-center justify-between mb-4'>
              <h1 className='text-2xl font-bold text-white'>ZEPHIRUS</h1>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${
                isConnected 
                  ? "from-green-500 to-green-600" 
                  : "from-red-500 to-red-600"
              }`}>
                {isConnected 
                  ? <FaPlaneCircleCheck className='w-6 h-6 text-white'/>
                  : <FaPlaneCircleXmark className='w-6 h-6 text-white'/>
                }
                <span className='text-sm font-semibold text-white'>{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
              </div>
            </div>

            {/* Quick Status */}
            <div className='grid grid-cols-3 gap-3'>
              <div className='p-2 text-center rounded-lg bg-gray-700/50'>
                <p className='text-xs text-gray-400'>ALTITUDE</p>
                <p className='text-lg font-bold text-white'>{currentData.altitude.toFixed(1)}m</p>
              </div>
              <div className='p-2 text-center rounded-lg bg-gray-700/50'>
                <p className='text-xs text-gray-400'>SPEED</p>
                <p className='text-lg font-bold text-white'>{currentData.groundSpeed.toFixed(1)}m/s</p>
              </div>
              <div className='p-2 text-center rounded-lg bg-gray-700/50'>
                <p className='text-xs text-gray-400'>SIGNAL</p>
                <p className='text-lg font-bold text-white'>{currentData.signalStrength.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Flight Data Grid */}
          <div className='flex-1 p-4 overflow-y-auto'>
            <div className='grid grid-cols-2 gap-3'>
              
              {/* Telemetry Cards */}
              {[
                { icon: TbRulerMeasure2, label: 'Altitude', value: `${currentData.altitude.toFixed(1)} m`, color: 'default' },
                { icon: FaTemperatureHalf, label: 'Temperature', value: `${currentData.temperature.toFixed(1)} °C`, color: 'default' },
                { icon: IoWaterSharp, label: 'Humidity', value: `${currentData.humidity.toFixed(1)} %`, color: 'default' },
                { icon: IoIosSpeedometer, label: 'Ground Speed', value: `${currentData.groundSpeed.toFixed(1)} m/s`, color: 'default' },
                { icon: FaSatellite, label: 'Satellite Count', value: `${currentData.satelliteCount}`, color: 'satellite', valueColor: 'text-white' },
                { icon: MdSatelliteAlt, label: 'HDOP', value: `${currentData.hdop}`, color: 'satellite', valueColor: 'text-white' },
                { icon: FaSignal, label: 'Signal Strength', value: `${currentData.signalStrength} %`, color: 'signal', valueColor: 'text-white' },
                { icon: FaArrowsAltV, label: 'Pitch', value: `${currentData.pitch} °`, color: 'default' },
                { icon: FaRotate, label: 'Roll', value: `${currentData.roll} °`, color: 'default' },
                { icon: FaLocationArrow, label: 'Heading', value: `${currentData.heading.toFixed(1)} °`, color: 'default' },
                { icon: PiShowerFill, label: 'Humidifier', value: `${currentData.hum_status === 1 ? "ON" : "OFF"}`, color: 'system', valueColor: 'text-white' },
                { icon: RiPinDistanceFill, label: 'Distance to Home', value: `${currentData.altitude.toFixed(1)} m`, color: 'default', valueColor: 'text-white' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-xl ${getStatusColor(
                    item.color === 'signal' ? currentData.signalStrength : 
                    item.color === 'satellite' ? currentData.satelliteCount : 
                    item.value, item.color
                  )} backdrop-blur-sm border border-gray-600/30 shadow-lg`}
                >
                  <item.icon className='flex-shrink-0 w-5 h-5 mr-3 text-white' />
                  <div className='flex-1'>
                    <p className='text-xs font-medium text-white'>{item.label}</p>
                    <p className={`text-lg font-bold ${item.valueColor || 'text-white'}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}

              {/* Coordinate Cards */}
              <div className='flex flex-row w-full gap-4 mt-4 py-7'>
                <div className='p-3 border rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 backdrop-blur-sm border-gray-600/30'>
                  <div className='flex items-center mb-2'>
                    <FaPlaneUp className='w-4 h-4 mr-2 text-blue-400' />
                    <p className='text-sm font-semibold text-gray-300'>UAV Position</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs text-gray-400'>Lat: <span className='font-mono text-white'>{currentData.lat}</span></p>
                    <p className='text-xs text-gray-400'>Lon: <span className='font-mono text-white'>{currentData.lon}</span></p>
                  </div>
                </div>

                <div className='p-3 border rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 backdrop-blur-sm border-gray-600/30'>
                  <div className='flex items-center mb-2'>
                    <IoHomeSharp className='w-4 h-4 mr-2 text-green-400' />
                    <p className='text-sm font-semibold text-gray-300'>Home Position</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs text-gray-400'>Lat: <span className='font-mono text-white'>{homeLocation.lat}</span></p>
                    <p className='text-xs text-gray-400'>Lon: <span className='font-mono text-white'>{homeLocation.lng}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Indicators Section */}
          <div className='border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm'>
            <div className='p-4'>
              <FlightIndicators
                roll={currentData.roll}
                pitch={currentData.pitch}
                heading={currentData.heading}
              />
              <p className='mt-2 text-sm font-semibold text-center text-gray-300'>
                ATTITUDE & HEADING
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// pages/index.jsx
import dynamic from 'next/dynamic';
import Head from 'next/head';
import TelemetryGraph from '@/components/TelemetryGraph';
import FlightIndicators from '@/components/FlightIndicators';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useFlightRecorder } from '@/hooks/useFlightRecorder';
import { FaLocationArrow, FaArrowsAltV, FaSatellite, FaWifi, FaSignal, FaRecordVinyl, FaStop, FaDownload, FaTrash, FaCheck, FaEdit, FaCloudSun, FaSync, FaRobot, FaSpinner, FaBrain } from "react-icons/fa";
import { FaMapLocationDot, FaTemperatureHalf, FaRotate, FaPlaneCircleCheck, FaPlaneCircleXmark, FaPlaneUp } from "react-icons/fa6";
import { WiHumidity } from "react-icons/wi";
import { PiShowerFill } from "react-icons/pi";
import { GiSatelliteCommunication, GiPathDistance } from "react-icons/gi";
import { IoIosSpeedometer, IoIosCloseCircle } from "react-icons/io";
import { IoLocationSharp, IoWaterSharp, IoHomeSharp, IoSparkles } from "react-icons/io5";
import { TbAntennaBars5, TbRulerMeasure2 } from "react-icons/tb";
import { RiPinDistanceFill, RiResetLeftFill } from "react-icons/ri";
import { MdSatelliteAlt } from "react-icons/md";
import { LuServerOff } from "react-icons/lu";
import { RxCross2 } from "react-icons/rx";
import { useState, useEffect } from 'react';
import UAVModel from '@/components/UAVModel';
import RecordingUploader from '@/components/RecordingUploader';
import { useFlightPlayback } from '@/hooks/useFlightPlayback';
import { useSpriteAnimator } from '@react-three/drei';
import { useWeather } from '@/hooks/useWeather';
import { useFlightAnalysis } from '@/hooks/useFlightAnalysis';

// load only on client
const Map = dynamic(() => import("../components/Map"), { ssr: false });

// WebSocket server URL (you'll need to set this up)
const WS_URL = 'ws://localhost:8080';

const defaultHomeLocation = {
  lat: -7.7658938635,
  lng: 110.3717978432
};

export default function Home() {
  const { data: telemetryData, serverStatus, error } = useWebSocket(WS_URL); 
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [flightTrail, setFlightTrail] = useState([]);
  const [isFirstData, setIsFirstData] = useState(true);
  const [groundSpeed, setGroundSpeed] = useState(0);
  const [homeLocation, setHomeLocation]  = useState(defaultHomeLocation);
  const [isEditingHome, setIsEditingHome] = useState(false);
  const [tempHomeLocation, setTempHomeLocation] = useState(defaultHomeLocation);

  // Home Editing utils
  // Initialize editing when component mounts
  useEffect(() => {
    setTempHomeLocation(homeLocation);
  }, [homeLocation]);

  // Home location editing functions
  const startEditingHome = () => {
    setTempHomeLocation(homeLocation);
    setIsEditingHome(true);
  };

  const saveHomeLocation = () => {
    setHomeLocation(tempHomeLocation);
    setIsEditingHome(false);
  };

  const cancelEditingHome = () => {
    setTempHomeLocation(homeLocation);
    setIsEditingHome(false);
  };

  const resetHomeLocation = () => {
    setHomeLocation(defaultHomeLocation);
    setTempHomeLocation(defaultHomeLocation);
    setIsEditingHome(false);
  };

  //Handle coordinate input change
  const handleLatChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setTempHomeLocation(prev => ({ ...prev, lat: value }));
    }
  }

  const handleLonChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setTempHomeLocation(prev => ({ ...prev, lon: value }));
    }
  }

  // Initialize flight recorder
  const {
    isRecording,
    recordedData,
    recordingStartTime,
    startRecording,
    stopRecording,
    clearRecording,
    addDataPoint,
    downloadRecording,
    recordingDuration,
    dataPointsCount
  } = useFlightRecorder();

  const { 
    weatherData, 
    loading: weatherLoading, 
    error: weatherError, 
    fetchWeather, 
    getWeatherIcon,
    getFlightConditions 
  } = useWeather();
  
  const { 
    analysis,
    loading: analysisLoading,
    error: analysisError,
    showAnalysis,
    analyzeFlightConditions,
    analyzeWithGemini,
    hideAnalysis
  } = useFlightAnalysis();

  // Fetch weather when home location changes
  useEffect(() => {
    if (homeLocation.lat && homeLocation.lng) {
      fetchWeather(homeLocation.lat, homeLocation.lng);
    }
  }, [homeLocation, fetchWeather]);

  // // Analyze conditions when weather data updates
  // useEffect(() => {
  //   if (weatherData) {
  //     analyzeFlightConditions(weatherData, currentData);
  //   }
  // }, [weatherData, analyzeFlightConditions]);

  // Analyze conditions when weather data updates
  // useEffect(() => {
  //   if (weatherData) {
  //     analyzeWithGemini(weatherData);
  //   }
  // }, [weatherData, analyzeWithGemini]);
  
  // Update history when new data arrives
  useEffect(() => {
    if (telemetryData) {
      setTelemetryHistory(prev => {
        const newHistory = [...prev, telemetryData];
        return newHistory.slice(-50); // Keep only last 50 data points for performance
      });

      addDataPoint(telemetryData);

      setTelemetryHistory(prev => {
        if (prev.length > 0) {
          const prevPoint = prev[prev.length - 1];

          const distance = calculateDistance(
            prevPoint.lat, prevPoint.lon,
            telemetryData.lat, telemetryData.lon
          );

          const timeDelta = parseFloat((telemetryData.timestamp - prevPoint.timestamp) / 1000); // sec
          console.log("prev", telemetryData.timestamp);
          console.log("timeDelta", prevPoint.timestamp);
          console.log("timeDelta", timeDelta);
          
          if (timeDelta > 0) {
            const speed = distance / timeDelta;
            console.log("speed", speed);
            setGroundSpeed(speed); // ✅ store properly in state
          }
        }

        return prev; // no change to history here
      });

      // Update flight trail - keep ALL positions for entire path
      setFlightTrail(prev => {
        const newPosition = [telemetryData.lat, telemetryData.lon];
        
        // Only add new position if it's significantly different from last position
        if (prev.length === 0) {
          return [newPosition];
        }
        
        const lastPosition = prev[prev.length - 1];
        const distance = calculateDistance(lastPosition[0], lastPosition[1], newPosition[0], newPosition[1]);
        
        // Only add point if it's more than 1 meter away (reduces clutter)
        if (distance > 1) {
          return [...prev, newPosition];
        }
        
        return prev;
      });
      
      if (isFirstData) {
        setIsFirstData(false);
      }
    }
  }, [telemetryData, isFirstData, addDataPoint]);

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

  // Clear flight trail function
  const handleClearTrail = () => {
    setFlightTrail([]);
  };

  // Use real data or fallback to defaults
  const currentData = telemetryData || {
    temperature: 20,
    humidity: 80,
    altitude: 0,
    groundSpeed: 0,
    satelliteCount: 8,
    hdop: 0.9,
    signalStrength: 90,
    pitch: 0,
    roll: 0,
    heading: 0,
    lat: -7.765719073300151,
    lon: 110.37171384759249,
    hum_status: 0
  };

  // const planeLocation = {
  //   lat: currentData.lat,
  //   lng: currentData.lon
  // };

  // Calculate distance to home (simple haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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

  // Format recording duration
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Add playback functionality
  const playback = useFlightPlayback();

  // Determine if we're in playback mode or live mode
  const isPlaybackMode = playback.hasRecording && serverStatus === "OFF";
  const displayData = isPlaybackMode ? playback.getCurrentFrame() : currentData;

  // Handle recording loaded
  const handleRecordingLoaded = (data) => {
    playback.loadRecording(data);
  };

  // Add exit playback handler
  const handleExitPlayback = () => {
    // Stop any ongoing playback
    playback.stopPlayback();
    // Clear the playback data - this will make playback.hasRecording = false
    playback.loadRecording([]);
  };

  const planeLocation = {
    lat: displayData?.lat || currentData?.lat,
    lng: displayData?.lon || currentData?.lon
  };

  const distanceToHome = !isPlaybackMode 
    ? calculateDistance(currentData.lat, currentData.lon, homeLocation.lat, homeLocation.lng) 
    : calculateDistance(displayData?.lat, displayData?.lon, homeLocation.lat, homeLocation.lng);

  // Update your Map component to show playback trail
  const playbackTrail = playback.playbackData
    .filter(point => point.recordingTimestamp <= playback.currentTime)
    .map(point => [point.lat, point.lon]);

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
              heading={currentData.heading}
              flightTrail={isPlaybackMode ? playbackTrail : flightTrail}
              onClearTrail={handleClearTrail}
            />
          </div>

          {/* 1/4 of height - Graph & Attitude */}
          <div className='border-gray-700 h-1/4 bg-gray-800/80 backdrop-blur-sm rounded-t-2xl'>
            <TelemetryGraph data={
              !isPlaybackMode
                ? telemetryHistory
                : playback.playbackData.filter(point => point.recordingTimestamp <= playback.currentTime)}
            />
          </div>
        </div>

        {/* 1/5 of width - Flight Data */}
        <div className='flex flex-col w-1/5 h-full border-l border-gray-700 bg-gray-800/90 backdrop-blur-sm'>

          {/* Header */}
          <div className='p-6 border-b border-gray-700'>
            <div className='flex items-center justify-between mb-4'>
              <img src='/ZEPHIRUS-white.png' className='w-[42px]'/>
              <h1 className='text-2xl font-bold text-white'>ZEPHIRUS</h1>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${
                serverStatus === "CONNECTED"
                  ? "from-green-500 to-green-600" 
                  : serverStatus === "DISCONNECTED"
                    ? "from-red-500 to-red-600"
                    : "from-red-500 to-red-600" // Server off
              }`}>
                {serverStatus === "CONNECTED" && <FaPlaneCircleCheck className='w-6 h-6 text-white'/>}
                {serverStatus === "DISCONNECTED" && <FaPlaneCircleXmark className='w-6 h-6 text-white'/>}
                {serverStatus === "OFF" && <LuServerOff className='w-6 h-6 text-white'/>}
                
                <span className='text-sm font-semibold text-white'>
                  {serverStatus === "CONNECTED" && "CONNECTED" }
                  {serverStatus === "DISCONNECTED" && "DISCONNECTED" }
                  {serverStatus === "OFF" && "SERVER OFF" }
                </span>
              </div>
            </div>

            {/* */}

            {/* Recording Controls Section - Updated */}
            <div className='mb-4'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-semibold text-gray-300'>
                  {isPlaybackMode ? 'FLIGHT PLAYBACK' : 'FLIGHT RECORDER'}
                </span>
                <div className={`px-2 py-1 rounded text-xs ${
                  isRecording 
                    ? 'bg-red-500 text-white' 
                    : isPlaybackMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {isRecording ? '● RECORDING' : isPlaybackMode ? '▶ PLAYBACK' : 'READY'}
                </div>
              </div>
              
              {/* Recording Uploader */}
              <RecordingUploader 
                onRecordingLoaded={handleRecordingLoaded}
                playback={playback}
                serverStatus={serverStatus}
                onExitPlayback={handleExitPlayback}
              />
              
              {/* Only show recording controls if not in playback mode */}
              {!isPlaybackMode && (
                <div className='flex gap-2 mt-3'>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={serverStatus !== "CONNECTED"}
                      className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      <FaRecordVinyl className="w-4 h-4" />
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-yellow-600 rounded-lg hover:bg-yellow-700"
                    >
                      <FaStop className="w-4 h-4" />
                      Stop Recording
                    </button>
                  )}
                  
                  {recordedData.length > 0 && (
                    <button
                      onClick={() => downloadRecording('csv')}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                      title="Download as flight recording"
                    >
                      <FaDownload className="w-4 h-4" />
                    </button>
                  )}
                  
                  {recordedData.length > 0 && (
                    <button
                      onClick={clearRecording}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors bg-gray-600 rounded-lg hover:bg-gray-700"
                      title="Clear Recording"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Recording/Playback Status */}
              {isRecording && (
                <div className="mt-2 text-xs text-gray-400">
                  <div>Recording: {formatDuration(recordingDuration)}</div>
                  <div>Data Points: {dataPointsCount}</div>
                </div>
              )}
              
              {isPlaybackMode && (
                <div className="mt-2 text-xs text-blue-400">
                  <div>Playback: {Math.round(playback.progress * 100)}% Complete</div>
                </div>
              )}
              
              {recordedData.length > 0 && !isRecording && !isPlaybackMode && (
                <div className="mt-2 text-xs text-green-400">
                  ✓ Recorded {dataPointsCount} data points
                </div>
              )}
            </div>

            {/* Quick Status */}
            <div className='grid grid-cols-3 gap-3'>
              <div className='p-2 text-center rounded-lg bg-gray-600/50'>
                <p className='text-xs text-gray-400'>ALTITUDE</p>
                <p className='text-lg font-bold text-white'>{!isPlaybackMode ? currentData?.altitude : displayData?.altitude} m</p>
              </div>
              <div className='p-2 text-center rounded-lg bg-gray-600/50'>
                <p className='text-xs text-gray-400'>SPEED</p>
                <p className='text-lg font-bold text-white'>{!isPlaybackMode ? currentData?.groundSpeed : displayData?.groundSpeed} m</p>
              </div>
              <div className={`p-2 text-center rounded-lg ${
                (isPlaybackMode ? displayData?.signalStrength : currentData?.signalStrength) >= 80
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : (isPlaybackMode ? displayData?.signalStrength : currentData?.signalStrength) >= 50
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}>
                <p className='text-xs text-white'>SIGNAL</p>
                <p className='text-lg font-bold text-white'>
                  {isPlaybackMode ? displayData?.signalStrength : currentData?.signalStrength} %
                </p>
              </div>
            </div>
          </div>

          {/* Flight Data Grid */}
          <div className='flex-1 p-4 overflow-y-auto'>
            <p className='pb-4 text-sm font-semibold text-center text-gray-300'>
              FULL DATA
            </p>
            <div className='grid grid-cols-2 gap-3'>
              
              {/* Telemetry Cards */}
              {[
                { icon: TbRulerMeasure2, label: 'Altitude', value: `${!isPlaybackMode ? currentData?.altitude?.toFixed(1) : displayData?.altitude?.toFixed(1)} m`, color: 'default' },
                { icon: FaTemperatureHalf, label: 'Temperature', value: `${!isPlaybackMode ? currentData?.temperature?.toFixed(1) : displayData?.temperature?.toFixed(1)} °C`, color: 'default' },
                { icon: IoWaterSharp, label: 'Humidity', value: `${!isPlaybackMode ? currentData?.humidity?.toFixed(1) : displayData?.humidity?.toFixed(1)} %`, color: 'default' },
                { icon: IoIosSpeedometer, label: 'Ground Speed', value: `${!isPlaybackMode ? currentData?.groundSpeed : displayData?.groundSpeed} m/s`, color: 'default' },
                { icon: FaSatellite, label: 'Satellite Count', value: `${!isPlaybackMode ? currentData?.satelliteCount : displayData?.satelliteCount}`, color: 'satellite', valueColor: 'text-white' },
                { icon: MdSatelliteAlt, label: 'HDOP', value: `${!isPlaybackMode ? currentData?.hdop : displayData?.hdop}`, color: 'satellite', valueColor: 'text-white' },
                { icon: FaSignal, label: 'Signal Strength', value: `${!isPlaybackMode ? currentData?.signalStrength : displayData?.signalStrength} %`, color: 'signal', valueColor: 'text-white' },
                { icon: FaArrowsAltV, label: 'Pitch', value: `${!isPlaybackMode ? currentData?.pitch : displayData?.pitch} °`, color: 'default' },
                { icon: FaRotate, label: 'Roll', value: `${!isPlaybackMode ? currentData?.roll : displayData?.roll} °`, color: 'default' },
                { icon: FaLocationArrow, label: 'Heading', value: `${!isPlaybackMode ? currentData?.heading?.toFixed(1) : displayData?.heading?.toFixed(1)} °`, color: 'default' },
                { icon: PiShowerFill, label: 'Humidifier', value: `${(!isPlaybackMode ? currentData?.hum_status : displayData?.hum_status) === 1 ? "ON" : "OFF"}`, color: 'system', valueColor: 'text-white' },
                { icon: RiPinDistanceFill, label: 'Distance to Home', value: `${distanceToHome?.toFixed(1)} m`, color: 'default', valueColor: 'text-white' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-xl ${getStatusColor(
                    item.color === 'signal' ? currentData?.signalStrength : 
                    item.color === 'satellite' ? currentData?.satelliteCount : 
                    item.value, item.color
                  )} backdrop-blur-sm border border-gray-600/50 shadow-lg`}
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
            </div>

            {/* Coordinate Cards - Updated */}
            <div className='flex flex-col w-full gap-4 mt-4 border-t border-gray-700 py-7'>
              <p className='text-sm font-semibold text-center text-gray-300'>
                COORDINATES
              </p>
              <div className='grid w-full h-full grid-cols-2 gap-4 '>
                {/* UAV Position (unchanged) */}
                <div className='flex flex-col justify-center p-3 border rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 backdrop-blur-sm border-gray-600/30'>
                  <div className='flex items-center mb-2'>
                    <FaPlaneUp className='w-4 h-4 mr-2 text-blue-400' />
                    <p className='text-sm font-semibold text-gray-300'>UAV Position</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs text-gray-400'>Lat: <span className='font-mono text-white'>{!isPlaybackMode ? currentData?.lat?.toFixed(6) : displayData?.lat?.toFixed(6)}</span></p>
                    <p className='text-xs text-gray-400'>Lon: <span className='font-mono text-white'>{!isPlaybackMode ? currentData?.lon?.toFixed(6) : displayData?.lon?.toFixed(6)}</span></p>
                  </div>
                </div>

                {/* Home Position - Now Editable */}
                <div className='p-3 border rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 backdrop-blur-sm border-gray-600/30'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center'>
                      <IoHomeSharp className='w-4 h-4 mr-2 text-green-400' />
                      <p className='text-sm font-semibold text-gray-300'>Home Position</p>
                    </div>
                    <div className='flex gap-1'>
                      {!isEditingHome ? (
                        <button
                          onClick={startEditingHome}
                          className='p-0.5 text-xs text-blue-400 transition-colors hover:text-blue-300'
                          title='Edit Home Location'
                        >
                          <FaEdit />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={saveHomeLocation}
                            className='p-0.5 text-xs text-green-400 transition-colors hover:text-green-300'
                            title='Save'
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={cancelEditingHome}
                            className='p-0.5 text-xs text-red-400 transition-colors hover:text-red-300'
                            title='Cancel'
                          >
                            <RxCross2 />
                          </button>
                        </>
                      )}
                      <button
                        onClick={resetHomeLocation}
                        className='p-0.5 text-xs text-yellow-400 transition-colors hover:text-yellow-300'
                        title='Reset to Default'
                      >
                        <RiResetLeftFill />
                      </button>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    {isEditingHome ? (
                      <>
                        <div>
                          <label className='text-xs text-gray-400'>Latitude:</label>
                          <input
                            type="number"
                            step="any"
                            value={tempHomeLocation.lat}
                            onChange={handleLatChange}
                            className="w-full p-1 font-mono text-xs text-white bg-gray-600 border border-gray-500 rounded"
                          />
                        </div>
                        <div>
                          <label className='text-xs text-gray-400'>Longitude:</label>
                          <input
                            type="number"
                            step="any"
                            value={tempHomeLocation.lng}
                            onChange={handleLonChange}
                            className="w-full p-1 font-mono text-xs text-white bg-gray-600 border border-gray-500 rounded"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className='text-xs text-gray-400'>Lat: <span className='font-mono text-white'>{homeLocation.lat.toFixed(6)}</span></p>
                        <p className='text-xs text-gray-400'>Lon: <span className='font-mono text-white'>{homeLocation.lng.toFixed(6)}</span></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Weather and Flight Analysis */}
            <div className='flex flex-col w-full gap-4 py-4 mt-4 border-t border-gray-700'>
              <p className='text-sm font-semibold text-center text-gray-300'>
                WEATHER & FLIGHT ANALYSIS
              </p>
              
              <div className='grid w-full grid-cols-1 gap-4'>
                {/* Weather Information */}
                <div className='p-3 border rounded-xl bg-gradient-to-r from-blue-700/50 to-blue-800/50 backdrop-blur-sm border-gray-600/30'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center'>
                      <FaCloudSun className='w-4 h-4 mr-2 text-blue-300' />
                      <p className='text-sm font-semibold text-gray-300'>Current Weather</p>
                    </div>
                    <button
                      onClick={() => fetchWeather(homeLocation.lat, homeLocation.lng)}
                      className='p-1 text-xs text-blue-400 transition-colors hover:text-blue-300'
                      title='Refresh Weather'
                      disabled={weatherLoading}
                    >
                      <FaSync className={`w-3 h-3 ${weatherLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {weatherLoading && (
                    <div className="text-center text-blue-400">Loading weather...</div>
                  )}
                  
                  {weatherError && (
                    <div className="text-center text-red-400">{weatherError}</div>
                  )}
                  
                  {weatherData && !weatherLoading && (
                    <div className='space-y-2'>
                      <div className='flex flex-col justify-between'>
                        <div className='flex justify-between'>
                          <span className='text-xs text-gray-400'>Condition:</span>
                          <span className='text-sm font-semibold text-white'>
                            {getWeatherIcon(weatherData.weatherCode)} {getFlightConditions(weatherData)}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-xs text-gray-400'>Temp:</span>
                          <span className='ml-1 text-xs font-semibold text-white'>{weatherData.temperature}°C</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-xs text-gray-400'>Humidity:</span>
                          <span className='ml-1 text-xs font-semibold text-white'>{weatherData.humidity}%</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-xs text-gray-400'>Wind:</span>
                          <span className='ml-1 text-xs font-semibold text-white'>{weatherData.windSpeed} m/s</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-xs text-gray-400'>Wind Direction:</span>
                          <span className='ml-1 text-xs font-semibold text-white'>{weatherData.windDirection} °</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-xs text-gray-400'>Rain:</span>
                          <span className='ml-1 text-xs font-semibold text-white'>{weatherData.rain} mm</span>
                        </div>
                      </div>
                      
                      <div className='pt-2 mt-2 border-t border-gray-600/50'>
                        <div className='text-xs text-gray-400'>
                          Flight Conditions: <span className={`font-semibold ${
                            getFlightConditions(weatherData) === 'Good' ? 'text-green-400' :
                            getFlightConditions(weatherData) === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {getFlightConditions(weatherData)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Flight Analysis */}
                <div className='p-3 border rounded-xl bg-gradient-to-r from-purple-700/50 to-purple-800/50 backdrop-blur-sm border-gray-600/30'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center'>
                      {/* <FaRobot className='w-4 h-4 mr-2 text-purple-300' /> */}
                      <IoSparkles className='w-4 h-4 mr-2 text-purple-300' />
                      <p className='text-sm font-semibold text-gray-300'>Flight Safety Analysis</p>
                    </div>

                    {/* Show close button when analysis is visible */}
                    {showAnalysis && (
                      <button
                        onClick={hideAnalysis}
                        className='p-1 text-xs text-red-400 transition-colors hover:text-red-300'
                        title='Hide Analysis'
                      >
                        <IoIosCloseCircle className="w-4 h-4" />
                      </button>
                    )}      
                  </div>

                  {/* Show button to trigger analysis when not visible */}
                  {!showAnalysis && (
                    <div className='space-y-3'>
                      <div className='text-xs text-center text-gray-400'>
                        Get AI-powered flight safety analysis
                      </div>
                      <div className='flex flex-col gap-2'>
                        <button
                          onClick={() => analyzeFlightConditions(weatherData, currentData)}
                          disabled={!weatherData || analysisLoading}
                          className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {analysisLoading ? (
                            <FaSpinner className="w-3 h-3 animate-spin" />
                          ) : (
                            <FaRobot className="w-3 h-3" />
                          )}
                          Quick Analysis
                        </button>
                        
                        {/* Optional: Gemini AI button if you have API key */}
                        {process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
                          <button
                            onClick={() => analyzeWithGemini(weatherData)}
                            disabled={!weatherData || analysisLoading}
                            className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            title="AI Analysis (Gemini)"
                          >
                            {analysisLoading ? (
                              <FaSpinner className="w-3 h-3 animate-spin" />
                            ) : (
                              <IoSparkles className="w-3 h-3" />
                            )}
                            AI Analysis
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show analysis results when visible */}
                  {showAnalysis && (
                    <>
                      {analysisLoading && (
                        <div className="flex items-center justify-center gap-2 text-purple-400">
                          <FaSpinner className="w-3 h-3 animate-spin" />
                          Analyzing conditions...
                        </div>
                      )}
                      
                      {analysisError && (
                        <div className="text-xs text-center text-red-400">{analysisError}</div>
                      )}
                      
                      {analysis && !analysisLoading && (
                        <div className='space-y-2 text-xs text-white'>
                          {analysis.split('. ').map((sentence, index) => (
                            sentence.trim() && (
                              <div key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{sentence.trim()}{index < analysis.split('. ').length - 1 ? '.' : ''}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Flight Indicators Section */}
          <div className='overflow-y-auto border-t border-gray-700 h-1/4 bg-gray-800/50 backdrop-blur-sm'>
            {/* 3D Attitude */}
            <div className='pb-4 -mt-12 border-b border-gray-700'>
              <UAVModel
                roll={!isPlaybackMode ? currentData?.roll : displayData?.roll}
                pitch={!isPlaybackMode ? currentData?.pitch : displayData?.pitch}
                heading={!isPlaybackMode ? currentData?.heading : displayData?.heading}
              />
              <p className='text-sm font-semibold text-center text-gray-300'>
                3D ORIENTATION
              </p>
            </div>

            {/* Artificial Horizon & Heading */}
            <div className='p-4'>
              <FlightIndicators
                roll={!isPlaybackMode ? currentData?.roll : displayData?.roll}
                pitch={!isPlaybackMode ? currentData?.pitch : displayData?.pitch}
                heading={!isPlaybackMode ? currentData?.heading : displayData?.heading}
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

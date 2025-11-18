// components/DeviceIncompatible.jsx
export default function DeviceIncompatible({ screenInfo, minWidth, minHeight }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 text-white bg-gray-900">
      <div className="max-w-md space-y-4 text-center">
        <div className="mb-4 text-6xl text-red-500">📱</div>
        
        <h1 className="text-2xl font-bold text-red-400">Device Not Supported</h1>
        
        <div className="space-y-2 text-gray-300">
          <p>This Ground Control Station requires a larger screen for optimal operation.</p>
          
          <div className="p-4 space-y-1 text-sm bg-gray-800 rounded-lg">
            <p><strong>Current Screen:</strong> {screenInfo.width} × {screenInfo.height} ({screenInfo.orientation})</p>
            <p><strong>Minimum Required:</strong> {minWidth} × {minHeight} (landscape)</p>
          </div>
          
          <p className="text-sm text-yellow-400">
            💡 <strong>Tip:</strong> Use a laptop, tablet in landscape mode, or desktop computer.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-700">
          {/* <p className="text-xs text-gray-500">
            ZEPHIRUS GCS v1.0 • Designed for professional UAV operations
          </p> */}
          <img src="/ZEPHIRUS-logo.png"/>
        </div>
      </div>
    </div>
  );
}
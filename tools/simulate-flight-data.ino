// === ESP32 UAV Telemetry Simulator ===
// Prints mock UAV flight data over Serial in CSV-like format
// Example: <ZEPH>,168293,27.34,91.2,1012.3,0.01,0.02,9.81,0.01,-0.02,0.01,182.4,-7.78945,110.37428,138.2,1

// Adjustable parameters
#define TRANSMISSION_INTERVAL_MS 500  // (adjust between 200–500 ms for 2–5 Hz)

float lat = -7.7657190733;
float lon = 110.3717138476;
float altitude = 100.0;
float pitch = 0;
float roll = 0;
unsigned long startTime;
float prevLat, prevLon, currLat, currLon;


void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("=== UAV Telemetry Simulation Started ===");
  startTime = millis();
}

void loop() {
  static unsigned long lastSend = 0; // Use `static` so lastSend doesn't reset to 0 every time `loop()` function is called
  unsigned long now = millis();

  if (now - lastSend >= TRANSMISSION_INTERVAL_MS) {
    lastSend = now;

    // Generate mock data
    unsigned long timestamp = (now - startTime) / 10;  // 0.1s resolution

    // DS18B20
    float temperature = randomFloat(18.0, 35.0);        // °C

    // SHT30
    float humidity = randomFloat(60.0, 95.0);           // %

    // GY87 - BMP180
    float pressure = randomFloat(1008.0, 1015.0);       // hPa

    // GY87 - MPU6050
    float accelX = randomFloat(-0.1, 0.1);
    float accelY = randomFloat(-0.1, 0.1);
    float accelZ = 9.81 + randomFloat(-0.05, 0.05);

    float gyroX = randomFloat(-0.05, 0.05);
    float gyroY = randomFloat(-0.05, 0.05);
    float gyroZ = randomFloat(-0.05, 0.05);

    pitch += randomFloat(-1.0, 1.0);
    pitch = constrain(pitch, -30, 30); // Constrain between -30 and 30 degrees

    roll += randomFloat(-1.0, 1.0);
    roll = constrain(roll, -45, 45); // Constrain between -45 and 45 degrees
    
    // GY271 - HMC5388L
    float heading = fmod((now / 100.0) + randomFloat(-3, 3), 360.0);
    if (heading < 0) heading += 360.0; // e.g. -5 becomes (-5) + 360 = 355

    // GPS movement simulation
    simulateGPSMovement();

    // GPS Satellite count
    int randomHelper = random(1, 100); // Random integer to simulate 1-100% of chance
    int satCount = (randomHelper > 80) ? random(10, 15) : random(3, 9); // Make the satCount 10-15 for 80% of the time

    // GPS hdop
    randomHelper = random(1, 100);
    float hdop = (randomHelper > 80) ? randomFloat(0.5, 1.5) : randomFloat(1.6, 4.0); // Make the hdop 0.1-0.9 for 80% of the time

    // Altitude: climb first 10s, then level off with small variation
    if (now < 10000) altitude += 0.2;  // climb phase
    else altitude += randomFloat(-10, 10);

    // Humidifier status
    int piezoStatus = (humidity > 90.0) ? 1 : 0;

    // Ground Speed
    static unsigned long prevTimestamp = 0;
    static float groundSpeed = 0;

    if (prevTimestamp != 0) {
      float distance = haversine(prevLat, prevLon, lat, lon); // meters
      float timeSec = (timestamp - prevTimestamp) / 10.0;     // timestamp is x10 ms
      if (timeSec > 0) {
        groundSpeed = distance / timeSec;
      }
    }
    prevTimestamp = timestamp;

    // RSSI
    randomHelper = random(1, 100);
    int rssi = (randomHelper > 80)? random(90, 100) : random(50, 90);

    // Print formatted CSV line
    // Walah cik blom ada pitch + roll nya loh ya
    String packet = "<ZEPH>";
    packet += "," + String(timestamp);
    packet += "," + String(temperature, 2);
    packet += "," + String(humidity, 2);
    packet += "," + String(pressure, 2);
    packet += "," + String(accelX, 2);
    packet += "," + String(accelY, 2);
    packet += "," + String(accelZ, 2);
    packet += "," + String(gyroX, 2);
    packet += "," + String(gyroY, 2);
    packet += "," + String(gyroZ, 2);
    packet += "," + String(pitch, 2);
    packet += "," + String(roll, 2);
    packet += "," + String(heading, 2);
    packet += "," + String(lat, 10);
    packet += "," + String(lon, 10);
    packet += "," + String(altitude, 2);
    packet += "," + String(satCount);
    packet += "," + String(hdop, 1);
    packet += "," + String(groundSpeed, 2);
    packet += "," + String(piezoStatus);
    packet += "," + String(rssi);
    Serial.println(packet);
    // Serial.print("Packet size: ");
    // Serial.println(packet.length());
    // Serial.printf("<ZEPH>,%lu,%.2f,%.2f,%.1f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.1f,%.10f,%.6f,%.1f,%d\n",
    //               timestamp, temperature, humidity, pressure,
    //               accelX, accelY, accelZ,
    //               gyroX, gyroY, gyroZ,
    //               heading, lat, lon, altitude, piezoStatus);
  }
}

// === Helper Functions ===

float randomFloat(float minVal, float maxVal) {
  return minVal + (maxVal - minVal) * (float)random(0, 10000) / 10000.0;
}

void simulateGPSMovement() {
  // Store previous BEFORE updating
  prevLat = lat;
  prevLon = lon;

  // Simulate forward motion (north-east-ish)
  // + small left/right drift for natural path
  // 1° lat ≈ 111,320 meters → 0.00002° ≈ 2.2 meter
  float step = 0.00002;  // controls flight speed (~2m/s)
  lat += step + randomFloat(-0.000005, 0.000005); // 0.000005 ≈ 0.55 m
  lon += step * 1.5 + randomFloat(-0.00001, 0.00001); // 0.00001 ≈ 1.1 m
}

float haversine(float lat1, float lon1, float lat2, float lon2) {
  const float R = 6371000.0; // meters
  float dLat = radians(lat2 - lat1);
  float dLon = radians(lon2 - lon1);
  float a = sin(dLat/2)*sin(dLat/2) +
            cos(radians(lat1))*cos(radians(lat2)) *
            sin(dLon/2)*sin(dLon/2);
  float c = 2 * atan2(sqrt(a), sqrt(1-a));
  return R * c;
}
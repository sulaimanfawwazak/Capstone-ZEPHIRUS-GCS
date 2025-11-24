# Ground Control Station (GCS) for ZEPHIRUS
ZEPHIRUS (Zero Emission PoC for Humidifier-Induced Rain UAV System)

## Setup
1. Clone the repository
<br>
`git clone git@github.com:sulaimanfawwazak/Capstone-ZEPHIRUS-GCS.git`

2. Install the dependencies
<br>
`npm install`

3. Run the GCS
<br>
- Run Both Frontend and Backend Simulataneously<br>
   - Production: `tools/run-gcs-prod.sh`
   - Development: `tools/rin-gcs-dev.sh`
- Run Just The Frontend or Just The Backend<br>
Use `--frontend` or `--backend` flag <br>
  - Production: `tools/run-gcs-prod.sh --frontend` or `tools/run-gcs-prod.sh --backend`
  - Development: `tools/run-gcs-dev.sh --frontend` or `tools/run-gcs-dev.sh --backend`
- Manually Run Frontend or Backend
  - Frontend: `npm run dev` (development) or `npm start` (production)
  - Backend: `node server/websocket-server.js` (development & production)
> To run the production script, you need to run `npm run start` first to compile the frontend.

4. Simulate UAV Data Using ESP32
<br>
You can simulate the UAV data being transmitted from the UAV and received by the ground receiver and connected to the laptop using these steps:
- Connect an ESP32 to your laptop using data cable
- Open Arduino IDE and copy & paste the `tools/simulate-flight-data.ino`
- Upload the code to the ESP32
- Run the GCS just like on the 3rd step
- Optionally you can hit the `RESET` button on the ESP32 or replug the ESP32 to your laptop to simulate the data from the start.
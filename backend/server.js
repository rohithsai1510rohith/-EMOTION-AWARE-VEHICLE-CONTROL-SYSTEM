const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;
const SERIAL_PORT = 'COM3'; // Configure your COM port here

let espData = {
  pot: 0,
  mode: "CALM"
};

let eyeData = {
  eyes_open: true,
  eye_closed_duration: 0 // continuous seconds
};

let hardwareState = {
  mode: 'CALM',
  pwm: 0,
  led: 'OFF',
  buzzer: 0,
  speed: 0,
  score: 0,
  emotion: 'NEUTRAL',
  espStatus: 'OFFLINE'
};

let fatigueLingerTimer = 0; // Keep buzzer on for a bit after trigger

// Initialize Serial Communication
let port;
try {
  port = new SerialPort({ path: SERIAL_PORT, baudRate: 115200 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  port.on('open', () => {
    console.log(`✅ Serial Connection Established on ${SERIAL_PORT}`);
    hardwareState.espStatus = 'ONLINE';
  });

  parser.on('data', (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.pot !== undefined) espData.pot = parsed.pot;
      if (parsed.mode) espData.mode = parsed.mode;
      hardwareState.espStatus = 'ONLINE';
      
      // Send immediate response back to ESP32
      const response = {
        mode: hardwareState.mode,
        pwm: hardwareState.pwm,
        led: hardwareState.led,
        buzzer: hardwareState.buzzer
      };
      port.write(JSON.stringify(response) + '\n');
    } catch (e) {
      // console.error('Serial Parse Error:', e);
    }
  });

  port.on('error', (err) => {
    console.error('❌ Serial Error:', err.message);
    hardwareState.espStatus = 'OFFLINE';
  });
} catch (e) {
  console.error('❌ Could not open serial port:', e.message);
}

// Eye Tracker Update Endpoint
app.post('/eyes', (req, res) => {
  const { eyes_open, eye_closed_duration } = req.body;
  if (eyes_open !== undefined) eyeData.eyes_open = eyes_open;
  if (eye_closed_duration !== undefined) eyeData.eye_closed_duration = eye_closed_duration;
  res.json({ success: true });
});

// React UI polls dashboard telemetry
app.get('/dashboard', (req, res) => {
  res.json({ ...hardwareState, ...espData, ...eyeData });
});

// Fast Hardware Evaluation Decision Engine
setInterval(() => {
  // Processing Logic Priority:
  // 1. CRITICAL CONDITION (eye_closed_duration >= 15s)
  // 2. FATIGUED CONDITION (eye_closed_duration >= 10s)
  // 3. NORMAL CONDITION (Eyes Open)

  const isCritical = eyeData.eye_closed_duration >= 15;
  const isFatigued = eyeData.eye_closed_duration >= 10;

  if (isCritical) {
    hardwareState.mode = "CRITICAL";
    hardwareState.pwm = 0;
    hardwareState.led = "RED";
    hardwareState.buzzer = 1;
    hardwareState.emotion = "GOTED"; 
  } 
  else if (isFatigued) {
    hardwareState.mode = "FATIGUED";
    hardwareState.pwm = 23;
    hardwareState.led = "RED";
    hardwareState.buzzer = 1;
    hardwareState.emotion = "GOTED";
  } 
  else if (eyeData.eyes_open === true) {
    // NORMAL CONDITION
    if (espData.pot <= 170) {
      // CALM MODE
      hardwareState.mode = "CALM";
      hardwareState.pwm = espData.pot;
      hardwareState.led = "GREEN";
      hardwareState.buzzer = 0;
      hardwareState.emotion = "NEUTRAL";
    } 
    else {
      // AGGRESSIVE MODE (pot > 170)
      hardwareState.mode = "AGGRESSIVE";
      hardwareState.pwm = Math.max(120, Math.min(150, espData.pot)); // clamp(pot, 120, 150)
      hardwareState.led = "BLUE";
      hardwareState.buzzer = 0;
      hardwareState.emotion = "NEUTRAL";
    }
  }

  // Speed calculation based on current PWM
  hardwareState.speed = Math.round((hardwareState.pwm / 255) * 180);

  // Send immediate response back to ESP32 (MANDATORY FORMAT)
  if (port && port.isOpen) {
    const response = {
      mode: hardwareState.mode,
      pwm: hardwareState.pwm,
      led: hardwareState.led,
      buzzer: hardwareState.buzzer
    };
    port.write(JSON.stringify(response) + '\n');
  }

}, 100); // 10Hz frequency for real-time response

app.listen(PORT, () => {
  console.log(`NeuroDrive Decision Engine running on port ${PORT}`);
});

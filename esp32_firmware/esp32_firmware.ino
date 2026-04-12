#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

WebServer server(80);

const int POT_PIN = 34;
const int ENA_PIN = 25;
const int IN1_PIN = 26;
const int IN2_PIN = 27;
const int BUZZER_PIN = 33;
const int PIN_RED = 14;
const int PIN_GREEN = 12;
const int PIN_BLUE = 13;

String currentEmotion = "CALM";
int targetSpeed = 0;  
int targetPwm = 0;
int currentPwm = 0;
int drivingScore = 100;
bool isBuzzerOn = false;
String currentLed = "GREEN";

unsigned long lastSerialTime = 0;
unsigned long lastDecayTime = 0;

void handleUpdate() {
  if (server.hasArg("emotion")) {
    String newEmotion = server.arg("emotion");
    if (newEmotion != currentEmotion) {
      if (newEmotion == "CALM") drivingScore += 2;
      else if (newEmotion == "AGGRESSIVE") drivingScore -= 5;
      else if (newEmotion == "FATIGUE") drivingScore -= 15;
      else if (newEmotion == "CRITICAL") drivingScore -= 50;
      
      if (drivingScore > 100) drivingScore = 100;
      if (drivingScore < 0) drivingScore = 0;
      
      currentEmotion = newEmotion;
    }
  }
  server.send(200, "text/plain", "OK");
}

void handleData() {
  String json = "{\n";
  json += "\"emotion\": \"" + currentEmotion + "\",\n";
  json += "\"speed\": " + String(targetSpeed) + ",\n";
  json += "\"pwm\": " + String(currentPwm) + ",\n";
  json += "\"score\": " + String(drivingScore) + ",\n";
  json += "\"buzzer\": " + String(isBuzzerOn ? "true" : "false") + ",\n";
  json += "\"led\": \"" + currentLed + "\"\n";
  json += "}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);

  pinMode(POT_PIN, INPUT);
  pinMode(IN1_PIN, OUTPUT);
  pinMode(IN2_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BLUE, OUTPUT);

  digitalWrite(IN1_PIN, HIGH);
  digitalWrite(IN2_PIN, LOW);

  ledcAttach(ENA_PIN, 5000, 8); 

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  server.on("/update", HTTP_GET, handleUpdate);
  server.on("/data", HTTP_GET, handleData);
  server.begin();
}

void loop() {
  server.handleClient();

  long sum = 0;
  for(int i = 0; i < 10; i++) {
    sum += analogRead(POT_PIN);
    delay(2);
  }
  int potVal = sum / 10;
  
  targetSpeed = map(potVal, 0, 4095, 0, 255);

  if (currentEmotion == "CALM") {
    currentLed = "GREEN";
    isBuzzerOn = false;
  } else if (currentEmotion == "AGGRESSIVE") {
    currentLed = "BLUE";
    isBuzzerOn = false;
  } else if (currentEmotion == "FATIGUED") {
    currentLed = "RED";
    isBuzzerOn = true;
  } else if (currentEmotion == "CRITICAL") {
    currentLed = "RED";
    isBuzzerOn = true;
  }

  // 10% Exponential Decay braking mechanism from Potentiometer limit
  if (isBuzzerOn) {
    if (millis() - lastDecayTime > 1000) {
        lastDecayTime = millis();
        // Decay target PWM slowly by 10% iteratively every second
        targetPwm = targetPwm * 0.90; 
        if (targetPwm < 1) targetPwm = 0;
    }
  } else {
    // Normal driving limits
    if (currentEmotion == "CALM") {
        targetPwm = targetSpeed;
    } else if (currentEmotion == "AGGRESSIVE") {
        targetPwm = max(120, min(150, targetSpeed));
    }
  }

  digitalWrite(BUZZER_PIN, isBuzzerOn ? HIGH : LOW);

  if (currentLed == "GREEN") {
    digitalWrite(PIN_RED, LOW); digitalWrite(PIN_GREEN, HIGH); digitalWrite(PIN_BLUE, LOW);
  } else if (currentLed == "YELLOW") {
    digitalWrite(PIN_RED, HIGH); digitalWrite(PIN_GREEN, HIGH); digitalWrite(PIN_BLUE, LOW);
  } else if (currentLed == "BLUE") {
    digitalWrite(PIN_RED, LOW); digitalWrite(PIN_GREEN, LOW); digitalWrite(PIN_BLUE, HIGH);
  } else if (currentLed == "RED") {
    digitalWrite(PIN_RED, HIGH); digitalWrite(PIN_GREEN, LOW); digitalWrite(PIN_BLUE, LOW);
  }

  if (currentPwm < targetPwm) currentPwm++;
  else if (currentPwm > targetPwm) currentPwm--;
  
  ledcWrite(ENA_PIN, currentPwm);

  if (millis() - lastSerialTime > 500) {
    lastSerialTime = millis();
    String json = "{\n";
    json += "\"emotion\": \"" + currentEmotion + "\",\n";
    json += "\"speed\": " + String(targetSpeed) + ",\n";
    json += "\"pwm\": " + String(currentPwm) + ",\n";
    json += "\"score\": " + String(drivingScore) + ",\n";
    json += "\"buzzer\": " + String(isBuzzerOn ? "true" : "false") + ",\n";
    json += "\"led\": \"" + currentLed + "\"\n";
    json += "}";
    Serial.println(json);
  }
  
  delay(10); 
}

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

// ================= CONFIG =================
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";
const char *server = "https://your-agro-app.vercel.app";
const char *apiKey = "AGRO_ROVER_SECURE_KEY_2024";

// ================= SENSORS =================
#define DHTPIN 33
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

LiquidCrystal_I2C lcd(0x27, 16, 2); 

HardwareSerial soilSerial(2); // GPIO 16 (RX), 17 (TX)

// ================= STATE =================
float phVal = 7.0, ldrVal = 0, soilTemp = 0;
String currentPlant = "NONE";

void setup() {
  Serial.begin(115200);
  soilSerial.begin(9600, SERIAL_8N1, 16, 17);
  
  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0,0); lcd.print("VANGUARD AGRO");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); lcd.setCursor(0,1); lcd.print("Connecting WiFi...");
  }
  lcd.clear(); lcd.print("WiFi Connected!");
}

void readSoil() {
  if (soilSerial.available()) {
    String data = soilSerial.readStringUntil('\n');
    // Parser for "PH:x,LDR:x,TEMP:x"
    int phIdx = data.indexOf("PH:");
    int ldrIdx = data.indexOf("LDR:");
    if (phIdx != -1) phVal = data.substring(phIdx + 3, data.indexOf(",", phIdx)).toFloat();
    if (ldrIdx != -1) ldrVal = data.substring(ldrIdx + 4).toFloat();
  }
}

void updateLCD() {
  lcd.setCursor(0,0);
  lcd.print("PH:"); lcd.print(phVal, 1);
  lcd.print(" T:"); lcd.print(dht.readTemperature(), 0);
  lcd.setCursor(0,1);
  lcd.print("P:"); lcd.print(currentPlant.substring(0, 10));
}

void sendTelemetry() {
  HTTPClient http;
  http.begin(String(server) + "/api/device/data");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  StaticJsonDocument<1024> doc;
  doc["device_id"] = "rover_001";
  doc["plant_id"] = currentPlant;

  JsonObject sensors = doc.createNestedObject("sensors");
  JsonObject env = sensors.createNestedObject("environment");
  env["temperature"] = dht.readTemperature();
  env["humidity"] = dht.readHumidity();

  JsonObject soil = sensors.createNestedObject("soil");
  soil["ph"] = phVal;
  soil["light"] = ldrVal;

  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}

void loop() {
  readSoil();
  updateLCD();
  if (millis() % 5000 == 0) sendTelemetry();
  delay(500);
}
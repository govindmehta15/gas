#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>

// ================= CONFIG =================
const char *ssid = "YOUR_WIFI_SSID";    // ⚠️ CHANGE THIS
const char *password = "YOUR_WIFI_PWD"; // ⚠️ CHANGE THIS
const char *server = "https://gas-tawny-ten.vercel.app";
const char *apiKey = "AGRO_ROVER_SECURE_KEY_2024";

// ================= SENSORS =================
#define DHTPIN 33
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

LiquidCrystal_I2C lcd(0x27, 16, 2);
HardwareSerial roverSerial(2); // Serial to Arduino (GPIO 16 RX, 17 TX)

// ================= STATE =================
float phVal = 7.0;
String currentCommand = "";

void setup() {
  Serial.begin(115200);
  roverSerial.begin(9600, SERIAL_8N1, 16, 17); // Communication to Arduino

  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.print("Vanguard booting");

  int retry = 0;

  WiFi.disconnect(true); // Clear previous settings
  delay(1000);
  WiFi.mode(WIFI_STA); // Force Station Mode

  Serial.println("Starting WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(1000);
    retry++;
    lcd.setCursor(0, 1);
    lcd.print("Connecting... " + String(retry));
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    lcd.clear();
    lcd.print("CONNECTED!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
    Serial.println("\nWiFi Connected!");
  } else {
    lcd.clear();
    lcd.print("FAILED: ");
    int status = WiFi.status();
    if (status == WL_NO_SSID_AVAIL)
      lcd.print("NO SSID");
    else if (status == WL_CONNECT_FAILED)
      lcd.print("WRONG PWD");
    else
      lcd.print(status); // Show numerical code

    Serial.print("\nConnection Failed. Code: ");
    Serial.println(status);
  }
}

void checkServerCommands() {
  if (WiFi.status() != WL_CONNECTED)
    return;
  HTTPClient http;
  http.begin(String(server) + "/api/device/command?device_id=rover_001");
  http.addHeader("x-api-key", apiKey);

  int code = http.GET();
  if (code == 200) {
    String resp = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, resp);

    String action = doc["action"];
    // 🚚 RELAY COMMANDS TO ARDUINO
    if (action == "MOVE_FORWARD")
      roverSerial.println("M:10"); // Example 10 unit move
    else if (action == "TURN_RIGHT")
      roverSerial.println("T:90");
    else if (action == "EMERGENCY_STOP")
      roverSerial.println("S");

    // 📱 LOCAL FEEDBACK
    lcd.setCursor(0, 1);
    lcd.print(action.substring(0, 16));
  }
  http.end();
}

void sendTelemetry() {
  HTTPClient http;
  http.begin(String(server) + "/api/device/data");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  StaticJsonDocument<1024> doc;
  doc["device_id"] = "rover_001";
  doc["sensors"]["environment"]["temperature"] = dht.readTemperature();
  doc["sensors"]["soil"]["ph"] = phVal;

  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}

void loop() {
  checkServerCommands();
  if (millis() % 5000 == 0)
    sendTelemetry();
  delay(1000);
}
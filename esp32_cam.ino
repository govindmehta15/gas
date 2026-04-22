#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* server = "https://your-agro-app.vercel.app";
const char* apiKey = "AGRO_ROVER_SECURE_KEY_2024";

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  // ... (Full camera pin config based on AI_THINKER)
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) Serial.println("Camera init failed");
}

void captureAndUpload(String plantId) {
  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) return;

  HTTPClient http;
  http.begin(String(server) + "/api/device/vision");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  // Encode to Base64 (simplified for planning)
  String base64Image = "data:image/jpeg;base64,..."; 

  StaticJsonDocument<2048> doc;
  doc["device_id"] = "esp32_cam_001";
  doc["image_data"] = base64Image;
  doc["plant_id"] = plantId;

  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  
  esp_camera_fb_return(fb);
  http.end();
}

void checkCaptureCommand() {
  HTTPClient http;
  http.begin(String(server) + "/api/device/command?device_id=esp32_cam_001");
  http.addHeader("x-api-key", apiKey);

  int code = http.GET();
  if (code == 200) {
    String resp = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, resp);

    if (doc["action"] == "CAPTURE_PHOTO") {
      captureAndUpload(doc["plant_id"]);
    }
  }
  http.end();
}

void loop() {
  checkCaptureCommand();
  delay(3000);
}
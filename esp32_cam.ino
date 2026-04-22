#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ================= CONFIG =================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* server = "https://gas-tawny-ten.vercel.app";
const char* apiKey = "AGRO_ROVER_SECURE_KEY_2024";

// ================= AI THINKER PINOUT =================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// Simple Base64 helper
static const char base64_chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
String base64_encode(const unsigned char* bytes_to_encode, unsigned int in_len) {
  String ret; int i = 0, j = 0; unsigned char char_array_3[3], char_array_4[4];
  while (in_len--) {
    char_array_3[i++] = *(bytes_to_encode++);
    if (i == 3) {
      char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
      char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
      char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
      char_array_4[3] = char_array_3[2] & 0x3f;
      for(i = 0; (i <4) ; i++) ret += base64_chars[char_array_4[i]];
      i = 0;
    }
  }
  if (i) {
    for(j = i; j < 3; j++) char_array_3[j] = '\0';
    char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
    char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
    char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
    char_array_4[3] = char_array_3[2] & 0x3f;
    for (j = 0; (j < i + 1); j++) ret += base64_chars[char_array_4[j]];
    while((i++ < 3)) ret += '=';
  }
  return ret;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0; config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM; config.pin_d1 = Y3_GPIO_NUM; config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM; config.pin_d4 = Y6_GPIO_NUM; config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM; config.pin_d7 = Y9_GPIO_NUM; config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM; config.pin_vsync = VSYNC_GPIO_NUM; config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM; config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM; config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000; config.pixel_format = PIXFORMAT_JPEG;
  
  if(psramFound()){
    config.frame_size = FRAMESIZE_QVGA; // Small size for fast Base64 transmission
    config.jpeg_quality = 12; config.fb_count = 1;
  } else {
    config.frame_size = FRAMESIZE_QVGA; config.jpeg_quality = 12; config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) Serial.println("Camera init failed");
}

void captureAndUpload(String plantId) {
  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) { Serial.println("Failed to capture frame"); return; }

  // 1. Encode image to Base64
  String base64Img = "data:image/jpeg;base64," + base64_encode(fb->buf, fb->len);
  
  // 2. Upload to Server
  HTTPClient http;
  http.begin(String(server) + "/api/device/vision");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", apiKey);

  DynamicJsonDocument doc(40000); // Large enough for QVGA frame
  doc["device_id"] = "esp32_cam_001";
  doc["image_data"] = base64Img;
  doc["plant_id"] = plantId;

  String payload;
  serializeJson(doc, payload);
  int httpCode = http.POST(payload);
  Serial.println("Upload code: " + String(httpCode));
  
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
      captureAndUpload(doc["plant_id"] | "MANUAL");
    }
  }
  http.end();
}

void loop() {
  checkCaptureCommand();
  delay(3000);
}
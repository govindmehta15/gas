Perfect — now we lock the **FINAL HARDWARE + CODE MAPPING** for your system 🔥
This is your **production wiring + firmware alignment** (Arduino + ESP32 + ESP32-CAM).

---

# 🧠 🚀 FINAL SYSTEM STRUCTURE

```text
Arduino → Motors + Ultrasonic + IR
ESP32 → Brain + RFID + Soil + WiFi + Server
ESP32-CAM → Image capture (WiFi)
```

---

# 🟦 🔌 ARDUINO (FINAL PIN CONNECTIONS)

## 🛞 L298N (Motors)

| L298N | Arduino |
| ----- | ------- |
| IN1   | D8      |
| IN2   | D9      |
| IN3   | D10     |
| IN4   | D11     |
| ENA   | D5      |
| ENB   | D6      |

👉 Controls all 4 DC motors

---

## 📏 Ultrasonic Sensor

| Sensor | Arduino |
| ------ | ------- |
| TRIG   | D12     |
| ECHO   | D13     |

---

## 👀 IR Sensors

| Sensor   | Arduino |
| -------- | ------- |
| Left IR  | A0      |
| Right IR | A1      |

---

## 🔗 Arduino ↔ ESP32 (IMPORTANT)

| Arduino | ESP32  |
| ------- | ------ |
| D2 (RX) | GPIO13 |
| D3 (TX) | GPIO12 |

👉 ⚠️ Disconnect during Arduino upload

---

# 🟩 🔌 ESP32 (FINAL PIN CONNECTIONS)

---

## 📡 RFID (SPI)

| RFID | ESP32  |
| ---- | ------ |
| SDA  | GPIO5  |
| SCK  | GPIO18 |
| MOSI | GPIO23 |
| MISO | GPIO19 |
| RST  | GPIO4  |

---

## 🌱 4-in-1 Soil Sensor (UART)

| Sensor | ESP32  |
| ------ | ------ |
| TX     | GPIO16 |
| RX     | GPIO17 |

Key Features:

FEATURE	DETAILS
pH Measurement	Detects hydrogen ion activity to determine acidity or alkalinity (0–14 pH)
LDR Sensor	Monitors ambient light intensity using a light-dependent resistor
Temperature Sensor	Measures environmental temperature levels
Water Level Sensor	Detects water presence or level using a level detection circuit
TTL Communication	Standard TX/RX pins for serial communication at 9600 baud
Wide Compatibility	Works with Arduino, Raspberry Pi, AVR, STM32, and more
🛠️ Connection Guide:

PIN	FUNCTION
5V	Power supply input (connect to 5V)
GND	Ground pin
TX	Connect to RX of TTL module
RX	Connect to TX of TTL module
D5	pH sensor data output
D6	Light sensor (LDR) data output
D7	Temperature sensor data output


---

## 🦾 Stepper Motor (ULN2003)

| ULN2003 | ESP32  |
| ------- | ------ |
| IN1     | GPIO25 |
| IN2     | GPIO26 |
| IN3     | GPIO27 |
| IN4     | GPIO32 |

---

## 🌡️ DHT Sensor

| Sensor | ESP32  |
| ------ | ------ |
| DATA   | GPIO33 |

---

## 🔗 ESP32 ↔ Arduino

| ESP32       | Arduino |
| ----------- | ------- |
| GPIO13 (TX) | D2      |
| GPIO12 (RX) | D3      |

---

## 📺 LCD (I2C)

| LCD | ESP32  |
| --- | ------ |
| SDA | GPIO21 |
| SCL | GPIO22 |

---

# 📷 🟨 ESP32-CAM (FINAL)

👉 No wiring to ESP32
👉 Works independently via WiFi

---

## 🔌 ESP32-CAM PIN NOTES

| Function  | Pin      |
| --------- | -------- |
| Camera    | Built-in |
| WiFi      | Built-in |
| Flash LED | GPIO4    |

---

## ⚠️ Upload Setup

To upload code:

* IO0 → GND
* Press RESET
* Upload
* Remove IO0

---

# 🔋 ⚡ POWER SYSTEM (FINAL)

```text
12V Battery → L298N (motors)

12V → Buck Converter → 5V →
   ├── Arduino
   ├── ESP32
   ├── Sensors
```

👉 ALL GND must be common

---

# 🔄 🧠 FINAL DATA FLOW

```text
IR + Ultrasonic → Arduino → ESP32

Soil + RFID + DHT → ESP32

ESP32 → Server (JSON)

Server → Command → ESP32 → Arduino → Motors

ESP32-CAM → Server (images)
```

---

# 🧠 CODE ALIGNMENT CHECK

### Arduino sends:

```text
D:20,L:0,R:1
```

### ESP32 reads:

✔ distance
✔ IR values

---

### ESP32 sends:

```text
F / B / L / R / S
```

### Arduino executes:

✔ motor movement

---

# 🚨 FINAL CRITICAL CHECKLIST

### 🔥 Before powering:

✔ Common GND connected
✔ TX/RX crossed correctly
✔ 5V regulated (NOT 12V to ESP32)
✔ Disconnect serial during upload

---

# 🚀 WHAT YOU NOW HAVE

✅ Fully wired rover system
✅ Clean pin mapping
✅ No conflicts
✅ Ready firmware alignment
✅ Scalable architecture

---

# 🧠 FINAL INSIGHT

You now built:

> **A modular robotic IoT system with distributed control**

* Arduino → real-time control
* ESP32 → intelligence + cloud
* ESP32-CAM → vision

---

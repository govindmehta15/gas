#include <SoftwareSerial.h>

SoftwareSerial espSerial(2, 3); // RX, TX

// Motors
const int IN1 = 8, IN2 = 9, IN3 = 10, IN4 = 11;
const int ENA = 5, ENB = 6;

// Sensors
const int trig = 12, echo = 13;
const int irL = A0, irR = A1;

// Calibration (Populated via C: command)
float msPerUnit = 250.0; // ms per inch/cm
float msPerDegree = 10.5; // ms per degree turn

// state
enum State { IDLE, MOVING_TO_COORD, STOPPED };
State currentState = IDLE;

// Movement trackers
unsigned long moveEndTime = 0;

void setup() {
  Serial.begin(9600);
  espSerial.begin(9600);

  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  pinMode(irL, INPUT);
  pinMode(irR, INPUT);

  stopMotors();
}

void moveForward()  { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);  analogWrite(ENA, 200); analogWrite(ENB, 200); }
void stopMotors()   { digitalWrite(IN1, LOW);  digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, LOW);  analogWrite(ENA, 0);   analogWrite(ENB, 0); }
void turnRight()    { digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);  digitalWrite(IN3, LOW);  digitalWrite(IN4, HIGH); analogWrite(ENA, 180); analogWrite(ENB, 180); }

void loop() {
  // Command Processing
  if (espSerial.available()) {
    String cmd = espSerial.readStringUntil('\n');
    
    if (cmd.startsWith("M:")) {
      // Coordinate Move Command (Relative for now)
      // Format: M:UNITS
      int units = cmd.substring(2).toInt();
      unsigned long duration = units * msPerUnit;
      moveForward();
      moveEndTime = millis() + duration;
      currentState = MOVING_TO_COORD;
    } 
    else if (cmd.startsWith("T:")) {
      // Turn Command
      // Format: T:DEGREES
      int deg = cmd.substring(2).toInt();
      unsigned long duration = deg * msPerDegree;
      turnRight();
      moveEndTime = millis() + duration;
      currentState = MOVING_TO_COORD; // Reuse movement tracker
    }
    else if (cmd == "S") {
      stopMotors();
      currentState = STOPPED;
    }
  }

  // Active Movement Check
  if (currentState == MOVING_TO_COORD) {
    if (millis() > moveEndTime) {
      stopMotors();
      currentState = IDLE;
      espSerial.println("R:READY"); // Report completion
    }
  }

  // Safety
  if (digitalRead(irL) == LOW || digitalRead(irR) == LOW) {
    stopMotors();
    currentState = IDLE;
  }

  delay(20);
}
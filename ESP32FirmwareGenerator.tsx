import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  Info,
  Terminal,
  FileCode
} from 'lucide-react';

export const ESP32FirmwareGenerator: React.FC = () => {
  const [lang, setLang] = useState<'python' | 'arduino'>('python');
  const [ssid, setSsid] = useState('Mein_WLAN_Netzwerk');
  const [password, setPassword] = useState('GeheimesPasswort123');
  const [relayPin, setRelayPin] = useState(26);
  const [moisturePin, setMoisturePin] = useState(34);
  const [tankPin, setTankPin] = useState(35);
  const [copied, setCopied] = useState(false);

  const generatePythonCode = () => {
    return `# PlantPulse AI - ESP32 Smart-Home Firmware (MicroPython)
# =======================================================
# Platine: ESP32 (MicroPython Firmware)
# Dateiname: main.py
#
# Funktionen:
# - WLAN REST API Server (HTTP Endpoint /status und /water)
# - Kapazitiver Bodenfeuchtigkeitssensor an Pin GPIO ${moisturePin}
# - Wassertank Schwimmschalter an Pin GPIO ${tankPin}
# - Relais / Wasserpumpe an Pin GPIO ${relayPin}
# - Trockenlaufschutz auf Hardware-Ebene

import network
import time
import json
import usocket as socket
from machine import Pin, ADC

# WLAN Konfiguration
SSID = "${ssid}"
PASSWORD = "${password}"

# Pin Zuordnung
RELAY_PIN_NUM = ${relayPin}      # Relais fuer Wasserpumpe
MOISTURE_PIN_NUM = ${moisturePin}   # Kapazitiver Sensor (ADC Input)
TANK_FLOAT_PIN_NUM = ${tankPin} # Schwimmschalter (LOW = Tank voll, HIGH = Tank leer)

# Hardware Pins initialisieren
relay = Pin(RELAY_PIN_NUM, Pin.OUT)
relay.value(1) # High = Relais Aus (Low Active)

adc = ADC(Pin(MOISTURE_PIN_NUM))
adc.atten(ADC.ATTN_11DB) # Voller 0-3.6V Messbereich

tank_sensor = Pin(TANK_FLOAT_PIN_NUM, Pin.IN, Pin.PULL_UP)

AIR_VALUE = 3200
WATER_VALUE = 1300

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Verbinde mit WLAN...")
        wlan.connect(SSID, PASSWORD)
        while not wlan.isconnected():
            time.sleep(0.5)
            print(".", end="")
    print("\\nWLAN Verbunden! IP-Adresse:", wlan.ifconfig()[0])
    return wlan.ifconfig()[0]

ip_address = connect_wifi()

def get_moisture_percent():
    raw = adc.read()
    percent = int((AIR_VALUE - raw) * 100 / (AIR_VALUE - WATER_VALUE))
    return max(0, min(100, percent)), raw

def start_server():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(('', 80))
    s.listen(5)
    print("MicroPython PlantPulse REST Server laeuft auf Port 80...")

    while True:
        try:
            conn, addr = s.accept()
            request = conn.recv(1024).decode('utf-8')
            
            # 1. Endpunkt /status
            if "GET /status" in request:
                moisture_pct, raw_val = get_moisture_percent()
                is_empty = (tank_sensor.value() == 1)
                
                data = {
                    "status": "online",
                    "soilMoisturePercent": moisture_pct,
                    "rawAnalog": raw_val,
                    "isTankEmpty": is_empty,
                    "ip": ip_address
                }
                response = json.dumps(data)
                conn.send('HTTP/1.1 200 OK\\r\\nContent-Type: application/json\\r\\n\\r\\n' + response)
                
            # 2. Endpunkt /water
            elif "POST /water" in request or "GET /water" in request:
                is_empty = (tank_sensor.value() == 1)
                if is_empty:
                    err_resp = json.dumps({"error": "Wassertank leer. Trockenlaufschutz aktiv!"})
                    conn.send('HTTP/1.1 400 Bad Request\\r\\nContent-Type: application/json\\r\\n\\r\\n' + err_resp)
                else:
                    duration = 5
                    if "duration=" in request:
                        try:
                            param = request.split("duration=")[1].split(" ")[0].split("&")[0]
                            duration = int(param)
                            duration = max(1, min(20, duration))
                        except:
                            pass
                    
                    print("Giesse Pflanze fuer", duration, "Sekunden...")
                    relay.value(0) # Pumpe AN
                    time.sleep(duration)
                    relay.value(1) # Pumpe AUS
                    
                    succ_resp = json.dumps({"success": True, "durationSec": duration, "message": "Giessvorgang erfolgreich"})
                    conn.send('HTTP/1.1 200 OK\\r\\nContent-Type: application/json\\r\\n\\r\\n' + succ_resp)
            else:
                conn.send('HTTP/1.1 404 Not Found\\r\\nContent-Type: text/plain\\r\\n\\r\\n404 Not Found')
                
            conn.close()
        except Exception as e:
            print("Fehler im Webserver:", e)

start_server()
`;
  };

  const generateArduinoCode = () => {
    return `/*
  PlantPulse AI - ESP32 Smart-Home Firmware (Arduino C++)
  ===========================================
  Platine: ESP32 Dev Module
  Funktionen:
  - WLAN REST API Server (HTTP Endpoint /status und /water)
  - Kapazitiver Bodenfeuchtigkeitssensor an GPIO ${moisturePin}
  - Wassertank Schwimmschalter an GPIO ${tankPin}
  - Relais / Wasserpumpe an GPIO ${relayPin}
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "${ssid}";
const char* password = "${password}";

const int RELAY_PIN = ${relayPin};
const int MOISTURE_PIN = ${moisturePin};
const int TANK_FLOAT_PIN = ${tankPin};

const int AIR_VALUE = 3200;
const int WATER_VALUE = 1300;

WebServer server(80);

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
  
  pinMode(MOISTURE_PIN, INPUT);
  pinMode(TANK_FLOAT_PIN, INPUT_PULLUP);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  server.on("/status", HTTP_GET, []() {
    int rawAnalog = analogRead(MOISTURE_PIN);
    int moisturePercent = map(rawAnalog, AIR_VALUE, WATER_VALUE, 0, 100);
    moisturePercent = constrain(moisturePercent, 0, 100);
    bool isTankEmpty = (digitalRead(TANK_FLOAT_PIN) == HIGH);

    StaticJsonDocument<200> doc;
    doc["status"] = "online";
    doc["soilMoisturePercent"] = moisturePercent;
    doc["rawAnalog"] = rawAnalog;
    doc["isTankEmpty"] = isTankEmpty;
    doc["ip"] = WiFi.localIP().toString();

    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });

  server.on("/water", []() {
    bool isTankEmpty = (digitalRead(TANK_FLOAT_PIN) == HIGH);
    if (isTankEmpty) {
      server.send(400, "application/json", "{\\"error\\": \\"Wassertank leer\\"}");
      return;
    }
    int durationSec = server.hasArg("duration") ? server.arg("duration").toInt() : 5;
    digitalWrite(RELAY_PIN, LOW);
    delay(durationSec * 1000);
    digitalWrite(RELAY_PIN, HIGH);
    server.send(200, "application/json", "{\\"success\\":true}");
  });

  server.begin();
}

void loop() {
  server.handleClient();
}
`;
  };

  const codeString = lang === 'python' ? generatePythonCode() : generateArduinoCode();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const filename = lang === 'python' ? "main.py" : "PlantPulse_ESP32_Firmware.ino";
    const element = document.createElement("a");
    const file = new Blob([codeString], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Top Banner */}
      <div className="p-6 bg-slate-900 border border-emerald-900/50 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Code2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">ESP32 Firmware Generator</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generiere sauberen MicroPython (Python) oder C++ Code für deinen ESP32 Microcontroller.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setLang('python')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                lang === 'python' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>MicroPython (.py)</span>
            </button>
            <button
              onClick={() => setLang('arduino')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                lang === 'arduino' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Arduino C++ (.ino)
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
          <button
            onClick={handleDownloadFile}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'python' ? 'main.py' : '.ino'} Herunterladen</span>
          </button>
        </div>
      </div>

      {/* Configuration Inputs */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>WLAN & Hardware Pin-Parameter</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">WLAN SSID (Name)</label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">WLAN Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Relais Pin (Pumpe)</label>
            <input
              type="number"
              value={relayPin}
              onChange={(e) => setRelayPin(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bodenfeuchte Pin (ADC)</label>
            <input
              type="number"
              value={moisturePin}
              onChange={(e) => setMoisturePin(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Wassertank Schwimmschalter Pin</label>
            <input
              type="number"
              value={tankPin}
              onChange={(e) => setTankPin(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Hardware Wiring Guide */}
      <div className="p-4 bg-slate-950/80 border border-emerald-900/50 rounded-2xl flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-200 block">Schaltplan & MicroPython Hinweise:</span>
          <p className="text-slate-400">
            • <b>MicroPython Flashen:</b> Speichere diesen Code als <code>main.py</code> auf deinem ESP32 (z.B. mit Thonny IDE oder ampy).<br />
            • <b>Kapazitiver Feuchtigkeitssensor:</b> VCC → 3.3V, GND → GND, AOUT → GPIO {moisturePin}<br />
            • <b>Relaismodul (Wasserpumpe):</b> VCC → 5V (VIN), GND → GND, IN → GPIO {relayPin}<br />
            • <b>Schwimmschalter (Wassertank):</b> Pol 1 → GPIO {tankPin}, Pol 2 → GND
          </p>
        </div>
      </div>

      {/* Code Viewer Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'python' ? 'main.py (MicroPython)' : 'PlantPulse_ESP32_Firmware.ino (C++)'}</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-semibold">
            {lang === 'python' ? 'Python 3 / MicroPython' : 'Arduino C++'}
          </span>
        </div>

        <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-96 leading-relaxed">
          <code>{codeString}</code>
        </pre>
      </div>

    </div>
  );
};


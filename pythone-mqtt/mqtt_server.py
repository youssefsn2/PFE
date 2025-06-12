# mqtt_server.py (version finale robuste)
from flask import Flask, jsonify
import paho.mqtt.client as mqtt
import os
import time

app = Flask(__name__)

BROKER_ADDRESS = os.getenv("MQTT_BROKER", "localhost")
TOPIC = "capteurs/qualite_air"

air_quality_data = {}

def on_message(client, userdata, message):
    global air_quality_data
    payload = message.payload.decode("utf-8").split(",")
    print(f"📩 Message brut reçu sur le topic '{message.topic}'")

    if len(payload) == 6:
        try:
            air_quality_data = {
                "pm25": float(payload[0]),
                "pm10": float(payload[1]),
                "no2": float(payload[2]),
                "o3": float(payload[3]),
                "co": float(payload[4]),
                "aqi": int(payload[5])
            }
            print(f"✅ Données converties et stockées : {air_quality_data}")
        except ValueError as e:
            print(f"⚠️ Erreur de conversion : {e}")
    else:
        print(f"⚠️ Message ignoré, format incorrect.")

def connect_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = on_message
    while True:
        try:
            print(f"API Server: Tentative de connexion au broker à {BROKER_ADDRESS}...")
            client.connect(BROKER_ADDRESS, 1883)
            break # Sort de la boucle si la connexion réussit
        except ConnectionRefusedError:
            print("API Server: Connexion refusée. Le broker n'est peut-être pas prêt. Nouvelle tentative dans 5 secondes...")
            time.sleep(5)
    return client

client = connect_mqtt()
print("✅ API Server: Connecté au broker MQTT!")

client.subscribe(TOPIC)
client.loop_start()

@app.route("/api/capteurs", methods=["GET"])
def get_air_quality():
    if not air_quality_data:
        return jsonify({"message": "En attente des premières données du capteur..."}), 404
    return jsonify(air_quality_data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False) # Mettre debug=False est une bonne pratique dans Docker
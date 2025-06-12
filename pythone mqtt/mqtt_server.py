from flask import Flask, jsonify
import paho.mqtt.client as mqtt

app = Flask(__name__)

# Stocker les dernières données
air_quality_data = {}

def on_message(client, userdata, message):
    global air_quality_data
    payload = message.payload.decode("utf-8").split(",")

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
            print(f"📩 Données reçues : {air_quality_data}")
        except ValueError as e:
            print(f"⚠️ Erreur conversion : {e}")

client = mqtt.Client()
client.on_message = on_message
client.connect("localhost", 1883)
client.subscribe("capteurs/qualite_air")
client.loop_start()

@app.route("/api/capteurs", methods=["GET"])
def get_air_quality():
    return jsonify(air_quality_data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

import paho.mqtt.client as mqtt
import time
import random

BROKER_ADDRESS = "localhost"
TOPIC = "capteurs/qualite_air"

client = mqtt.Client()
client.connect(BROKER_ADDRESS, 1883)

while True:
    pm25 = round(random.uniform(5, 50), 2)
    pm10 = round(random.uniform(10, 100), 2)
    no2 = round(random.uniform(5, 40), 2)
    o3 = round(random.uniform(10, 80), 2)
    co = round(random.uniform(0.1, 2.0), 2)
    aqi = random.randint(0, 300)

    message = f"{pm25},{pm10},{no2},{o3},{co},{aqi}"
    client.publish(TOPIC, message)
    print(f"📤 Données envoyées : {message}")

    time.sleep(60)  # Envoie toutes les 60 secondes

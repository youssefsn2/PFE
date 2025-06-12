# sensor_publisher.py (version finale robuste)
import paho.mqtt.client as mqtt
import time
import random
import os

BROKER_ADDRESS = os.getenv("MQTT_BROKER", "localhost")
TOPIC = "capteurs/qualite_air"

def connect_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    while True:
        try:
            print(f"Publisher: Tentative de connexion au broker à {BROKER_ADDRESS}...")
            client.connect(BROKER_ADDRESS, 1883)
            break  # Sort de la boucle si la connexion réussit
        except ConnectionRefusedError:
            print("Publisher: Connexion refusée. Le broker n'est peut-être pas prêt. Nouvelle tentative dans 5 secondes...")
            time.sleep(5)
    return client

client = connect_mqtt()
print("✅ Publisher: Connecté au broker MQTT!")

# On lance la boucle de publication dans le client pour qu'elle tourne en arrière-plan
client.loop_start()

while True:
    pm25 = round(random.uniform(5, 50), 2)
    pm10 = round(random.uniform(10, 100), 2)
    no2 = round(random.uniform(5, 40), 2)
    o3 = round(random.uniform(10, 80), 2)
    co = round(random.uniform(0.1, 2.0), 2)
    aqi = random.randint(0, 300)

    message = f"{pm25},{pm10},{no2},{o3},{co},{aqi}"
    result = client.publish(TOPIC, message)
    # Vérifier si la publication a réussi
    if result[0] == 0:
        print(f"📤 Données envoyées : {message}")
    else:
        print(f"⚠️ Échec de l'envoi du message au topic {TOPIC}")

    time.sleep(10) # Envoie toutes les 10 secondes
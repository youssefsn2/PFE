# Utiliser une image Python officielle et légère
FROM python:3.9-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le fichier des dépendances et les installer
# On copie ce fichier en premier pour profiter du cache Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code de l'application
COPY . .

# La commande de lancement sera spécifiée dans docker-compose.yml
# pour chaque service.
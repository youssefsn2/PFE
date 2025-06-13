# Utilise l’image officielle Jenkins LTS
FROM jenkins/jenkins:lts

# Passe en mode root pour installer les dépendances
USER root

# Mise à jour du système et installation des prérequis pour Docker
RUN apt-get update && \
    apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Ajout de la clé GPG et du dépôt Docker officiel
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list

# Installation de Docker CLI uniquement (sans le daemon Docker)
RUN apt-get update && \
    apt-get install -y docker-ce-cli

# Installation de Docker Compose v2 en tant que plugin CLI (docker-compose → docker compose)
RUN curl -SL https://github.com/docker/compose/releases/download/v2.3.3/docker-compose-linux-x86_64 \
    -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    ln -s /usr/local/bin/docker-compose /usr/local/bin/docker

# Ajout de l'utilisateur Jenkins au groupe Docker
RUN groupadd docker || true && usermod -aG docker jenkins

# Reviens à l'utilisateur Jenkins
USER jenkins

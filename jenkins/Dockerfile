# /jenkins/Dockerfile

# On part de l'image Jenkins officielle
FROM jenkins/jenkins:lts

# On passe en utilisateur root pour installer des logiciels
USER root

# Installation des paquets nécessaires et de Docker
RUN apt-get update && apt-get install -y lsb-release curl
RUN curl -fsSLo /usr/share/keyrings/docker-archive-keyring.asc https://download.docker.com/linux/debian/gpg
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.asc] https://download.docker.com/linux/debian $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
RUN apt-get update && apt-get install -y docker-ce-cli

# Installation de Docker Compose V2
RUN curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
RUN chmod +x /usr/local/bin/docker-compose
# Créer un lien symbolique pour que 'docker compose' (avec espace) fonctionne aussi
RUN ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# On ajoute l'utilisateur jenkins au groupe docker pour qu'il ait les permissions
RUN usermod -aG docker jenkins

# On repasse à l'utilisateur jenkins pour la sécurité
USER jenkins
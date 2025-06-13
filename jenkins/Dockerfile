FROM docker:24.0.7-dind

# Installer les outils nécessaires
RUN apk add --no-cache \
    bash \
    curl \
    git \
    docker-cli \
    docker-compose

# Ajouter un utilisateur jenkins
RUN addgroup -S jenkins && adduser -S jenkins -G jenkins

USER jenkins
WORKDIR /home/jenkins

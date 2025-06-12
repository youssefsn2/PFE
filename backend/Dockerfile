# --- STAGE 1: Build ---
# Utilise une image Maven avec Java 17 pour compiler le projet
FROM maven:3.8.5-openjdk-17 AS builder

# Définit le répertoire de travail
WORKDIR /app

# Copie le fichier pom.xml pour télécharger les dépendances
COPY pom.xml .
RUN mvn dependency:go-offline

# Copie le reste du code source
COPY src ./src

# Compile l'application en un .jar, en sautant les tests pour accélérer le build
RUN mvn package -DskipTests


# --- STAGE 2: Run ---
# --- MODIFICATION ICI ---
# Utilise une image JRE beaucoup plus légère, officielle et maintenue
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copie le .jar compilé depuis le stage "builder"
COPY --from=builder /app/target/*.jar app.jar

# Expose le port sur lequel l'application tourne
EXPOSE 8080

# Commande pour lancer l'application au démarrage du conteneur
ENTRYPOINT ["java", "-jar", "app.jar"]
# /youssef/Dockerfile

# --- STAGE 1: Build ---
# --- MODIFICATION ICI ---
# Utilise Node.js version 20, compatible avec vos dépendances
FROM node:20-alpine AS builder

WORKDIR /app

# Copie package.json et package-lock.json
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie le reste des fichiers de l'application
COPY . .

# Construit l'application pour la production
RUN npm run build


# --- STAGE 2: Serve ---
# Utilise une image Nginx légère pour servir les fichiers statiques
FROM nginx:stable-alpine

# Copie les fichiers statiques construits depuis le stage "builder"
COPY --from=builder /app/build /usr/share/nginx/html

# Supprime la configuration par défaut de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copie notre propre configuration Nginx
COPY nginx.conf /etc/nginx/conf.d

# Expose le port 80 (port par défaut de Nginx)
EXPOSE 80

# Commande pour démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
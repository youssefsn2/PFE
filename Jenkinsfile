// Jenkinsfile - Version finale avec agent Docker personnalisé

pipeline {
    // --- Définition de l'Agent d'Exécution ---
    // Jenkins va construire une image Docker à partir du Dockerfile dans le dossier 'jenkins'
    // et exécutera toutes les étapes du pipeline à l'intérieur de cette image.
    // Cela garantit que Docker et Docker Compose sont toujours disponibles.
    agent {
        dockerfile {
            dir 'jenkins'
            // Arguments pour connecter le conteneur de build au Docker de l'hôte
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    // --- Variables d'Environnement ---
    environment {
        // Le nom du fichier docker-compose principal de votre application
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    // --- Étapes du Pipeline ---
    stages {
        // --- STAGE 1 : Nettoyage et Déploiement ---
        stage('Build & Deploy Application') {
            steps {
                echo '1. Construction des images Docker et déploiement des services...'
                sh '''
                    # Cette commande unique fait tout :
                    # --build : Reconstruit les images si le code ou les Dockerfiles ont changé.
                    # -d : Lance les conteneurs en arrière-plan (detached mode).
                    # --remove-orphans : Supprime les anciens conteneurs de services qui n'existent plus.
                    docker compose -f ${DOCKER_COMPOSE_FILE} up --build -d --remove-orphans
                '''
            }
        }

        // --- STAGE 2 : Vérification de Santé (Tests de fumée) ---
        stage('Application Health Check') {
            steps {
                script {
                    echo "2. Attente de 90 secondes pour la stabilisation des services..."
                    sleep(90) // On donne le temps aux applications de démarrer complètement.
                    
                    echo 'Vérification du service Backend...'
                    sh '''
                        # On utilise le nom du service 'backend' car tous les conteneurs
                        # de l'application sont dans le même réseau Docker ('app-net').
                        if ! curl -f --retry 5 --retry-delay 10 http://backend:8080/actuator/health; then
                            echo "ERREUR: Health check du Backend a échoué."
                            error "Le service Backend ne répond pas."
                        fi
                        echo "✅ Backend est en bonne santé."
                    '''
                    
                    echo 'Vérification du service Frontend...'
                    sh '''
                        if ! curl -f --max-time 10 http://frontend:80; then
                            echo "ERREUR: Health check du Frontend a échoué."
                            error "Le service Frontend ne répond pas."
                        fi
                        echo "✅ Frontend est accessible."
                    '''
                }
            }
        }
    }
    
    // --- Actions à exécuter à la fin du pipeline, quel que soit le résultat ---
    post {
        always {
            echo '3. Nettoyage final...'
            // Arrête tous les services de l'application après le build.
            // C'est utile si votre Jenkins n'est pas votre serveur de production.
            // Si c'est votre serveur de prod, vous pouvez commenter les 2 prochaines lignes.
            echo "Arrêt des services de l'application..."
            sh 'docker compose -f ${DOCKER_COMPOSE_FILE} down || true'

            // Supprime les images "orphelines" (anciennes versions qui ne sont plus utilisées)
            echo "Nettoyage des images Docker non utilisées..."
            sh 'docker image prune -af || true'
        }
        success {
            echo '✅ Le pipeline a été exécuté avec SUCCÈS !'
        }
        failure {
            echo '❌ Le pipeline a ÉCHOUÉ. Affichage des logs pour le débogage...'
            // Si quelque chose échoue, on affiche les logs des conteneurs pour trouver la cause.
            sh 'docker compose -f ${DOCKER_COMPOSE_FILE} logs --tail="200" || echo "Impossible de récupérer les logs."'
        }
    }
}
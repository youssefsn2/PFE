// Jenkinsfile - Version finale simplifiée
pipeline {
    agent any // On utilise l'agent de base, car il a maintenant tous les outils

    stages {
        stage('Checkout Code') {
            steps {
                echo '1. Récupération du code...'
                git url: 'https://github.com/youssefsn2/PFE.git', branch: 'main'
            }
        }

        stage('Build & Deploy Application') {
            steps {
                echo '2. Construction et déploiement de l application...'
                // La commande utilise "docker compose" (avec un espace)
                sh 'docker compose up --build -d'
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "3. Attente de 90 secondes..."
                    sleep(90)

                    echo "Vérification du Backend..."
                    sh '''
                        # On utilise host.docker.internal pour joindre les services
                        if ! curl -f --retry 3 http://host.docker.internal:8080/actuator/health; then
                            error "Le Backend a échoué au Health Check."
                        fi
                        echo "✅ Backend OK."
                    '''

                    echo "Vérification du Frontend..."
                     sh '''
                        if ! curl -f http://host.docker.internal:3000; then
                            error "Le Frontend a échoué au Health Check."
                        fi
                        echo "✅ Frontend OK."
                    '''
                }
            }
        }
    }
    
    post {
        // Cette partie ne change pas, elle gère ce qui se passe après
        always {
            echo '4. Nettoyage...'
            sh 'docker compose down --remove-orphans || true'
        }
        success {
            echo '✅ Pipeline Réussi !'
        }
        failure {
            echo '❌ Pipeline Échoué. Affichage des logs...'
            sh 'docker compose logs --tail=200 || true'
        }
    }
}

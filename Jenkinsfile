pipeline {
    agent {
        docker {
            image 'serhaneyoussef/agent-docker'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '1. Récupération du code...'
                git 'https://github.com/youssefsn2/PFE.git'
            }
        }

        stage('Build & Deploy Application') {
            steps {
                echo '2. Construction et déploiement de l application...'
                sh 'docker compose up --build -d'
            }
        }

        stage('Health Check') {
            steps {
                echo '3. Vérification de l’état du conteneur...'
                sh 'curl -f http://localhost:3000 || exit 1'
            }
        }
    }

    post {
        always {
            echo '4. Nettoyage...'
            sh 'docker compose down --remove-orphans || true'
        }

        failure {
            echo '❌ Pipeline Échoué. Affichage des logs...'
            sh 'docker compose logs --tail=200 || true'
        }
    }
}

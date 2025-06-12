pipeline {
    agent any
    stages {
        stage('Checkout Code') {
            steps {
                echo '1. Récupération du code depuis Git...'
                checkout scm
            }
        }
        stage('Clean Old Containers') {
            steps {
                echo '2. Arrêt et suppression des anciens conteneurs...'
                sh 'docker-compose down --remove-orphans || true'
            }
        }
        stage('Build & Deploy') {
            steps {
                echo '3. Construction des nouvelles images et démarrage des services...'
                sh 'docker-compose up --build -d'
            }
        }
        stage('Show Status') {
            steps {
                echo '4. Vérification du statut des conteneurs...'
                sh 'docker-compose ps'
            }
        }
    }
    post {
        always {
            echo 'Pipeline terminé.'
        }
        success {
            echo '🎉 Déploiement réussi !'
        }
        failure {
            echo '❌ Le pipeline a échoué.'
        }
    }
}
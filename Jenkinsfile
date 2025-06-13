pipeline {
    agent {
        dockerfile {
            filename 'Dockerfile'  // Ton fichier Dockerfile est à la racine
            dir 'jenkins'               // Ou spécifie le dossier si ce n’est pas à la racine
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
                sh 'docker-compose up --build -d'
            }
        }

        stage('Health Check') {
            steps {
                echo '3. Vérification des services...'
                sh 'docker-compose ps'
            }
        }
    }

    post {
        always {
            echo '4. Nettoyage...'
            sh 'docker-compose down --remove-orphans || true'
        }

        failure {
            echo '❌ Pipeline Échoué. Affichage des logs...'
            sh 'docker-compose logs --tail=200 || true'
        }
    }
}

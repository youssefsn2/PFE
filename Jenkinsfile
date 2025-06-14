pipeline {
  agent any

  environment {
    DOCKER_COMPOSE = 'docker-compose -f docker-compose.yml'
  }

  stages {
    stage('Cloner le code') {
      steps {
        git 'https://github.com/TON_REPO_GIT.git'
      }
    }

    stage('Build Frontend') {
      steps {
        sh "${DOCKER_COMPOSE} build frontend"
      }
    }

    stage('Build Backend') {
      steps {
        sh "${DOCKER_COMPOSE} build backend"
      }
    }

    stage('Tests') {
      steps {
        sh 'echo "Tests à venir ici (npm test, mvn test...)"'
      }
    }

    stage('Déploiement') {
      steps {
        sh "${DOCKER_COMPOSE} up -d"
      }
    }
  }
}

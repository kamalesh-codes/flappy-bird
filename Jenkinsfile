pipeline {
    agent any

    environment {
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        DOCKER_SOCK = 'unix:///home/iris/.docker/desktop/docker-cli.sock'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                // Use root as context so Dockerfile is found and can access src/
                sh "whoami"
                sh "ls -la"
                 sh "DOCKER_HOST=${DOCKER_SOCK} docker version"
                 sh "DOCKER_HOST=${DOCKER_SOCK} docker build -t flappy-bird:test -f Dockerfile ."
                 sh "DOCKER_HOST=${DOCKER_SOCK} docker run --rm flappy-bird:test npm test"
            }
        }

        stage('Build Production Image') {
            steps {
                  sh "DOCKER_HOST=${DOCKER_SOCK} docker build -t flappy-bird:${DOCKER_TAG} -t flappy-bird:latest -f Dockerfile ."
            }
        }

        stage('Deploy') {
            steps {
                  sh "DOCKER_HOST=${DOCKER_SOCK} docker stop flappy-bird-container || true"
                  sh "DOCKER_HOST=${DOCKER_SOCK} docker rm flappy-bird-container || true"
                  sh "DOCKER_HOST=${DOCKER_SOCK} docker run -d -p 3000:3000 --name flappy-bird-container flappy-bird:latest"
            }
        }
    }

    post {
        always {
            echo 'CI/CD Pipeline execution completed.'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}

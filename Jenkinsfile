pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'flappy-bird'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        DOCKER_LATEST = 'latest'
        DOCKER_HOST = 'unix:///home/iris/docker/desktop/docker-cli.sock'
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
                sh "docker build -t ${DOCKER_IMAGE}:test -f Dockerfile ."
                sh "docker run --rm ${DOCKER_IMAGE}:test npm test"
            }
        }

        stage('Build Production Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:${DOCKER_LATEST} -f Dockerfile ."
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker stop flappy-bird-container || true'
                sh 'docker rm flappy-bird-container || true'
                sh "docker run -d -p 3000:3000 --name flappy-bird-container ${DOCKER_IMAGE}:${DOCKER_LATEST}"
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

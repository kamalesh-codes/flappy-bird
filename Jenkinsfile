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
                // Use a temporary docker container to run tests so we don't need Node installed on the Jenkins host
                sh "docker build -t ${DOCKER_IMAGE}:test -f src/Dockerfile src"
                sh "docker run --rm ${DOCKER_IMAGE}:test npm test"
            }
        }

        stage('Build Production Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:${DOCKER_LATEST} -f src/Dockerfile src"
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

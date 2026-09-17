pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'flappy-bird'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        DOCKER_LATEST = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('src') {
                    sh 'npm ci'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('src') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:${DOCKER_LATEST} -f src/Dockerfile src"
            }
        }

        stage('Deploy') {
            steps {
                // Stop and remove existing container if it exists
                sh 'docker stop flappy-bird-container || true'
                sh 'docker rm flappy-bird-container || true'
                
                // Run the new container
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

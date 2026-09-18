pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                sh "whoami"
                sh "ls -la"
                sh "docker version"
            }
        }
    }
}

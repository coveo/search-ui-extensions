library(
    identifier: "jenkins-common-lib@v1.4",
    retriever: modernSCM(github(credentialsId: "github-app-dev", repository: "jenkins-common-lib", repoOwner: "coveo")),
    changelog: false
)

pipeline {
    agent {
        label "linux && docker"
    }
    options {
        timestamps()
        ansiColor("xterm")
        buildDiscarder(logRotator(numToKeepStr: "30"))
        timeout(time: 1, unit: "HOURS")
    }
    environment {
        NODE_IMAGE = "node:lts"
        DEPLOY_PIPELINE_IMAGE = '458176070654.dkr.ecr.us-east-1.amazonaws.com/jenkins/deployment_package:v7'
    }

    stages {
        stage("Setup") {
            steps {
                withDockerContainer(image: NODE_IMAGE, args: "-u root:root") {
                    sh "npm install"
                    sh "npm run lint"
                    sh "npm run testCoverage"
                    sh "npm run dev & npx wait-on http://localhost:8080"
                    sh "npx cypress run"
                }
            }
        }

        stage("Test package") {
            steps {
                withDockerContainer(image: NODE_IMAGE, args: "-u root:root") {
                    sh "node ./scripts/before.deploy.js"
                }

                withCredentials([string(credentialsId: 'snyk_token', variable: 'SNYK_TOKEN')]) {
                    runSnyk(org: "coveo-jsui", directory: ".")
                }

                withDockerContainer(image: DEPLOY_PIPELINE_IMAGE) {
                    sh "deployment-package package create --version ${params.NPM_PACKAGE_VERSION} --dry-run"
                }
            }
        }
        /*
        stage("Deploy") {
            steps {
                
                withDockerContainer(image: DEPLOY_PIPELINE_IMAGE) {
                    script {
                        packageName = sh (script: "deployment-package package create --version ${params.NPM_PACKAGE_VERSION}", returnStdout: true).trim()
                        sh "deployment-package package deploy --package-name ${packageName} --target-environment dev"
                    }
                }
            }
        }
        */
    }
}
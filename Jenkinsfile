library(
    identifier: "jenkins-common-lib@v1.6",
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
        stage("Build and Test") {
            steps {
                def buildImage = docker.build("build-image", "./DockerFile") 
                buildImage.inside {
                    withCredentials([string(credentialsId: 'coveralls-search-ui-extensions', variable: 'COVERALLS_REPO_TOKEN')]) {
                        sh "npm install"
                        sh "npm run lint"
                        sh "npm run build"
                        sh "npm run testCoverage"
                    }
                }
            }
        }

        stage("Snyk") {
            steps {
                withCredentials([string(credentialsId: 'snyk_token', variable: 'SNYK_TOKEN')]) {
                    runSnyk(org: "coveo-jsui", directory: ".")
                }
            }
        }

        stage("Deploy on Tag") {
            when {
                tag pattern: "^v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
            }
            steps {
                sh "mkdir -p s3/${TAG_NAME}"
                sh "cp -r bin/commonjs bin/css bin/es6 bin/img bin/typings s3/${TAG_NAME}"

                script {
                    deploymentPackage.command(
                        command: "package create",
                        parameters: [ withDeploy: true ]
                    )
                }
            }
        }
    }
}
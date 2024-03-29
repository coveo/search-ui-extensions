library(
    identifier: "jenkins-common-lib@master",
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
        NODE_IMAGE = "node:16"
        DEPLOY_PIPELINE_IMAGE = '458176070654.dkr.ecr.us-east-1.amazonaws.com/jenkins/deployment_package:v7'
        CYPRESS_CACHE_FOLDER = "${WORKSPACE}/.cache/cypress"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.cache/npm"
        XDG_CONFIG_HOME = "${WORKSPACE}"
    }

    stages {
        stage("Build and Test") {
            steps {
                withDockerContainer(image: NODE_IMAGE, args: "-u root:root") {
                    withCredentials([string(credentialsId: 'coveralls-search-ui-extensions', variable: 'COVERALLS_REPO_TOKEN')]) {
                        sh "mkdir -p .cache/cypress"
                        sh "mkdir -p .cache/.npm"
                        sh "chmod -R 777 .cache"
                        sh "apt-get update -qq"
                        sh "apt install -qq -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget"
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
                withDockerContainer(image: NODE_IMAGE, args: "-u root:root") {
                    withCredentials([string(credentialsId: 'snyk_token', variable: 'SNYK_TOKEN')]) {
                        sh "npx snyk test --org=coveo-jsui"
                    }
                }
            }
        }

        stage("Deploy on Tag") {
            when {
                tag pattern: "^v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
            }
            steps {
                sh "mkdir -p s3/searchuiextensions/${TAG_NAME}"
                sh "cp -r bin/commonjs bin/css bin/es6 bin/img bin/typings s3/searchuiextensions/${TAG_NAME}"

                script {
                    deploymentPackage.command(
                        command: "package create",
                        parameters: [ withDeploy: true ]
                    )
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}

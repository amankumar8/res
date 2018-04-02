String appName = 'vezio-core'
String repoUrl = 'git@bitbucket.org:vezio/vezio.git'
String repoCreds = '99e2a1ec-9cda-4eef-8cd6-b98b3f004272'
String settingsPath = 'config/settings/production.json'
String runtimeModules = 'babel-runtime braintree-web currency-codes iban pdfmake nouislider braintree google-auth-library fibers moment moment-business-days dropzone react react-dom prop-types lodash react-grid-layout parse-formdata'

def notifyBuild(String buildStatus) {
    // build status of null means successful
    buildStatus =  buildStatus ?: 'SUCCESSFUL'

    // Default values
    def colorCode = '#FFFFFF'
    def summary = "${buildStatus}: '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})"

    // Override default values based on build status
    if (buildStatus == 'SUCCESSFUL') {
        colorCode = '#36A64F'
    } else if (buildStatus == 'FAILURE') {
        colorCode = '#A63636'
    }

    // Send notifications
    slackSend (channel: "#vezio-core", color: colorCode, message: summary)
}

properties([[$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '30', artifactNumToKeepStr: '10', daysToKeepStr: '120', numToKeepStr: '10']]]);

try {
    node {
        stage('Preparing source tree') {
            sh('rm -rf bundle/')
    
            dir('source') {
                git(credentialsId: repoCreds,
                        url: repoUrl,
                        branch: env.BRANCH_NAME)
            }
    
        }
    
        stage('Building sources') {
            dir('source') {
    
                try {
                    if (runtimeModules) {
                        sh("meteor npm install ${runtimeModules}")
                    }
                } catch (e) {
                    println "NOTICE: extra runtime modules are not defined"
                }
    
                sh('meteor build ../ --directory --architecture os.linux.x86_64 --server-only')
            }
    
            dir('bundle/programs/server') {
                sh('meteor npm install')
            }
        }
        
         stage('Testing') {
            dir('source') {
                sh('''npm install
                meteor npm run coverage''')
            }
        }
        
        stage('SonarQube analysis') {
            dir('source') {
                def scannerHome = tool 'sonscanner';
                withSonarQubeEnv('sonar.vezio.company') {
                    sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=${appName} -Dsonar.javascript.lcov.reportPaths=$WORKSPACE/source/.coverage/lcov.info -Dsonar.sources=. -Dsonar.exclusions=\"node_modules/**/*\""
                }
            }
        }

        stage('Packing artefact') {
    
            sh("cp source/${settingsPath} bundle/settings.json")
    
            dir('bundle') {
                sh("tar czf ../${appName}.tar.gz .")
            }
            archiveArtifacts("${appName}.tar.gz")
        }

        stage('Cleanup Workspace') {
            // Cleanup everything except artefacts 
            cleanWs(deleteDirs: true, notFailBuild: true, patterns: [[pattern: '**/*.tar.gz', type: 'EXCLUDE']])
        }
    
    }
} catch (e) {
    currentBuild.result = "FAILURE"
    throw e
} finally {
    notifyBuild(currentBuild.result)
}

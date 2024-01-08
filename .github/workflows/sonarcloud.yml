# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

# This workflow helps you trigger a SonarCloud analysis of your code and populates
# GitHub Code Scanning alerts with the vulnerabilities found.
# Free for open source project.

# 1. Login to SonarCloud.io using your GitHub account

# 2. Import your project on SonarCloud
#     * Add your GitHub organization first, then add your repository as a new project.
#     * Please note that many languages are eligible for automatic analysis,
#       which means that the analysis will start automatically without the need to set up GitHub Actions.
#     * This behavior can be changed in Administration > Analysis Method.
#
# 3. Follow the SonarCloud in-product tutorial
#     * a. Copy/paste the Project Key and the Organization Key into the args parameter below
#          (You'll find this information in SonarCloud. Click on "Information" at the bottom left)
#
#     * b. Generate a new token and add it to your Github repository's secrets using the name SONAR_TOKEN
#          (On SonarCloud, click on your avatar on top-right > My account > Security
#           or go directly to https://sonarcloud.io/account/security/)

# Feel free to take a look at our documentation (https://docs.sonarcloud.io/getting-started/github/)
# or reach out to our community forum if you need some help (https://community.sonarsource.com/c/help/sc/9)

name: SonarCloud analysis

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:

permissions:
  pull-requests: read # allows SonarCloud to decorate PRs with analysis results

jobs:
  Analysis:
    runs-on: ubuntu-latest

    steps:
      - name: Analyze with SonarCloud

        # You can pin the exact commit or the version.
        # uses: SonarSource/sonarcloud-github-action@de2e56b42aa84d0b1c5b622644ac17e505c9a049
        uses: SonarSource/sonarcloud-github-action@de2e56b42aa84d0b1c5b622644ac17e505c9a049
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Needed to get PR information
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}   # Generate a token on Sonarcloud.io, add it to the secrets of this repo with the name SONAR_TOKEN (Settings > Secrets > Actions > add new repository secret)
        with:
          # Additional arguments for the sonarcloud scanner
          args:
            # Unique keys of your project and organization. You can find them in SonarCloud > Information (bottom-left menu)
            # mandatory
            -Dsonar.projectKey=
            -Dsonar.organization=
            # Comma-separated paths to directories containing main source files.
            #-Dsonar.sources= # optional, default is project base directory
            # When you need the analysis to take place in a directory other than the one from which it was launched
            #-Dsonar.projectBaseDir= # optional, default is .
            # Comma-separated paths to directories containing test source files.
            #-Dsonar.tests= # optional. For more info about Code Coverage, please refer to https://docs.sonarcloud.io/enriching/test-coverage/overview/
            # Adds more detail to both client and server-side analysis logs, activating DEBUG mode for the scanner, and adding client-side environment variables and system properties to the server-side log of analysis report processing.
            #-Dsonar.verbose= # optional, default is false

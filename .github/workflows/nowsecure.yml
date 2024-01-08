# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.
#
# NowSecure: The Mobile Security Experts <https://www.nowsecure.com/>.
#
# To use this workflow, you must be an existing NowSecure customer with GitHub Advanced Security (GHAS) enabled for your
# repository.
#
# If you *are not* an existing customer, click here to contact us for licensing and pricing details:
# <https://info.nowsecure.com/github-request>.
#
# Instructions:
#
# 1. In the settings for your repository, click "Secrets" then "New repository secret". Name the secret "NS_TOKEN" and
#    paste in your Platform token. If you do not have a Platform token, or wish to create a new one for GitHub, visit
#    NowSecure Platform and go to "Profile & Preferences" then create a token labelled "GitHub".
#
# 2. Follow the annotated workflow below and make any necessary modifications then save the workflow to your repository
#    and review the "Security" tab once the action has run.

name: "NowSecure"

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  nowsecure:
    name: NowSecure
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Build your application
        run: ./gradlew assembleDebug              # Update this to build your Android or iOS application

      - name: Run NowSecure
        uses: nowsecure/nowsecure-action@3b439db31b6dce857b09f5222fd13ffc3159ad26
        with:
          token: ${{ secrets.NS_TOKEN }}
          app_file: app-debug.apk                 # Update this to a path to your .ipa or .apk
          group_id: {{ groupId }}                 # Update this to your desired Platform group ID

      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: NowSecure.sarif

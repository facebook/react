#!/bin/bash
set -e -x


function publishRepo {
  COMPONENT=$1
  ARTIFACTS_DIR=$2

  BUILD_REPO="${COMPONENT}-builds"
  REPO_DIR="tmp/${BUILD_REPO}"

  echo "Pushing build artifacts to angular/${BUILD_REPO}"

  # create local repo folder and clone build repo into it
  rm -rf $REPO_DIR
  mkdir -p $REPO_DIR
  (
    cd $REPO_DIR && \
    git init && \
    git remote add origin $REPO_URL && \
    git fetch origin master && \
    git checkout origin/master && \
    git checkout -b master
  )

  # copy over build artifacts into the repo directory
  rm -rf $REPO_DIR/*
  cp -R $ARTIFACTS_DIR/* $REPO_DIR/

  # Replace $$ANGULAR_VESION$$ with the build version.
  BUILD_VER="2.0.0-${SHORT_SHA}"
  if [[ ${TRAVIS} ]]; then
    find $REPO_DIR/ -type f -name package.json -print0 | xargs -0 sed -i "s/\\\$\\\$ANGULAR_VERSION\\\$\\\$/${BUILD_VER}/g"
    UMD=$(find $REPO_DIR/ -type f -name "*umd.js" -print0)
    if [[ ${UMD} ]]; then
      sed -i "s/\\\$\\\$ANGULAR_VERSION\\\$\\\$/${BUILD_VER}/g" ${UMD}
    fi
  else
    find $REPO_DIR/ -type f -name package.json -print0 | xargs -0 sed -i '' "s/\\\$\\\$ANGULAR_VERSION\\\$\\\$/${BUILD_VER}/g"
    find $REPO_DIR/ -type f -name "*umd.js" -print0 | xargs -0 sed -i '' "s/\\\$\\\$ANGULAR_VERSION\\\$\\\$/${BUILD_VER}/g"
  fi
  echo `date` > $REPO_DIR/BUILD_INFO
  echo $SHA >> $REPO_DIR/BUILD_INFO

  (
    cd $REPO_DIR && \
    git config credential.helper "store --file=.git/credentials" && \
    echo "https://${GITHUB_TOKEN_ANGULAR}:@github.com" > .git/credentials && \
    git config user.name "${COMMITTER_USER_NAME}" && \
    git config user.email "${COMMITTER_USER_EMAIL}" && \
    git add --all && \
    git commit -m "${COMMIT_MSG}" && \
    git push origin master && \
    git tag "${BUILD_VER}" && \
    git push origin --tags --force
  )
}

# Publish all individual packages from packages-dist.
if [[ "$TRAVIS_REPO_SLUG" == "angular/angular" && \
      "$TRAVIS_PULL_REQUEST" == "false" && \
      "$CI_MODE" == "e2e" ]]; then
  for dir in dist/packages-dist/*/ dist/tools/@angular/tsc-wrapped
  do
    COMPONENT="$(basename ${dir})"

    # Replace _ with - in component name.
    COMPONENT="${COMPONENT//_/-}"
    JS_BUILD_ARTIFACTS_DIR="${dir}"

    REPO_URL="https://github.com/angular/${COMPONENT}-builds.git"
    # Use the below URL for testing when using SSH authentication
    # REPO_URL="git@github.com:angular/${COMPONENT}-builds.git"

    SHA=`git rev-parse HEAD`
    SHORT_SHA=`git rev-parse --short HEAD`
    COMMIT_MSG=`git log --oneline | head -n1`
    COMMITTER_USER_NAME=`git --no-pager show -s --format='%cN' HEAD`
    COMMITTER_USER_EMAIL=`git --no-pager show -s --format='%cE' HEAD`

    publishRepo "${COMPONENT}" "${JS_BUILD_ARTIFACTS_DIR}"
  done

  echo "Finished publishing build artifacts"
else
  echo "Not building the upstream/master branch, build artifacts won't be published."
fi

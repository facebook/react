set -e

if [[ -z $1 ]]; then
  echo "Enter new version: "
  read VERSION
else
  VERSION=$1
fi

read -p "Releasing $VERSION - are you sure? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Releasing $VERSION ..."

  if [[ -z $SKIP_TESTS ]]; then
    npm run lint
    npm run flow
    npm run test:cover
    npm run test:e2e
    npm run test:ssr
  fi

  # Sauce Labs tests has a decent chance of failing
  # so we usually manually run them before running the release script.

  # if [[ -z $SKIP_SAUCE ]]; then
  #   export SAUCE_BUILD_ID=$VERSION:`date +"%s"`
  #   npm run test:sauce
  # fi

  # build
  VERSION=$VERSION npm run build

  # update packages
  cd packages/vue-template-compiler
  npm version $VERSION
  if [[ -z $RELEASE_TAG ]]; then
    npm publish
  else
    npm publish --tag $RELEASE_TAG
  fi
  cd -

  cd packages/vue-server-renderer
  npm version $VERSION
  if [[ -z $RELEASE_TAG ]]; then
    npm publish
  else
    npm publish --tag $RELEASE_TAG
  fi
  cd -

  # commit
  git add -A
  git add -f \
    dist/*.js \
    packages/vue-server-renderer/basic.js \
    packages/vue-server-renderer/build.js \
    packages/vue-server-renderer/server-plugin.js \
    packages/vue-server-renderer/client-plugin.js \
    packages/vue-template-compiler/build.js
  git commit -m "build: build $VERSION"
  # generate release note
  npm run release:note
  # tag version
  npm version $VERSION --message "build: release $VERSION"

  # publish
  git push origin refs/tags/v$VERSION
  git push
  if [[ -z $RELEASE_TAG ]]; then
    npm publish
  else
    npm publish --tag $RELEASE_TAG
  fi
fi

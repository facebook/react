set -e
CUR_VERSION=`node build/get-weex-version.js -c`
NEXT_VERSION=`node build/get-weex-version.js`

echo "Current: $CUR_VERSION"
read -p "Enter new version ($NEXT_VERSION): " -n 1 -r
if ! [[ -z $REPLY ]]; then
  NEXT_VERSION=$REPLY
fi

read -p "Releasing weex-vue-framework@$NEXT_VERSION - are you sure? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Releasing weex-vue-framework@$NEXT_VERSION ..."
  npm run lint
  npm run flow
  npm run test:weex

  # build
  WEEX_VERSION=$NEXT_VERSION npm run build:weex

  # update package
  cd packages/weex-vue-framework
  npm version $NEXT_VERSION
  npm publish
  cd -

  cd packages/weex-template-compiler
  npm version $NEXT_VERSION
  npm publish
  cd -

  # commit
  git add packages/weex*
  git commit -m "[release] weex-vue-framework@$NEXT_VERSION"
fi

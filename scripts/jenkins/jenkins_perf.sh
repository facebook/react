set -e

export NVM_DIR="/Users/Shared/jenkins/nvm"
. "$NVM_DIR/nvm.sh"  # This loads nvm
export ANDROID_SDK="/Users/Shared/jenkins/android-sdk"
export PATH+=":$ANDROID_SDK/tools:$ANDROID_SDK/platform-tools"
export PATH+=":/usr/local/git/bin"

export DART_CHANNEL=dev
export ARCH=macos-ia32
export PERF_BROWSERS=ChromeAndroid
export CLOUD_SECRET_PATH="/Users/Shared/jenkins/keys/perf-cloud-secret"
export GIT_SHA=$(git rev-parse HEAD)

nvm use 0.10

./scripts/ci/init_android.sh
./scripts/ci/install_dart.sh ${DART_CHANNEL} ${ARCH}
npm cache clean
# use newest npm because of errors during npm install like
# npm ERR! EEXIST, open '/Users/Shared/Jenkins/.npm/e4d0eb16-adable-stream-1-1-13-package-tgz.lock'
npm install -g npm@2.6
npm install
./scripts/ci/build_js.sh
./scripts/ci/build_dart.sh
./scripts/ci/test_perf.sh

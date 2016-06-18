#!/usr/bin/env bash

set -e -o pipefail

cd `dirname $0`

export NODE_PATH=${NODE_PATH}:$(pwd)/dist/all:$(pwd)/dist/tools


rm -rf ./dist/all/
mkdir -p ./dist/all/

TSCONFIG=./tools/tsconfig.json
echo "====== (all)COMPILING: \$(npm bin)/tsc -p ${TSCONFIG} ====="
$(npm bin)/tsc -p ${TSCONFIG}
cp ./tools/@angular/tsc-wrapped/package.json ./dist/tools/@angular/tsc-wrapped

echo "====== Copying files needed for e2e tests ====="
cp -r ./modules/playground ./dist/all/
cp -r ./modules/playground/favicon.ico ./dist/
#rsync -aP ./modules/playground/* ./dist/all/playground/
mkdir ./dist/all/playground/vendor
cd ./dist/all/playground/vendor
ln -s ../../../../node_modules/es6-shim/es6-shim.js .
ln -s ../../../../node_modules/zone.js/dist/zone.js .
ln -s ../../../../node_modules/zone.js/dist/long-stack-trace-zone.js .
ln -s ../../../../node_modules/systemjs/dist/system.src.js .
ln -s ../../../../node_modules/base64-js/lib/b64.js .
ln -s ../../../../node_modules/reflect-metadata/Reflect.js .
ln -s ../../../../node_modules/rxjs .
ln -s ../../../../node_modules/angular/angular.js .
cd -


TSCONFIG=./modules/tsconfig.json
echo "====== (all)COMPILING: \$(npm bin)/tsc -p ${TSCONFIG} ====="
# compile ts code
TSC="node dist/tools/@angular/tsc-wrapped/src/main"
$TSC -p modules/tsconfig.json

rm -rf ./dist/packages-dist

for PACKAGE in \
  core \
  compiler \
  common \
  forms \
  platform-browser \
  platform-browser-dynamic \
  platform-server \
  http \
  router \
  router-deprecated \
  upgrade \
  compiler-cli
do
  SRCDIR=./modules/@angular/${PACKAGE}
  DESTDIR=./dist/packages-dist/${PACKAGE}
  UMD_ES6_PATH=${DESTDIR}/esm/${PACKAGE}.umd.js
  UMD_ES5_PATH=${DESTDIR}/bundles/${PACKAGE}.umd.js
  UMD_ES5_MIN_PATH=${DESTDIR}/bundles/${PACKAGE}.umd.min.js

  if [[ ${PACKAGE} == "router-deprecated" ]]; then
    echo "======      COMPILING: \$(npm bin)/tsc -p ${SRCDIR}/tsconfig-es5.json        ====="
    $(npm bin)/tsc -p ${SRCDIR}/tsconfig-es5.json
  else
    echo "======      COMPILING: ${TSC} -p ${SRCDIR}/tsconfig-es5.json        ====="
    $TSC -p ${SRCDIR}/tsconfig-es5.json
  fi

  cp ${SRCDIR}/package.json ${DESTDIR}/


  echo "======      TSC 1.8 d.ts compat for ${DESTDIR}   ====="
  # safely strips 'readonly' specifier from d.ts files to make them compatible with tsc 1.8
  if [[ ${TRAVIS} ]]; then
    find ${DESTDIR} -type f -name '*.d.ts' -print0 | xargs -0 sed -i    -e 's/\(^ *(static |private )*\)*readonly  */\1/g'
    find ${DESTDIR} -type f -name '*.d.ts' -print0 | xargs -0 sed -i    -E 's/^( +)abstract ([[:alnum:]]+\:)/\1\2/g'
  else
    find ${DESTDIR} -type f -name '*.d.ts' -print0 | xargs -0 sed -i '' -e 's/\(^ *(static |private )*\)*readonly  */\1/g'
    find ${DESTDIR} -type f -name '*.d.ts' -print0 | xargs -0 sed -i '' -E 's/^( +)abstract ([[:alnum:]]+\:)/\1\2/g'
  fi

  if [[ ${PACKAGE} != compiler-cli ]]; then

    if [[ ${PACKAGE} == "router-deprecated" ]]; then
      echo "====== (esm)COMPILING: \$(npm bin)/tsc -p ${SRCDIR}/tsconfig-es2015.json ====="
      $(npm bin)/tsc --emitDecoratorMetadata -p ${SRCDIR}/tsconfig-es2015.json
    else
      echo "====== (esm)COMPILING: $TSC -p ${SRCDIR}/tsconfig-es2015.json ====="
      $TSC -p ${SRCDIR}/tsconfig-es2015.json
    fi

    echo "======      BUNDLING: ${SRCDIR} ====="
    mkdir ${DESTDIR}/bundles

    (
      cd  ${SRCDIR}
      echo "..."  # here just to have grep match something and not exit with 1
      ../../../node_modules/.bin/rollup -c rollup.config.js
    ) 2>&1 | grep -v "as external dependency"

    $(npm bin)/tsc  \
        --out ${UMD_ES5_PATH} \
        --target es5 \
        --lib "es6,dom" \
        --allowJs \
        ${UMD_ES6_PATH}

    rm ${UMD_ES6_PATH}

    cat ./modules/@angular/license-banner.txt > ${UMD_ES5_PATH}.tmp
    cat ${UMD_ES5_PATH} >> ${UMD_ES5_PATH}.tmp
    mv ${UMD_ES5_PATH}.tmp ${UMD_ES5_PATH}

    $(npm bin)/uglifyjs -c --screw-ie8 -o ${UMD_ES5_MIN_PATH} ${UMD_ES5_PATH}
  fi
done

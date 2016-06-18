#!/bin/bash
set -ex
shopt -s extglob

ROOT_DIR=$(cd $(dirname $0)/../..; pwd)
cd ${ROOT_DIR}

gulp clean
node --max-old-space-size=6000 ./node_modules/.bin/gulp build.js buildRouter.dev

NPM_DIR=${ROOT_DIR}/dist/npm
rm -fr ${NPM_DIR}
FILES='!(test|e2e_test|docs)'
DTS_FILES='*.d.ts'

NAME=router
PUBLISH_DIR=${NPM_DIR}/${NAME}

# Clean the publish directory. This is the root directory for npm publish.
rm -fr ${PUBLISH_DIR}
mkdir -p ${PUBLISH_DIR}

# Copy package.json that contains the (scoped) package name and version.
cp ${ROOT_DIR}/modules/angular2/src/router/package.json ${PUBLISH_DIR}

# Create directory for the separate framework versions
mkdir -p ${PUBLISH_DIR}/angular1
mkdir -p ${PUBLISH_DIR}/angular2

# Copy router build artifacts to the publish directory.
cp ${ROOT_DIR}/dist/angular_1_router.js ${PUBLISH_DIR}/angular1/
cp ${ROOT_DIR}/modules/angular1_router/src/ng_route_shim.js ${PUBLISH_DIR}/angular1/

cp ${ROOT_DIR}/dist/js/bundle/router* ${PUBLISH_DIR}/angular2/

# Remove any dart related files
rm -f ${PUBLISH_DIR}/{,**/}{*.dart,*.dart.md}

# Actually publish to npm
npm publish ${PUBLISH_DIR} --tag latest --access public

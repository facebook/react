# Basic example of using React with Browserify

Run `npm install` in the directory to install React from npm. Then run:

    ./node_modules/.bin/browserify --debug --transform reactify ./index.js > ./bundle.js

to produce `bundle.js` with example code and React.

'use strict';

const pathToTransformReactVersionPragma = require.resolve(
  '../../babel/transform-react-version-pragma'
);

module.exports = {
  devtoolsPlugins: [pathToTransformReactVersionPragma],
};

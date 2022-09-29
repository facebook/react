'use strict';

const pathToTransformReactVersionPragma = require.resolve(
  '../../babel/transform-react-version-pragma'
);

function getDevToolsPlugins(filePath) {
  const plugins = [];
  if (
    process.env.REACT_VERSION ||
    filePath.match(/\/transform-react-version-pragma-test/)
  ) {
    plugins.push(pathToTransformReactVersionPragma);
  }
  return plugins;
}

module.exports = {
  getDevToolsPlugins,
};

const chromeManifest = require('./shells/browser/chrome/manifest.json');
const firefoxManifest = require('./shells/browser/firefox/manifest.json');

const minChromeVersion = parseInt(chromeManifest.minimum_chrome_version, 10);
const minFirefoxVersion = parseInt(
  firefoxManifest.applications.gecko.strict_min_version,
  10
);
validateVersion(minChromeVersion);
validateVersion(minFirefoxVersion);

function validateVersion(version) {
  if (version > 0 && version < 200) {
    return;
  }
  throw new Error('Suspicious browser version in manifest: ' + version);
}

module.exports = api => {
  const isTest = api.env('test');
  const targets = {};
  if (isTest) {
    targets.node = 'current';
  } else {
    targets.chrome = minChromeVersion.toString();
    targets.firefox = minFirefoxVersion.toString();
  }
  const plugins = [
    ['@babel/plugin-transform-flow-strip-types'],
    ['@babel/plugin-proposal-class-properties', { loose: false }],
  ];
  if (process.env.NODE_ENV !== 'production') {
    plugins.push(['@babel/plugin-transform-react-jsx-source']);
  }
  return {
    plugins,
    presets: [
      ['@babel/preset-env', { targets }],
      '@babel/preset-react',
      '@babel/preset-flow',
    ],
  };
};

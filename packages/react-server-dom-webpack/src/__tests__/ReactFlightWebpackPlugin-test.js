const path = require('path');
const os = require('os');

function getDependencies(mode: 'wp5' | 'wp4') {
  jest.resetModuleRegistry();
  let webpack;
  if (mode === 'wp5') {
    webpack = jest.requireActual('webpack5');
    // The code we are testing (ReactFlightWebpackPlugin) directly imports `webpack`. It cannot depend upon `webpack5` as
    // consumers of `ReactFlightWebpackPlugin` are more likely to have installed wp5 just as `webpack`. So we fix this by mocking the
    // `webpack` module, and return the webpack 5 instance that we required.
    jest.mock('webpack', () => {
      return webpack;
    });
    // Sanity-check. If the webpack in package.json changes, this should catch that
    expect(webpack.version).toMatch(/5\.[0-9]*\.[0-9]*/);
  } else {
    webpack = jest.requireActual('webpack');
    // Sanity-check. If the webpack in package.json changes, this should catch that
    expect(webpack.version).toMatch(/4\.[0-9]*\.[0-9]*/);
  }

  const FlightPlugin = require('../ReactFlightWebpackPlugin').default;
  return {
    FlightPlugin,
    webpack,
  };
}

describe('ReactFlightWebpackPlugin', () => {
  // Running webpack can be slow, so we increase Jest's default timeout. These values are
  // "magic", and not backed by any kind of logic or reasoning.
  jest.setTimeout(5000 * 5);

  test('produces manifest - webpack v4', done => {
    const {webpack, FlightPlugin} = getDependencies('wp4');

    const entry = path.resolve(path.join(__dirname, 'fixture', 'entry.js'));

    const plugin = new FlightPlugin({isServer: false});

    const output = webpack({
      entry: {
        main: entry,
        client: path.resolve(path.join(__dirname, 'fixture', 'Form.client.js')),
      },
      plugins: [plugin],
      output: {
        path: path.resolve(path.join(os.tmpdir(), 'output')),
      },
      mode: 'development',
    });

    output.run((err, stats) => {
      expect(err).toBeNull();
      // in webpack 4, we can read the assets of the compilation object. This doesn't work in webpack 5
      // as webpack 5 removes the source from the assets object, to prevent memory leaks.
      const fileName = plugin.manifestFilename;
      const pluginOutput = stats.compilation.assets[fileName];
      const producedManifest = pluginOutput.source();
      assert(producedManifest);

      done();
    });
  });

  test('produces manifest - webpack v5', done => {
    const entry = path.resolve(path.join(__dirname, 'fixture', 'entry.js'));
    const {webpack, FlightPlugin} = getDependencies('wp5');

    const plugin = new FlightPlugin({isServer: false});
    const fileName = plugin.manifestFilename;

    const output = webpack({
      entry: {
        main: entry,
        client: path.resolve(path.join(__dirname, 'fixture', 'Form.client.js')),
      },
      plugins: [plugin],
      cache: undefined,
      output: {
        // Output
        path: path.resolve(path.join(os.tmpdir(), 'output+2')),
        // Make webpack always want to emit files, regardless if they exist or not
        // This aids in development of the tests, as webpack 5 will not emit fi the file is already existing.
        compareBeforeEmit: false,
      },
      mode: 'development',
    });

    const originalFileSystem = output.outputFileSystem;

    output.outputFileSystem = {
      ...originalFileSystem,
      writeFile: jest.fn((dest, contents, cb) => {
        // Call the callback, but don't actually write anything.
        cb(null);
      }),
    };

    output.run((err, stats) => {
      expect(err).toBeNull();

      expect(output.outputFileSystem.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(fileName),
        expect.anything(),
        expect.anything(),
      );
      const calls = output.outputFileSystem.writeFile.mock.calls;
      // Get the idx that was called with the fileName,
      const idx = calls.findIndex(val => {
        return val[0].includes(fileName);
      });

      const contents = output.outputFileSystem.writeFile.mock.calls[
        idx
      ][1].toString();

      // Check that the contents match with what we expect
      assert(contents);
      done();
    });
  });
});

function assert(manifestContents) {
  const key =
    'file://' + path.resolve(path.join(__dirname, 'fixture', 'Form.client.js'));
  const manifestObj = JSON.parse(manifestContents);

  expect(manifestObj[key]).toStrictEqual(
    expect.objectContaining({
      '': {
        chunks: ['client'],
        id:
          './packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js',
        name: '',
      },
      '*': {
        chunks: ['client'],
        id:
          './packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js',
        name: '*',
      },
      Form: {
        chunks: ['client'],
        id:
          './packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js',
        name: 'Form',
      },
    }),
  );
}

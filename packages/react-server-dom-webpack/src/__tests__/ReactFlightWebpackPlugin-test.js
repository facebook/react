const path = require('path');
const os = require('os');

describe('ReactFlightWebpackPlugin', () => {
  // Running webpack can be slow, so we increase Jest's default timeout. These values are
  // "magic", and not backed by any kind of logic or reasoning.
  jest.setTimeout(5000 * 5);

  test('manifest matches snapshot', done => {
    const entry = path.resolve(
      path.join(__dirname, 'fixture', 'entry.client.js'),
    );

    const webpack = jest.requireActual('webpack');
    const FlightPlugin = require('../ReactFlightWebpackPlugin').default;

    const plugin = new FlightPlugin({isServer: false});
    const manifestFileName = plugin.manifestFilename;

    const output = webpack({
      entry: {
        main: entry,
      },
      plugins: [plugin],
      cache: undefined,
      output: {
        // Output
        path: path.resolve(path.join(os.tmpdir(), 'output+2')),
        // Make webpack always want to emit files, regardless if they exist or not
        // This aids in development of the tests, as webpack 5 will not emit if the file is already existing.
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
      expect(stats.compilation.warnings).toHaveLength(0);

      const calls = output.outputFileSystem.writeFile.mock.calls;
      // Get the idx that was called with the fileName,
      const idx = calls.findIndex(val => {
        return val[0].includes(manifestFileName);
      });
      expect(idx).not.toBe(-1);
      const contents = output.outputFileSystem.writeFile.mock.calls[
        idx
      ][1].toString();

      expect(JSON.parse(contents)).toMatchSnapshot();

      done();
    });
  });
});

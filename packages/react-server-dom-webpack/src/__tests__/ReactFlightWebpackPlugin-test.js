const webpack5 = require('webpack5');
const webpack4 = require('webpack');
const path = require('path');
const os = require('os');
const FlightPlugin = require('../ReactFlightWebpackPlugin').default;

describe('ReactFlightWebpackPlugin', () => {
  // Probably too big a timeout.
  jest.setTimeout(5000 * 5);

  test('produces manifest - webpack v4', done => {
    const entry = path.resolve(path.join(__dirname, 'fixture', 'entry.js'));

    const plugin = new FlightPlugin({isServer: false});

    const output = webpack4({
      entry,
      plugins: [plugin],
      output: {
        // Output
        path: path.resolve(path.join(os.tmpdir(), 'output')),
      },
      mode: 'development',
    });

    output.run((err, stats) => {
      expect(err).toBeNull();
      const fileName = plugin.manifestFilename; //'react-client-manifest.json'

      const pluginOutput = stats.compilation.assets[fileName];
      console.log(pluginOutput);

      const producedManifest = pluginOutput.source();

      const manifest = JSON.parse(producedManifest);
      // The key uses the absolute filename, which means we can't snapshot it.
      const key =
        'file://' +
        path.resolve(path.join(__dirname, 'fixture', 'Form.client.js'));

      expect(manifest[key]).toMatchInlineSnapshot(`
        Object {
          "": Object {
            "chunks": Array [
              "main",
            ],
            "id": "./packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js",
            "name": "",
          },
          "*": Object {
            "chunks": Array [
              "main",
            ],
            "id": "./packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js",
            "name": "*",
          },
          "true": Object {
            "chunks": Array [
              "main",
            ],
            "id": "./packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js",
            "name": true,
          },
        }
      `);

      done();
    });
  });

  test('produces manifest - webpack v5', done => {
    const entry = path.resolve(path.join(__dirname, 'fixture', 'entry.js'));

    const plugin = new FlightPlugin({isServer: false});
    const fileName = plugin.manifestFilename;

    const output = webpack5({
      entry: {
        main: entry,
        client: path.resolve(path.join(__dirname, 'fixture', 'Form.client.js')),
      },
      plugins: [plugin],
      cache: undefined,
      output: {
        // Output
        path: path.resolve(path.join(os.tmpdir(), 'output')),
      },
      mode: 'development',
    });

    const originalFileSystem = output.outputFileSystem;

    output.outputFileSystem = {
      ...originalFileSystem,
      writeFile: (dest, contents, err) => {
        if (dest.includes(fileName)) {
          assert(contents.toString());
          done();
        }
      },
    };

    output.run((err, stats, foo) => {
      expect(err).toBeNull();
    });
  });
});

function assert(manifestContents) {
  const key =
    'file://' + path.resolve(path.join(__dirname, 'fixture', 'Form.client.js'));
  expect(JSON.parse(manifestContents)[key]).toMatchInlineSnapshot(`
    Object {
      "": Object {
        "chunks": Array [
          "client",
        ],
        "id": "./packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js",
        "name": "",
      },
      "*": Object {
        "chunks": Array [
          "client",
        ],
        "id": "./packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js",
        "name": "*",
      },
      "undefined": Object {
        "chunks": Array [
          "client",
        ],
        "id": "./packages/react-server-dom-webpack/src/__tests__/fixture/Form.client.js",
      },
    }
  `);
}

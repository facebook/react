'use strict';

const tar = require('tar');
const Stream = require('stream');

class CollectStream extends Stream.Transform {
  constructor() {
    super();
    this._chunks = [];
  }

  _transform(chunk, enc, cb) {
    this._chunks.push(chunk);
    cb();
  }

  collect() {
    return Buffer.concat(this._chunks);
  }
}

async function readPackageJSONFromNPMTarball(tarFile) {
  const cs = new CollectStream();
  try {
    await tar.x(
      {
        file: tarFile,
        transform: entry => {
          // Set the path to /dev/null so no file is created
          entry.absolute = '/dev/null';
          // tell the stream to write to this stream.Transform
          return cs;
        },
      },
      ['package/package.json']
    );
    const json = cs.collect().toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    throw new Error(tarFile + ' is not a valid npm package.');
  }
}

module.exports = readPackageJSONFromNPMTarball;

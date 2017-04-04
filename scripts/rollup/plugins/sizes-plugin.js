const gzip = require('gzip-size');

module.exports = function sizes({ getSize }) {
  return {
    ongenerate(bundle, { code }) {
      const size = Buffer.byteLength(code);
			const gzipSize = gzip.sync(code);
  
      getSize(size, gzipSize);
    },
  };
};

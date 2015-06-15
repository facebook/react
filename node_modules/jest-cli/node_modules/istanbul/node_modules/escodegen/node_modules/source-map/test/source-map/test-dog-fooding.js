/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
if (typeof define !== 'function') {
    var define = require('amdefine')(module, require);
}
define(function (require, exports, module) {

  var SourceMapConsumer = require('../../lib/source-map/source-map-consumer').SourceMapConsumer;
  var SourceMapGenerator = require('../../lib/source-map/source-map-generator').SourceMapGenerator;

  exports['test eating our own dog food'] = function (assert, util) {
    var smg = new SourceMapGenerator({
      file: 'testing.js',
      sourceRoot: '/wu/tang'
    });

    smg.addMapping({
      source: 'gza.coffee',
      original: { line: 1, column: 0 },
      generated: { line: 2, column: 2 }
    });

    smg.addMapping({
      source: 'gza.coffee',
      original: { line: 2, column: 0 },
      generated: { line: 3, column: 2 }
    });

    smg.addMapping({
      source: 'gza.coffee',
      original: { line: 3, column: 0 },
      generated: { line: 4, column: 2 }
    });

    smg.addMapping({
      source: 'gza.coffee',
      original: { line: 4, column: 0 },
      generated: { line: 5, column: 2 }
    });

    smg.addMapping({
      source: 'gza.coffee',
      original: { line: 5, column: 10 },
      generated: { line: 6, column: 12 }
    });

    var smc = new SourceMapConsumer(smg.toString());

    // Exact
    util.assertMapping(2, 2, '/wu/tang/gza.coffee', 1, 0, null, smc, assert);
    util.assertMapping(3, 2, '/wu/tang/gza.coffee', 2, 0, null, smc, assert);
    util.assertMapping(4, 2, '/wu/tang/gza.coffee', 3, 0, null, smc, assert);
    util.assertMapping(5, 2, '/wu/tang/gza.coffee', 4, 0, null, smc, assert);
    util.assertMapping(6, 12, '/wu/tang/gza.coffee', 5, 10, null, smc, assert);

    // Fuzzy

    // Generated to original
    util.assertMapping(2, 0, null, null, null, null, smc, assert, true);
    util.assertMapping(2, 9, '/wu/tang/gza.coffee', 1, 0, null, smc, assert, true);
    util.assertMapping(3, 0, null, null, null, null, smc, assert, true);
    util.assertMapping(3, 9, '/wu/tang/gza.coffee', 2, 0, null, smc, assert, true);
    util.assertMapping(4, 0, null, null, null, null, smc, assert, true);
    util.assertMapping(4, 9, '/wu/tang/gza.coffee', 3, 0, null, smc, assert, true);
    util.assertMapping(5, 0, null, null, null, null, smc, assert, true);
    util.assertMapping(5, 9, '/wu/tang/gza.coffee', 4, 0, null, smc, assert, true);
    util.assertMapping(6, 0, null, null, null, null, smc, assert, true);
    util.assertMapping(6, 9, null, null, null, null, smc, assert, true);
    util.assertMapping(6, 13, '/wu/tang/gza.coffee', 5, 10, null, smc, assert, true);

    // Original to generated
    util.assertMapping(2, 2, '/wu/tang/gza.coffee', 1, 1, null, smc, assert, null, true);
    util.assertMapping(3, 2, '/wu/tang/gza.coffee', 2, 3, null, smc, assert, null, true);
    util.assertMapping(4, 2, '/wu/tang/gza.coffee', 3, 6, null, smc, assert, null, true);
    util.assertMapping(5, 2, '/wu/tang/gza.coffee', 4, 9, null, smc, assert, null, true);
    util.assertMapping(5, 2, '/wu/tang/gza.coffee', 5, 9, null, smc, assert, null, true);
    util.assertMapping(6, 12, '/wu/tang/gza.coffee', 6, 19, null, smc, assert, null, true);
  };

});

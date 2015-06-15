var LcovOnly = require('./lcovonly'),
  util = require('util');

/**
 * a `Report` implementation that produces an LCOV coverage and prints it
 *  to standard out.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('text-lcov');
 *
 * @class TextLcov
 * @module report
 * @extends LcovOnly
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.log] the method used to log to console.
 */
function TextLcov(opts) {
    var that = this;

    LcovOnly.call(this);

    this.opts = opts || {};
    this.opts.log = this.opts.log || console.log;
    this.opts.writer = {
        println: function (ln) {
            that.opts.log(ln);
        }
    };
}

TextLcov.TYPE = 'text-lcov';
util.inherits(TextLcov, LcovOnly);

LcovOnly.super_.mix(TextLcov, {
    writeReport: function (collector) {
        var that = this,
            writer = this.opts.writer;

        collector.files().forEach(function (key) {
            that.writeFileCoverage(writer, collector.fileCoverageFor(key));
        });

        this.emit('done');
    }
});

module.exports = TextLcov;

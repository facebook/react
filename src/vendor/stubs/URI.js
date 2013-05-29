/**
 * @providesModule URI
 */

/**
 * We expect downstream reps to implement URI as an extension of URIBase.
 * URIBase in turn is not used by other upstream modules but rather URI is used.
 * This stubs exists so that tests for the other upstream modules run correctly.
 */
var URIBase = require('URIBase');

module.exports = URIBase;

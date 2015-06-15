// Load modules

var Boom = require('boom');
var Hoek = require('hoek');
var Cryptiles = require('cryptiles');
var Crypto = require('./crypto');
var Utils = require('./utils');


// Declare internals

var internals = {};


// Hawk authentication

/*
   req:                 node's HTTP request object or an object as follows:
  
                        var request = {
                            method: 'GET',
                            url: '/resource/4?a=1&b=2',
                            host: 'example.com',
                            port: 8080,
                            authorization: 'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", ext="some-app-ext-data", mac="6R4rV5iE+NPoym+WwjeHzjAGXUtLNIxmo1vpMofpLAE="'
                        };
  
   credentialsFunc:     required function to lookup the set of Hawk credentials based on the provided credentials id.
                        The credentials include the MAC key, MAC algorithm, and other attributes (such as username)
                        needed by the application. This function is the equivalent of verifying the username and
                        password in Basic authentication.
  
                        var credentialsFunc = function (id, callback) {
    
                            // Lookup credentials in database
                            db.lookup(id, function (err, item) {
    
                                if (err || !item) {
                                    return callback(err);
                                }
    
                                var credentials = {
                                    // Required
                                    key: item.key,
                                    algorithm: item.algorithm,
                                    // Application specific
                                    user: item.user
                                };
    
                                return callback(null, credentials);
                            });
                        };
  
   options: {

        hostHeaderName:        optional header field name, used to override the default 'Host' header when used
                               behind a cache of a proxy. Apache2 changes the value of the 'Host' header while preserving
                               the original (which is what the module must verify) in the 'x-forwarded-host' header field.
                               Only used when passed a node Http.ServerRequest object.
  
        nonceFunc:             optional nonce validation function. The function signature is function(nonce, ts, callback)
                               where 'callback' must be called using the signature function(err).
  
        timestampSkewSec:      optional number of seconds of permitted clock skew for incoming timestamps. Defaults to 60 seconds.
                               Provides a +/- skew which means actual allowed window is double the number of seconds.
  
        localtimeOffsetMsec:   optional local clock time offset express in a number of milliseconds (positive or negative).
                               Defaults to 0.
  
        payload:               optional payload for validation. The client calculates the hash value and includes it via the 'hash'
                               header attribute. The server always ensures the value provided has been included in the request
                               MAC. When this option is provided, it validates the hash value itself. Validation is done by calculating
                               a hash value over the entire payload (assuming it has already be normalized to the same format and
                               encoding used by the client to calculate the hash on request). If the payload is not available at the time
                               of authentication, the authenticatePayload() method can be used by passing it the credentials and
                               attributes.hash returned in the authenticate callback.

        host:                  optional host name override. Only used when passed a node request object.
        port:                  optional port override. Only used when passed a node request object.
    }

    callback: function (err, credentials, artifacts) { }
 */

exports.authenticate = function (req, credentialsFunc, options, callback) {

    callback = Hoek.nextTick(callback);
    
    // Default options

    options.nonceFunc = options.nonceFunc || function (nonce, ts, nonceCallback) { return nonceCallback(); };   // No validation
    options.timestampSkewSec = options.timestampSkewSec || 60;                                                  // 60 seconds

    // Application time

    var now = Utils.now(options.localtimeOffsetMsec);                           // Measure now before any other processing

    // Convert node Http request object to a request configuration object

    var request = Utils.parseRequest(req, options);
    if (request instanceof Error) {
        return callback(Boom.badRequest(request.message));
    }

    // Parse HTTP Authorization header

    var attributes = Utils.parseAuthorizationHeader(request.authorization);
    if (attributes instanceof Error) {
        return callback(attributes);
    }

    // Construct artifacts container

    var artifacts = {
        method: request.method,
        host: request.host,
        port: request.port,
        resource: request.url,
        ts: attributes.ts,
        nonce: attributes.nonce,
        hash: attributes.hash,
        ext: attributes.ext,
        app: attributes.app,
        dlg: attributes.dlg,
        mac: attributes.mac,
        id: attributes.id
    };

    // Verify required header attributes

    if (!attributes.id ||
        !attributes.ts ||
        !attributes.nonce ||
        !attributes.mac) {

        return callback(Boom.badRequest('Missing attributes'), null, artifacts);
    }

    // Fetch Hawk credentials

    credentialsFunc(attributes.id, function (err, credentials) {

        if (err) {
            return callback(err, credentials || null, artifacts);
        }

        if (!credentials) {
            return callback(Boom.unauthorized('Unknown credentials', 'Hawk'), null, artifacts);
        }

        if (!credentials.key ||
            !credentials.algorithm) {

            return callback(Boom.internal('Invalid credentials'), credentials, artifacts);
        }

        if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
            return callback(Boom.internal('Unknown algorithm'), credentials, artifacts);
        }

        // Calculate MAC

        var mac = Crypto.calculateMac('header', credentials, artifacts);
        if (!Cryptiles.fixedTimeComparison(mac, attributes.mac)) {
            return callback(Boom.unauthorized('Bad mac', 'Hawk'), credentials, artifacts);
        }

        // Check payload hash

        if (options.payload ||
            options.payload === '') {

            if (!attributes.hash) {
                return callback(Boom.unauthorized('Missing required payload hash', 'Hawk'), credentials, artifacts);
            }

            var hash = Crypto.calculatePayloadHash(options.payload, credentials.algorithm, request.contentType);
            if (!Cryptiles.fixedTimeComparison(hash, attributes.hash)) {
                return callback(Boom.unauthorized('Bad payload hash', 'Hawk'), credentials, artifacts);
            }
        }

        // Check nonce

        options.nonceFunc(attributes.nonce, attributes.ts, function (err) {

            if (err) {
                return callback(Boom.unauthorized('Invalid nonce', 'Hawk'), credentials, artifacts);
            }

            // Check timestamp staleness

            if (Math.abs((attributes.ts * 1000) - now) > (options.timestampSkewSec * 1000)) {
                var tsm = Crypto.timestampMessage(credentials, options.localtimeOffsetMsec);
                return callback(Boom.unauthorized('Stale timestamp', 'Hawk', tsm), credentials, artifacts);
            }

            // Successful authentication

            return callback(null, credentials, artifacts);
        });
    });
};


// Authenticate payload hash - used when payload cannot be provided during authenticate()

/*
    payload:        raw request payload
    credentials:    from authenticate callback
    artifacts:      from authenticate callback
    contentType:    req.headers['content-type']
*/

exports.authenticatePayload = function (payload, credentials, artifacts, contentType) {

    var calculatedHash = Crypto.calculatePayloadHash(payload, credentials.algorithm, contentType);
    return Cryptiles.fixedTimeComparison(calculatedHash, artifacts.hash);
};


// Authenticate payload hash - used when payload cannot be provided during authenticate()

/*
    calculatedHash: the payload hash calculated using Crypto.calculatePayloadHash()
    artifacts:      from authenticate callback
*/

exports.authenticatePayloadHash = function (calculatedHash, artifacts) {

    return Cryptiles.fixedTimeComparison(calculatedHash, artifacts.hash);
};


// Generate a Server-Authorization header for a given response

/*
    credentials: {},                                        // Object received from authenticate()
    artifacts: {}                                           // Object received from authenticate(); 'mac', 'hash', and 'ext' - ignored
    options: {
        ext: 'application-specific',                        // Application specific data sent via the ext attribute
        payload: '{"some":"payload"}',                      // UTF-8 encoded string for body hash generation (ignored if hash provided)
        contentType: 'application/json',                    // Payload content-type (ignored if hash provided)
        hash: 'U4MKKSmiVxk37JCCrAVIjV='                     // Pre-calculated payload hash
    }
*/

exports.header = function (credentials, artifacts, options) {

    // Prepare inputs

    options = options || {};

    if (!artifacts ||
        typeof artifacts !== 'object' ||
        typeof options !== 'object') {

        return '';
    }

    artifacts = Hoek.clone(artifacts);
    delete artifacts.mac;
    artifacts.hash = options.hash;
    artifacts.ext = options.ext;

    // Validate credentials

    if (!credentials ||
        !credentials.key ||
        !credentials.algorithm) {

        // Invalid credential object
        return '';
    }

    if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
        return '';
    }

    // Calculate payload hash

    if (!artifacts.hash &&
        (options.payload || options.payload === '')) {

        artifacts.hash = Crypto.calculatePayloadHash(options.payload, credentials.algorithm, options.contentType);
    }

    var mac = Crypto.calculateMac('response', credentials, artifacts);

    // Construct header

    var header = 'Hawk mac="' + mac + '"' +
                 (artifacts.hash ? ', hash="' + artifacts.hash + '"' : '');

    if (artifacts.ext !== null &&
        artifacts.ext !== undefined &&
        artifacts.ext !== '') {                       // Other falsey values allowed

        header += ', ext="' + Hoek.escapeHeaderAttribute(artifacts.ext) + '"';
    }

    return header;
};


/*
 * Arguments and options are the same as authenticate() with the exception that the only supported options are:
 * 'hostHeaderName', 'localtimeOffsetMsec', 'host', 'port'
 */

exports.authenticateBewit = function (req, credentialsFunc, options, callback) {

    callback = Hoek.nextTick(callback);

    // Application time

    var now = Utils.now(options.localtimeOffsetMsec);

    // Convert node Http request object to a request configuration object

    var request = Utils.parseRequest(req, options);
    if (request instanceof Error) {
        return callback(Boom.badRequest(request.message));
    }

    // Extract bewit

    //                                 1     2             3           4     
    var resource = request.url.match(/^(\/.*)([\?&])bewit\=([^&$]*)(?:&(.+))?$/);
    if (!resource) {
        return callback(Boom.unauthorized(null, 'Hawk'));
    }

    // Bewit not empty

    if (!resource[3]) {
        return callback(Boom.unauthorized('Empty bewit', 'Hawk'));
    }

    // Verify method is GET

    if (request.method !== 'GET' &&
        request.method !== 'HEAD') {

        return callback(Boom.unauthorized('Invalid method', 'Hawk'));
    }

    // No other authentication

    if (request.authorization) {
        return callback(Boom.badRequest('Multiple authentications'));
    }

    // Parse bewit

    var bewitString = Hoek.base64urlDecode(resource[3]);
    if (bewitString instanceof Error) {
        return callback(Boom.badRequest('Invalid bewit encoding'));
    }

    // Bewit format: id\exp\mac\ext ('\' is used because it is a reserved header attribute character)

    var bewitParts = bewitString.split('\\');
    if (bewitParts.length !== 4) {
        return callback(Boom.badRequest('Invalid bewit structure'));
    }

    var bewit = {
        id: bewitParts[0],
        exp: parseInt(bewitParts[1], 10),
        mac: bewitParts[2],
        ext: bewitParts[3] || ''
    };

    if (!bewit.id ||
        !bewit.exp ||
        !bewit.mac) {

        return callback(Boom.badRequest('Missing bewit attributes'));
    }

    // Construct URL without bewit

    var url = resource[1];
    if (resource[4]) {
        url += resource[2] + resource[4];
    }

    // Check expiration

    if (bewit.exp * 1000 <= now) {
        return callback(Boom.unauthorized('Access expired', 'Hawk'), null, bewit);
    }

    // Fetch Hawk credentials

    credentialsFunc(bewit.id, function (err, credentials) {

        if (err) {
            return callback(err, credentials || null, bewit.ext);
        }

        if (!credentials) {
            return callback(Boom.unauthorized('Unknown credentials', 'Hawk'), null, bewit);
        }

        if (!credentials.key ||
            !credentials.algorithm) {

            return callback(Boom.internal('Invalid credentials'), credentials, bewit);
        }

        if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
            return callback(Boom.internal('Unknown algorithm'), credentials, bewit);
        }

        // Calculate MAC

        var mac = Crypto.calculateMac('bewit', credentials, {
            ts: bewit.exp,
            nonce: '',
            method: 'GET',
            resource: url,
            host: request.host,
            port: request.port,
            ext: bewit.ext
        });

        if (!Cryptiles.fixedTimeComparison(mac, bewit.mac)) {
            return callback(Boom.unauthorized('Bad mac', 'Hawk'), credentials, bewit);
        }

        // Successful authentication

        return callback(null, credentials, bewit);
    });
};


/*
 *  options are the same as authenticate() with the exception that the only supported options are:
 * 'nonceFunc', 'timestampSkewSec', 'localtimeOffsetMsec'
 */

exports.authenticateMessage = function (host, port, message, authorization, credentialsFunc, options, callback) {

    callback = Hoek.nextTick(callback);
    
    // Default options

    options.nonceFunc = options.nonceFunc || function (nonce, ts, nonceCallback) { return nonceCallback(); };   // No validation
    options.timestampSkewSec = options.timestampSkewSec || 60;                                                  // 60 seconds

    // Application time

    var now = Utils.now(options.localtimeOffsetMsec);                       // Measure now before any other processing

    // Validate authorization
    
    if (!authorization.id ||
        !authorization.ts ||
        !authorization.nonce ||
        !authorization.hash ||
        !authorization.mac) {
        
            return callback(Boom.badRequest('Invalid authorization'))
    }

    // Fetch Hawk credentials

    credentialsFunc(authorization.id, function (err, credentials) {

        if (err) {
            return callback(err, credentials || null);
        }

        if (!credentials) {
            return callback(Boom.unauthorized('Unknown credentials', 'Hawk'));
        }

        if (!credentials.key ||
            !credentials.algorithm) {

            return callback(Boom.internal('Invalid credentials'), credentials);
        }

        if (Crypto.algorithms.indexOf(credentials.algorithm) === -1) {
            return callback(Boom.internal('Unknown algorithm'), credentials);
        }

        // Construct artifacts container

        var artifacts = {
            ts: authorization.ts,
            nonce: authorization.nonce,
            host: host,
            port: port,
            hash: authorization.hash
        };

        // Calculate MAC

        var mac = Crypto.calculateMac('message', credentials, artifacts);
        if (!Cryptiles.fixedTimeComparison(mac, authorization.mac)) {
            return callback(Boom.unauthorized('Bad mac', 'Hawk'), credentials);
        }

        // Check payload hash

        var hash = Crypto.calculatePayloadHash(message, credentials.algorithm);
        if (!Cryptiles.fixedTimeComparison(hash, authorization.hash)) {
            return callback(Boom.unauthorized('Bad message hash', 'Hawk'), credentials);
        }

        // Check nonce

        options.nonceFunc(authorization.nonce, authorization.ts, function (err) {

            if (err) {
                return callback(Boom.unauthorized('Invalid nonce', 'Hawk'), credentials);
            }

            // Check timestamp staleness

            if (Math.abs((authorization.ts * 1000) - now) > (options.timestampSkewSec * 1000)) {
                return callback(Boom.unauthorized('Stale timestamp'), credentials);
            }

            // Successful authentication

            return callback(null, credentials);
        });
    });
};

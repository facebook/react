// Load modules

var Http = require('http');
var Request = require('request');
var Hawk = require('../lib');


// Declare internals

var internals = {
    credentials: {
        dh37fgj492je: {
            id: 'dh37fgj492je',                                             // Required by Hawk.client.header 
            key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
            algorithm: 'sha256',
            user: 'Steve'
        }
    }
};


// Credentials lookup function

var credentialsFunc = function (id, callback) {

    return callback(null, internals.credentials[id]);
};


// Create HTTP server

var handler = function (req, res) {

    Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

        var payload = (!err ? 'Hello ' + credentials.user + ' ' + artifacts.ext : 'Shoosh!');
        var headers = {
            'Content-Type': 'text/plain',
            'Server-Authorization': Hawk.server.header(credentials, artifacts, { payload: payload, contentType: 'text/plain' })
        };

        res.writeHead(!err ? 200 : 401, headers);
        res.end(payload);
    });
};

Http.createServer(handler).listen(8000, '127.0.0.1');


// Send unauthenticated request

Request('http://127.0.0.1:8000/resource/1?b=1&a=2', function (error, response, body) {

    console.log(response.statusCode + ': ' + body);
});


// Send authenticated request

credentialsFunc('dh37fgj492je', function (err, credentials) {

    var header = Hawk.client.header('http://127.0.0.1:8000/resource/1?b=1&a=2', 'GET', { credentials: credentials, ext: 'and welcome!' });
    var options = {
        uri: 'http://127.0.0.1:8000/resource/1?b=1&a=2',
        method: 'GET',
        headers: {
            authorization: header.field
        }
    };

    Request(options, function (error, response, body) {

        var isValid = Hawk.client.authenticate(response, credentials, header.artifacts, { payload: body });
        console.log(response.statusCode + ': ' + body + (isValid ? ' (valid)' : ' (invalid)'));
        process.exit(0);
    });
});


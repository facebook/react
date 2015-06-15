var binding = require('bindings')('contextify');
var ContextifyContext = binding.ContextifyContext;
var ContextifyScript = binding.ContextifyScript;

function Contextify (sandbox) {
    if (typeof sandbox != 'object') {
        sandbox = {};
    }
    var ctx = new ContextifyContext(sandbox);

    sandbox.run = function () {
        return ctx.run.apply(ctx, arguments);
    };

    sandbox.getGlobal = function () {
        return ctx.getGlobal();
    }

    sandbox.dispose = function () {
        sandbox.run = function () {
            throw new Error("Called run() after dispose().");
        };
        sandbox.getGlobal = function () {
            throw new Error("Called getGlobal() after dispose().");
        };
        sandbox.dispose = function () {
            throw new Error("Called dispose() after dispose().");
        };
        ctx = null;
    }
    return sandbox;
}

Contextify.createContext = function (sandbox) {
    if (typeof sandbox != 'object') {
        sandbox = {};
    }
    return new ContextifyContext(sandbox);
};

Contextify.createScript = function (code, filename) {
    if (typeof code != 'string') {
        throw new TypeError('Code argument is required');
    }
    return new ContextifyScript(code, filename);
};

module.exports = Contextify;

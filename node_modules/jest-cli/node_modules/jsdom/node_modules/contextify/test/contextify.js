var Contextify = require('../lib/contextify.js');

exports['basic tests'] = {
    // Creating a context shouldn't fail.
    'blank context' : function (test) {
        var ctx = Contextify({});
        test.notEqual(ctx, null);
        test.notEqual(ctx, undefined);
        test.done();
    },

    // Creating a context with sandbox shouldn't change existing sandbox
    // properties.
    'basic context' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        test.equal(sandbox.prop1, 'prop1');
        test.equal(sandbox.prop2, 'prop2');
        test.done();
    },

    'basic createContext' : function (test) {
        var sandbox = {
            prop1: 'prop1',
            prop2: 'prop2'
        };
        var context = Contextify.createContext(sandbox);
        test.equal(sandbox.prop1, 'prop1');
        test.equal(sandbox.prop2, 'prop2');
        test.done();
    },

    // Ensure that the correct properties exist on a wrapped sandbox.
    'test contextified object extra properties' : function (test) {
        var sandbox = Contextify({});
        test.notEqual(sandbox.run, undefined);
        test.notEqual(sandbox.getGlobal, undefined);
        test.notEqual(sandbox.dispose, undefined);
        test.done();
    },

    'createContext should not modify the sandbox' : function (test) {
        var sandbox = {};
        Contextify.createContext(sandbox);
        test.equal(sandbox.run, undefined);
        test.equal(sandbox.getGlobal, undefined);
        test.equal(sandbox.dispose, undefined);
        test.done();
    },

    // Passing undefined should create an empty context.
    'test undefined sandbox' : function (test) {
        // Should return an empty object.
        test.notEqual(Contextify(undefined, undefined), undefined);
        test.notEqual(Contextify(), undefined);
        test.done();
    },

    'sandbox prototype properties should be searched' : function (test) {
        var sandbox = {};
        sandbox.__proto__ = {
            prop1 : 'test'
        };
        Contextify(sandbox);
        test.equal(sandbox.getGlobal().prop1, 'test');
        test.done();
    },

    // Make sure properties that aren't there...aren't there.
    'test for nonexistent properties' : function (test) {
        var global = Contextify({}).getGlobal();
        test.equal(global.test1, undefined);
        test.done();
    },

    // Make sure properties with value "undefined" are there.
    'test for "undefined" properties' : function (test) {
        var sandbox = { x: undefined };
        Contextify(sandbox);
        sandbox.run("_x = x");
        test.equal(sandbox._x, undefined);
        test.done();
    },

    'test for "undefined" properties with createContext' : function (test) {
        var sandbox = { x: undefined };
        var context = Contextify.createContext(sandbox);
        context.run("_x = x");
        test.equal(sandbox._x, undefined);
        test.done();
    },

    'test for "undefined" variables' : function (test) {
        var sandbox = { };
        Contextify(sandbox);
        // In JavaScript a declared variable is set to 'undefined'.
        sandbox.run("var y; (function() { var _y ; y = _y })()");
        test.equal(sandbox._y, undefined);
        // This should apply to top-level variables (global properties).
        sandbox.run("var z; _z = z");
        test.equal(sandbox._z, undefined);
        // Make sure nothing wacky happens when accessing global declared but
        // undefined variables.
        test.equal(sandbox.getGlobal().z, undefined);
        test.done();
    },

    // Make sure run can be called with a filename parameter.
    'test run with filename' : function (test) {
        var sandbox = Contextify();
        sandbox.run('var x = 3', "test.js");
        test.equal(sandbox.x, 3);
        test.done();
    },

    // Make sure run can be called on a context
    'test run with createContext' : function (test) {
        var sandbox = {};
        var context = Contextify.createContext(sandbox);
        context.run('var x = 3', "test.js");
        test.equal(sandbox.x, 3);
        test.done();
    },

    // Make sure getters/setters on the sandbox object are used.
    'test accessors on sandbox' : function (test) {
        var sandbox = {};
        sandbox.__defineGetter__('test', function () { return 3;});
        sandbox.__defineSetter__('test2', function (val) { this.x = val;});
        Contextify(sandbox);
        var global = sandbox.getGlobal();
        test.equal(global.test, 3);
        sandbox.test2 = 5;
        test.equal(sandbox.x, 5);
        global.test2 = 7;
        test.equal(global.x, 7);
        test.equal(sandbox.x, 7);
        test.done();
    },

    // Make sure dispose cleans up the sandbox.
    'test dispose' : function (test) {
        var sandbox = Contextify();
        test.notEqual(sandbox.run, undefined);
        test.notEqual(sandbox.getGlobal, undefined);
        test.notEqual(sandbox.dispose, undefined);
        sandbox.dispose();
        test.throws(function () {
            sandbox.run();
        }, Error);
        test.throws(function () {
            sandbox.getGlobal();
        }, Error);
        test.throws(function () {
            sandbox.dispose();
        }, Error);
        test.done();
    }
};

exports['synchronous script tests'] = {
    // Synchronous context script execution:
    // Ensure that global variables are put on the sandbox object.
    'global variables in scripts should go on sandbox' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run('x = 3');
        test.equal(sandbox.x, 3);
        test.done();
    },

    // Synchronous context script execution:
    // Ensure that sandbox properties can be accessed as global variables.
    'sandbox properties should be globals' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run("test1 = (prop1 == 'prop1');" +
                    "test2 = (prop2 == 'prop2');");
        test.ok(sandbox.test1);
        test.ok(sandbox.test2);
        test.done();
    }
};

exports['asynchronous script tests'] = {
    // Asynchronous context script execution:
    // Ensure that global variables are put on the sandbox object.
    'global variables in scripts should go on sandbox' : function (test) {
        var sandbox = {
            setTimeout : setTimeout,
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run('setTimeout(function () {x = 3}, 0);');
        test.equal(sandbox.x, undefined);
        setTimeout(function () {
            test.equal(sandbox.x, 3);
            test.done();
        }, 0);
    },

    // Asynchronous context script execution:
    // Ensure that sandbox properties can be accessed as global variables.
    'sandbox properties should be globals' : function (test) {
        var sandbox = {
            setTimeout : setTimeout,
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run("setTimeout(function () {" +
                    "test1 = (prop1 == 'prop1');" +
                    "test2 = (prop2 == 'prop2');" +
                    "}, 0)");
        test.equal(sandbox.test1, undefined);
        test.equal(sandbox.test2, undefined);
        setTimeout(function () {
            test.ok(sandbox.test1);
            test.ok(sandbox.test2);
            test.done();
        }, 0);
    },

    // Asynchronous context script execution:
    // Ensure that sandbox properties can be accessed as global variables.
    'createContext: sandbox properties should be globals' : function (test) {
        var sandbox = {
            setTimeout : setTimeout,
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        var context = Contextify.createContext(sandbox);
        context.run("setTimeout(function () {" +
                    "test1 = (prop1 == 'prop1');" +
                    "test2 = (prop2 == 'prop2');" +
                    "}, 0)");
        test.equal(sandbox.test1, undefined);
        test.equal(sandbox.test2, undefined);
        setTimeout(function () {
            test.ok(sandbox.test1);
            test.ok(sandbox.test2);
            test.done();
        }, 0);
    },

    // Asynchronous context script execution:
    // Ensure that async execution is safely executed after dispose
    'setTimeout should not fail after dispose' : function (test) {
        var sandbox = {
            test: test,
            setTimeout : setTimeout,
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        sandbox.run("setTimeout(function () {" +
                    "test.ok(prop1 == 'prop1');" +
                    "test.ok(prop2 == 'prop2');" +
                    "test.done();" +
                    "}, 10)");
        test.equal(sandbox.test1, undefined);
        test.equal(sandbox.test2, undefined);
        sandbox.dispose();
    }
};

exports['test global'] = {
    // Make sure getGlobal() works.
    'basic test' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        Contextify(sandbox);
        var global = sandbox.getGlobal();
        test.notDeepEqual(global, null);
        test.notDeepEqual(global, undefined);
        // Make sure global is forwarding properly.
        test.equal(global.prop1, 'prop1');
        test.equal(global.prop2, 'prop2');
        global.prop3 = 'prop3';
        test.equal(sandbox.prop3, 'prop3');
        test.done();
    },

    // Make sure that references to the global are correct.
    'self references to the global object' : function (test) {
        var sandbox = Contextify({});
        var global = sandbox.getGlobal();
        sandbox.ref1 = global;
        sandbox.ref2 = {
            ref2 : global
        };
        sandbox.run("test1 = (this == ref1);" +
                    "test2 = (this == ref2.ref2);");
        test.ok(sandbox.test1);
        test.ok(sandbox.test2);
        test.done();
    },

    // Make sure the enumerator is enumerating correctly.
    'test enumerator' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        var global = Contextify(sandbox).getGlobal();
        var globalProps = Object.keys(global);
        test.equal(globalProps.length, 5);
        test.ok(globalProps.indexOf('prop1') != -1);
        test.ok(globalProps.indexOf('prop2') != -1);
        test.ok(globalProps.indexOf('run') != -1);
        test.ok(globalProps.indexOf('getGlobal') != -1);
        test.ok(globalProps.indexOf('dispose') != -1);
        test.done();
    },

    // Make sure deleter is working.
    'test deleter' : function (test) {
        var sandbox = {
            prop1 : 'prop1',
            prop2 : 'prop2'
        };
        var global = Contextify(sandbox).getGlobal();
        test.equal(Object.keys(global).length, 5);
        test.equal(Object.keys(sandbox).length, 5);
        delete global.prop1;
        test.equal(Object.keys(global).length, 4);
        test.equal(Object.keys(sandbox).length, 4);
        delete global.prop2;
        test.equal(Object.keys(global).length, 3);
        test.equal(Object.keys(sandbox).length, 3);
        delete global.run;
        test.equal(Object.keys(global).length, 2);
        test.equal(Object.keys(sandbox).length, 2);
        delete global.getGlobal;
        test.equal(Object.keys(global).length, 1);
        test.equal(Object.keys(sandbox).length, 1);
        delete global.dispose;
        test.equal(Object.keys(global).length, 0);
        test.equal(Object.keys(sandbox).length, 0);
        test.done();
    },

    // Make sure the global's class name is the same as the sandbox.
    'test global class name' : function (test) {
        function DOMWindow () {};
        var sandbox = Contextify(new DOMWindow());
        var global = sandbox.getGlobal();
        test.equal(sandbox.constructor.name, 'DOMWindow');
        test.equal(sandbox.constructor.name, global.constructor.name);
        sandbox.run('thisName = this.constructor.name');
        test.equal(sandbox.thisName, sandbox.constructor.name);
        test.done();
    },

    // Make sure functions in global scope are accessible through global.
    'test global functions' : function (test) {
        var sandbox = Contextify();
        var global = sandbox.getGlobal();
        sandbox.run("function testing () {}");
        test.notEqual(global.testing, undefined);
        test.done();
    },

    // Make sure global can be a receiver for run().
    'test global.run()' : function (test) {
        var global = Contextify().getGlobal();
        global.run("x = 5");
        test.equal(global.x, 5);
        test.done();
    },

    // Make sure global can be a receiver for getGlobal().
    'test global.getGlobal()' : function (test) {
        var global = Contextify().getGlobal();
        test.deepEqual(global, global.getGlobal());
        test.done();
    },

    //Make sure global can be a receiver for dispose().
    'test global.dispose()' : function (test) {
        var sandbox = Contextify();
        var global = sandbox.getGlobal();
        test.notEqual(global.run, undefined);
        test.notEqual(global.getGlobal, undefined);
        test.notEqual(global.dispose, undefined);
        global.dispose();
        // It's not safe to use the global after disposing.
        test.throws(function () {
            sandbox.run();
        }, Error);
        test.throws(function () {
            sandbox.getGlobal();
        }, Error);
        test.throws(function () {
            sandbox.dispose();
        }, Error);
        test.done();
    },

    'test context delete global' : function (test) {
        var sandbox = Contextify({});
        sandbox.global = sandbox.getGlobal();
        sandbox.run('delete global.global;');
        test.ok(!sandbox.global);
        sandbox.dispose();
        test.done();
    },

    'test context delete unwritable global' : function (test) {
        var sandbox = Contextify({});
        Object.defineProperty(sandbox, 'global', {
          enumerable: false,
          configurable: false,
          writable: false,
          value: sandbox.getGlobal()
        });

        sandbox.run('delete global.global;');
        test.ok(sandbox.global);
        test.ok(sandbox.global.global);
        sandbox.dispose();
        test.done();
    }
};


// Test that multiple contexts don't interfere with each other.
exports['test multiple contexts'] = function (test) {
    var sandbox1 = {
        prop1 : 'prop1',
        prop2 : 'prop2'
    };
    var sandbox2 = {
        prop1 : 'prop1',
        prop2 : 'prop2'
    };
    var global1 = Contextify(sandbox1).getGlobal();
    var global2 = Contextify(sandbox2).getGlobal();
    test.equal(global1.prop1, 'prop1');
    test.equal(global2.prop1, 'prop1');
    sandbox1.run('test = 3');
    sandbox2.run('test = 4');
    test.equal(sandbox1.test, 3);
    test.equal(global1.test, 3);
    test.equal(sandbox2.test, 4);
    test.equal(global2.test, 4);
    test.done();
};

// Test console - segfaults in REPL.
exports['test console'] = function (test) {
    var sandbox = {
        console : console,
        prop1 : 'prop1'
    };
    Contextify(sandbox);
    test.doesNotThrow(function () {
        sandbox.run('console.log(prop1);');
    });
    test.done();
};


// Test eval scope.
exports['test eval'] = {
    'basic test' : function (test) {
        var sandbox = Contextify();
        sandbox.run('eval("test1 = 1")');
        test.equal(sandbox.test1, 1);
        sandbox.run('(function() { eval("test2 = 2") })()');
        test.equal(sandbox.test2, 2);
        test.done();
    },

    'this test' : function (test) {
        var sandbox = Contextify();
        sandbox.run('e = eval ; e("test1 = 1")');
        test.equal(sandbox.test1, 1);
        sandbox.run('var t = 1 ; (function() { var t = 2; test2 = eval("t") })()');
        test.equal(sandbox.test2, 2);
        sandbox.run('t = 1 ; (function() { var t = 2; e = eval; test3 = e("t") })()');
        test.equal(sandbox.test3, 1);
        sandbox.run('var t = 1 ; global = this; (function() { var t = 2; e = eval; test4 = global.eval.call(global, "t") })()');
        test.equal(sandbox.test4, 1);
        test.done();
    }
};


// Make sure exceptions get thrown for invalid scripts.
exports['test exceptions'] = {
    'basic test' : function (test) {
        var sandbox = Contextify();
        // Exceptions thrown from "run" will be from the Contextified context.
        var ReferenceError = sandbox.run('ReferenceError');
        var SyntaxError    = sandbox.run('SyntaxError');
        test.throws(function () {
            sandbox.run('doh');
        }, ReferenceError);
        test.throws(function () {
            sandbox.run('x = y');
        }, ReferenceError);
        test.throws(function () {
            sandbox.run('function ( { (( }{);');
        }, SyntaxError);
        test.done();
    },

    'test double dispose() - sandbox' : function (test) {
        var sandbox = Contextify();
        test.doesNotThrow(function () {
            sandbox.dispose();
        });
        test.throws(function () {
            sandbox.dispose();
        }, 'Called dispose() twice.');
        test.done();
    },

    'test double dispose - global' : function (test) {
        var sandbox = Contextify();
        var global = sandbox.getGlobal();
        test.doesNotThrow(function () {
            global.dispose();
        });
        test.throws(function () {
            global.dispose();
        }, 'Called dispose() twice.');
        test.done();
    },

    'test run() after dispose()' : function (test) {
        var sandbox = Contextify();
        test.doesNotThrow(function () {
            sandbox.dispose();
        });
        test.throws(function () {
            sandbox.run('var x = 3');
        }, 'Called run() after dispose().');
        test.done();
    },

    'test getGlobal() after dispose()' : function (test) {
        var sandbox = Contextify();
        test.doesNotThrow(function () {
            sandbox.dispose();
        });
        test.throws(function () {
            var g = sandbox.getGlobal();
        }, 'Called getGlobal() after dispose().');
        test.done();
    }
};

exports['test scripts'] = {
    'test createScript()' : function (test) {
        var script = Contextify.createScript('var x = 3', 'test.js');
        test.equal(typeof script.runInContext, 'function');
        test.done();
    },

    'test createScript() without code' : function (test) {
        test.throws(function () {
            Contextify.createScript();
        });
        test.throws(function () {
            Contextify.createScript(true);
        });
        test.throws(function () {
            Contextify.createScript(null);
        });
        test.throws(function () {
            Contextify.createScript(1);
        });
        test.done();
    },

    'test runInContext' : function (test) {
        var sandbox = {};
        var script = Contextify.createScript('var x = 3', 'test.js');
        var context = Contextify.createContext(sandbox);
        script.runInContext(context);
        test.equal(sandbox.x, 3);
        test.done();
    }
};

// Load modules

var Fs = require('fs');
var Path = require('path');
var Code = require('code');
var Hoek = require('../lib');
var Lab = require('lab');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var expect = Code.expect;


var nestedObj = {
    v: [7, 8, 9],
    w: /^something$/igm,
    x: {
        a: [1, 2, 3],
        b: 123456,
        c: new Date(),
        d: /hi/igm,
        e: /hello/
    },
    y: 'y',
    z: new Date(1378775452757)
};

var dupsArray = [nestedObj, { z: 'z' }, nestedObj];
var reducedDupsArray = [nestedObj, { z: 'z' }];

describe('clone()', function () {

    it('clones a nested object', function (done) {

        var a = nestedObj;
        var b = Hoek.clone(a);

        expect(a).to.deep.equal(b);
        expect(a.z.getTime()).to.equal(b.z.getTime());
        done();
    });

    it('clones a null object', function (done) {

        var b = Hoek.clone(null);

        expect(b).to.equal(null);
        done();
    });

    it('should not convert undefined properties to null', function (done) {

        var obj = { something: undefined };
        var b = Hoek.clone(obj);

        expect(typeof b.something).to.equal('undefined');
        done();
    });

    it('should not throw on circular reference', function (done) {

        var a = {};
        a.x = a;

        var test = function () {

            var b = Hoek.clone(a);
        };

        expect(test).to.not.throw();
        done();
    });

    it('clones circular reference', function (done) {

        var x = {
            'z': new Date()
        };
        x.y = x;

        var b = Hoek.clone(x);
        expect(Object.keys(b.y)).to.deep.equal(Object.keys(x));
        expect(b.z).to.not.equal(x.z);
        expect(b.y).to.not.equal(x.y);
        expect(b.y.z).to.not.equal(x.y.z);
        expect(b.y).to.equal(b);
        expect(b.y.y.y.y).to.equal(b);
        done();
    });

    it('clones an object with a null prototype', function (done) {

        var obj = Object.create(null);
        var b = Hoek.clone(obj);

        expect(b).to.deep.equal(obj);
        done();
    });

    it('clones deeply nested object', function (done) {

        var a = {
            x: {
                y: {
                    a: [1, 2, 3],
                    b: 123456,
                    c: new Date(),
                    d: /hi/igm,
                    e: /hello/
                }
            }
        };

        var b = Hoek.clone(a);

        expect(a).to.deep.equal(b);
        expect(a.x.y.c.getTime()).to.equal(b.x.y.c.getTime());
        done();
    });

    it('clones arrays', function (done) {

        var a = [1, 2, 3];

        var b = Hoek.clone(a);

        expect(a).to.deep.equal(b);
        done();
    });

    it('performs actual copy for shallow keys (no pass by reference)', function (done) {

        var x = Hoek.clone(nestedObj);
        var y = Hoek.clone(nestedObj);

        // Date
        expect(x.z).to.not.equal(nestedObj.z);
        expect(x.z).to.not.equal(y.z);

        // Regex
        expect(x.w).to.not.equal(nestedObj.w);
        expect(x.w).to.not.equal(y.w);

        // Array
        expect(x.v).to.not.equal(nestedObj.v);
        expect(x.v).to.not.equal(y.v);

        // Immutable(s)
        x.y = 5;
        expect(x.y).to.not.equal(nestedObj.y);
        expect(x.y).to.not.equal(y.y);

        done();
    });

    it('performs actual copy for deep keys (no pass by reference)', function (done) {

        var x = Hoek.clone(nestedObj);
        var y = Hoek.clone(nestedObj);

        expect(x.x.c).to.not.equal(nestedObj.x.c);
        expect(x.x.c).to.not.equal(y.x.c);

        expect(x.x.c.getTime()).to.equal(nestedObj.x.c.getTime());
        expect(x.x.c.getTime()).to.equal(y.x.c.getTime());
        done();
    });

    it('copies functions with properties', function (done) {

        var a = {
            x: function () {

                return 1;
            },
            y: {}
        };
        a.x.z = 'string in function';
        a.x.v = function () {

            return 2;
        };
        a.y.u = a.x;

        var b = Hoek.clone(a);
        expect(b.x()).to.equal(1);
        expect(b.x.v()).to.equal(2);
        expect(b.y.u).to.equal(b.x);
        expect(b.x.z).to.equal('string in function');
        done();
    });

    it('should copy a buffer', function (done) {

        var tls = {
            key: new Buffer([1, 2, 3, 4, 5]),
            cert: new Buffer([1, 2, 3, 4, 5, 6, 10])
        };

        var copiedTls = Hoek.clone(tls);
        expect(Buffer.isBuffer(copiedTls.key)).to.equal(true);
        expect(JSON.stringify(copiedTls.key)).to.equal(JSON.stringify(tls.key));
        expect(Buffer.isBuffer(copiedTls.cert)).to.equal(true);
        expect(JSON.stringify(copiedTls.cert)).to.equal(JSON.stringify(tls.cert));
        done();
    });

    it('clones an object with a prototype', function (done) {

        var Obj = function () {

            this.a = 5;
        };

        Obj.prototype.b = function () {

            return 'c';
        };

        var a = new Obj();
        var b = Hoek.clone(a);

        expect(b.a).to.equal(5);
        expect(b.b()).to.equal('c');
        expect(a).to.deep.equal(b);
        done();
    });

    it('reuses cloned Date object', function (done) {

        var obj = {
            a: new Date()
        };

        obj.b = obj.a;

        var copy = Hoek.clone(obj);
        expect(copy.a).to.equal(copy.b);
        done();
    });

    it('shallow copies an object with a prototype and isImmutable flag', function (done) {

        var Obj = function () {

            this.value = 5;
        };

        Obj.prototype.b = function () {

            return 'c';
        };

        Obj.prototype.isImmutable = true;

        var obj = {
            a: new Obj()
        };

        var copy = Hoek.clone(obj);

        expect(obj.a.value).to.equal(5);
        expect(copy.a.value).to.equal(5);
        expect(copy.a.b()).to.equal('c');
        expect(obj.a).to.equal(copy.a);
        done();
    });

    it('clones an object with property getter without executing it', function (done) {

        var obj = {};
        var value = 1;
        var execCount = 0;

        Object.defineProperty(obj, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                ++execCount;
                return value;
            }
        });

        var copy = Hoek.clone(obj);
        expect(execCount).to.equal(0);
        expect(copy.test).to.equal(1);
        expect(execCount).to.equal(1);
        done();
    });

    it('clones an object with property getter and setter', function (done) {

        var obj = {
            _test: 0
        };

        Object.defineProperty(obj, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                return this._test;
            },
            set: function (value) {

                this._test = value - 1;
            }
        });

        var copy = Hoek.clone(obj);
        expect(copy.test).to.equal(0);
        copy.test = 5;
        expect(copy.test).to.equal(4);
        done();
    });

    it('clones an object with only property setter', function (done) {

        var obj = {
            _test: 0
        };

        Object.defineProperty(obj, 'test', {
            enumerable: true,
            configurable: true,
            set: function (value) {

                this._test = value - 1;
            }
        });

        var copy = Hoek.clone(obj);
        expect(copy._test).to.equal(0);
        copy.test = 5;
        expect(copy._test).to.equal(4);
        done();
    });

    it('clones an object with non-enumerable properties', function (done) {

        var obj = {
            _test: 0
        };

        Object.defineProperty(obj, 'test', {
            enumerable: false,
            configurable: true,
            set: function (value) {

                this._test = value - 1;
            }
        });

        var copy = Hoek.clone(obj);
        expect(copy._test).to.equal(0);
        copy.test = 5;
        expect(copy._test).to.equal(4);
        done();
    });
});

describe('merge()', function () {

    it('deep copies source items', function (done) {

        var target = {
            b: 3,
            d: []
        };

        var source = {
            c: {
                d: 1
            },
            d: [{ e: 1 }]
        };

        Hoek.merge(target, source);
        expect(target.c).to.not.equal(source.c);
        expect(target.c).to.deep.equal(source.c);
        expect(target.d).to.not.equal(source.d);
        expect(target.d[0]).to.not.equal(source.d[0]);
        expect(target.d).to.deep.equal(source.d);
        done();
    });

    it('merges array over an object', function (done) {

        var a = {
            x: ['n', 'm']
        };

        var b = {
            x: {
                n: '1',
                m: '2'
            }
        };

        Hoek.merge(b, a);
        expect(a.x[0]).to.equal('n');
        expect(a.x.n).to.not.exist();
        done();
    });

    it('merges object over an array', function (done) {

        var a = {
            x: ['n', 'm']
        };

        var b = {
            x: {
                n: '1',
                m: '2'
            }
        };

        Hoek.merge(a, b);
        expect(a.x.n).to.equal('1');
        expect(a.x[0]).to.not.exist();
        done();
    });

    it('does not throw if source is null', function (done) {

        var a = {};
        var b = null;
        var c = null;

        expect(function () {

            c = Hoek.merge(a, b);
        }).to.not.throw();

        expect(c).to.equal(a);
        done();
    });

    it('does not throw if source is undefined', function (done) {

        var a = {};
        var b;
        var c = null;

        expect(function () {

            c = Hoek.merge(a, b);
        }).to.not.throw();

        expect(c).to.equal(a);
        done();
    });

    it('throws if source is not an object', function (done) {

        expect(function () {

            var a = {};
            var b = 0;

            Hoek.merge(a, b);
        }).to.throw('Invalid source value: must be null, undefined, or an object');
        done();
    });

    it('throws if target is not an object', function (done) {

        expect(function () {

            var a = 0;
            var b = {};

            Hoek.merge(a, b);
        }).to.throw('Invalid target value: must be an object');
        done();
    });

    it('throws if target is not an array and source is', function (done) {

        expect(function () {

            var a = {};
            var b = [1, 2];

            Hoek.merge(a, b);
        }).to.throw('Cannot merge array onto an object');
        done();
    });

    it('returns the same object when merging arrays', function (done) {

        var a = [];
        var b = [1, 2];

        expect(Hoek.merge(a, b)).to.equal(a);
        done();
    });

    it('combines an empty object with a non-empty object', function (done) {

        var a = {};
        var b = nestedObj;

        var c = Hoek.merge(a, b);
        expect(a).to.deep.equal(b);
        expect(c).to.deep.equal(b);
        done();
    });

    it('overrides values in target', function (done) {

        var a = { x: 1, y: 2, z: 3, v: 5, t: 'test', m: 'abc' };
        var b = { x: null, z: 4, v: 0, t: { u: 6 }, m: '123' };

        var c = Hoek.merge(a, b);
        expect(c.x).to.equal(null);
        expect(c.y).to.equal(2);
        expect(c.z).to.equal(4);
        expect(c.v).to.equal(0);
        expect(c.m).to.equal('123');
        expect(c.t).to.deep.equal({ u: 6 });
        done();
    });

    it('overrides values in target (flip)', function (done) {

        var a = { x: 1, y: 2, z: 3, v: 5, t: 'test', m: 'abc' };
        var b = { x: null, z: 4, v: 0, t: { u: 6 }, m: '123' };

        var d = Hoek.merge(b, a);
        expect(d.x).to.equal(1);
        expect(d.y).to.equal(2);
        expect(d.z).to.equal(3);
        expect(d.v).to.equal(5);
        expect(d.m).to.equal('abc');
        expect(d.t).to.deep.equal('test');
        done();
    });

    it('retains Date properties', function (done) {

        var a = { x: new Date(1378776452757) };

        var b = Hoek.merge({}, a);
        expect(a.x.getTime()).to.equal(b.x.getTime());
        done();
    });

    it('retains Date properties when merging keys', function (done) {

        var a = { x: new Date(1378776452757) };

        var b = Hoek.merge({ x: {} }, a);
        expect(a.x.getTime()).to.equal(b.x.getTime());
        done();
    });

    it('overrides Buffer', function (done) {

        var a = { x: new Buffer('abc') };

        var b = Hoek.merge({ x: {} }, a);
        expect(a.x.toString()).to.equal('abc');
        done();
    });
});

describe('applyToDefaults()', function () {

    var defaults = {
        a: 1,
        b: 2,
        c: {
            d: 3,
            e: [5, 6]
        },
        f: 6,
        g: 'test'
    };

    it('throws when target is null', function (done) {

        expect(function () {

            Hoek.applyToDefaults(null, {});
        }).to.throw('Invalid defaults value: must be an object');
        done();
    });

    it('returns null if options is false', function (done) {

        var result = Hoek.applyToDefaults(defaults, false);
        expect(result).to.equal(null);
        done();
    });

    it('returns null if options is null', function (done) {

        var result = Hoek.applyToDefaults(defaults, null);
        expect(result).to.equal(null);
        done();
    });

    it('returns null if options is undefined', function (done) {

        var result = Hoek.applyToDefaults(defaults, undefined);
        expect(result).to.equal(null);
        done();
    });

    it('returns a copy of defaults if options is true', function (done) {

        var result = Hoek.applyToDefaults(defaults, true);
        expect(result).to.deep.equal(defaults);
        done();
    });

    it('applies object to defaults', function (done) {

        var obj = {
            a: null,
            c: {
                e: [4]
            },
            f: 0,
            g: {
                h: 5
            }
        };

        var result = Hoek.applyToDefaults(defaults, obj);
        expect(result.c.e).to.deep.equal([4]);
        expect(result.a).to.equal(1);
        expect(result.b).to.equal(2);
        expect(result.f).to.equal(0);
        expect(result.g).to.deep.equal({ h: 5 });
        done();
    });

    it('applies object to defaults with null', function (done) {

        var obj = {
            a: null,
            c: {
                e: [4]
            },
            f: 0,
            g: {
                h: 5
            }
        };

        var result = Hoek.applyToDefaults(defaults, obj, true);
        expect(result.c.e).to.deep.equal([4]);
        expect(result.a).to.equal(null);
        expect(result.b).to.equal(2);
        expect(result.f).to.equal(0);
        expect(result.g).to.deep.equal({ h: 5 });
        done();
    });
});

describe('cloneWithShallow()', function () {

    it('deep clones except for listed keys', function (done) {

        var source = {
            a: {
                b: 5
            },
            c: {
                d: 6
            }
        };

        var copy = Hoek.cloneWithShallow(source, ['c']);
        expect(copy).to.deep.equal(source);
        expect(copy).to.not.equal(source);
        expect(copy.a).to.not.equal(source.a);
        expect(copy.b).to.equal(source.b);
        done();
    });

    it('returns immutable value', function (done) {

        expect(Hoek.cloneWithShallow(5)).to.equal(5);
        done();
    });

    it('returns null value', function (done) {

        expect(Hoek.cloneWithShallow(null)).to.equal(null);
        done();
    });

    it('returns undefined value', function (done) {

        expect(Hoek.cloneWithShallow(undefined)).to.equal(undefined);
        done();
    });

    it('deep clones except for listed keys (including missing keys)', function (done) {

        var source = {
            a: {
                b: 5
            },
            c: {
                d: 6
            }
        };

        var copy = Hoek.cloneWithShallow(source, ['c', 'v']);
        expect(copy).to.deep.equal(source);
        expect(copy).to.not.equal(source);
        expect(copy.a).to.not.equal(source.a);
        expect(copy.b).to.equal(source.b);
        done();
    });
});

describe('applyToDefaultsWithShallow()', function () {

    it('shallow copies the listed keys from options without merging', function (done) {

        var defaults = {
            a: {
                b: 5,
                e: 3
            },
            c: {
                d: 7,
                g: 1
            }
        };

        var options = {
            a: {
                b: 4
            },
            c: {
                d: 6,
                f: 7
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, options, ['a']);
        expect(merged).to.deep.equal({ a: { b: 4 }, c: { d: 6, g: 1, f: 7 } });
        expect(merged.a).to.equal(options.a);
        expect(merged.a).to.not.equal(defaults.a);
        expect(merged.c).to.not.equal(options.c);
        expect(merged.c).to.not.equal(defaults.c);
        done();
    });

    it('shallow copies the nested keys (override)', function (done) {

        var defaults = {
            a: {
                b: 5
            },
            c: {
                d: 7,
                g: 1
            }
        };

        var options = {
            a: {
                b: 4
            },
            c: {
                d: 6,
                g: {
                    h: 8
                }
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, options, ['c.g']);
        expect(merged).to.deep.equal({ a: { b: 4 }, c: { d: 6, g: { h: 8 } } });
        expect(merged.c.g).to.equal(options.c.g);
        done();
    });

    it('shallow copies the nested keys (missing)', function (done) {

        var defaults = {
            a: {
                b: 5
            }
        };

        var options = {
            a: {
                b: 4
            },
            c: {
                g: {
                    h: 8
                }
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, options, ['c.g']);
        expect(merged).to.deep.equal({ a: { b: 4 }, c: { g: { h: 8 } } });
        expect(merged.c.g).to.equal(options.c.g);
        done();
    });

    it('shallow copies the nested keys (override)', function (done) {

        var defaults = {
            a: {
                b: 5
            },
            c: {
                g: {
                    d: 7
                }
            }
        };

        var options = {
            a: {
                b: 4
            },
            c: {
                g: {
                    h: 8
                }
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, options, ['c.g']);
        expect(merged).to.deep.equal({ a: { b: 4 }, c: { g: { h: 8 } } });
        expect(merged.c.g).to.equal(options.c.g);
        done();
    });

    it('shallow copies the nested keys (deeper)', function (done) {

        var defaults = {
            a: {
                b: 5
            }
        };

        var options = {
            a: {
                b: 4
            },
            c: {
                g: {
                    r: {
                        h: 8
                    }
                }
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, options, ['c.g.r']);
        expect(merged).to.deep.equal({ a: { b: 4 }, c: { g: { r: { h: 8 } } } });
        expect(merged.c.g.r).to.equal(options.c.g.r);
        done();
    });

    it('shallow copies the nested keys (not present)', function (done) {

        var defaults = {
            a: {
                b: 5
            }
        };

        var options = {
            a: {
                b: 4
            },
            c: {
                g: {
                    r: {
                        h: 8
                    }
                }
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, options, ['x.y']);
        expect(merged).to.deep.equal({ a: { b: 4 }, c: { g: { r: { h: 8 } } } });
        done();
    });

    it('shallow copies the listed keys in the defaults', function (done) {

        var defaults = {
            a: {
                b: 1
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, {}, ['a']);
        expect(merged.a).to.equal(defaults.a);
        done();
    });

    it('shallow copies the listed keys in the defaults (true)', function (done) {

        var defaults = {
            a: {
                b: 1
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, true, ['a']);
        expect(merged.a).to.equal(defaults.a);
        done();
    });

    it('returns null on false', function (done) {

        var defaults = {
            a: {
                b: 1
            }
        };

        var merged = Hoek.applyToDefaultsWithShallow(defaults, false, ['a']);
        expect(merged).to.equal(null);
        done();
    });

    it('throws on missing defaults', function (done) {

        expect(function () {

            Hoek.applyToDefaultsWithShallow(null, {}, ['a']);
        }).to.throw('Invalid defaults value: must be an object');
        done();
    });

    it('throws on invalid defaults', function (done) {

        expect(function () {

            Hoek.applyToDefaultsWithShallow('abc', {}, ['a']);
        }).to.throw('Invalid defaults value: must be an object');
        done();
    });

    it('throws on invalid options', function (done) {

        expect(function () {

            Hoek.applyToDefaultsWithShallow({}, 'abc', ['a']);
        }).to.throw('Invalid options value: must be true, falsy or an object');
        done();
    });

    it('throws on missing keys', function (done) {

        expect(function () {

            Hoek.applyToDefaultsWithShallow({}, true);
        }).to.throw('Invalid keys');
        done();
    });

    it('throws on invalid keys', function (done) {

        expect(function () {

            Hoek.applyToDefaultsWithShallow({}, true, 'a');
        }).to.throw('Invalid keys');
        done();
    });
});

describe('deepEqual()', function () {

    it('compares simple values', function (done) {

        expect(Hoek.deepEqual('x', 'x')).to.be.true();
        expect(Hoek.deepEqual('x', 'y')).to.be.false();
        expect(Hoek.deepEqual('x1', 'x')).to.be.false();
        expect(Hoek.deepEqual(-0, +0)).to.be.false();
        expect(Hoek.deepEqual(-0, -0)).to.be.true();
        expect(Hoek.deepEqual(+0, +0)).to.be.true();
        expect(Hoek.deepEqual(+0, -0)).to.be.false();
        expect(Hoek.deepEqual(1, 1)).to.be.true();
        expect(Hoek.deepEqual(0, 0)).to.be.true();
        expect(Hoek.deepEqual(-1, 1)).to.be.false();
        expect(Hoek.deepEqual(NaN, 0)).to.be.false();
        expect(Hoek.deepEqual(NaN, NaN)).to.be.true();
        done();
    });

    it('compares different types', function (done) {

        expect(Hoek.deepEqual([], 5)).to.be.false();
        expect(Hoek.deepEqual(5, [])).to.be.false();
        expect(Hoek.deepEqual({}, null)).to.be.false();
        expect(Hoek.deepEqual(null, {})).to.be.false();
        expect(Hoek.deepEqual('abc', {})).to.be.false();
        expect(Hoek.deepEqual({}, 'abc')).to.be.false();
        done();
    });

    it('compares empty structures', function (done) {

        expect(Hoek.deepEqual([], [])).to.be.true();
        expect(Hoek.deepEqual({}, {})).to.be.true();
        expect(Hoek.deepEqual([], {})).to.be.false();
        done();
    });

    it('compares empty arguments object', function (done) {

        var compare = function () {

            expect(Hoek.deepEqual([], arguments)).to.be.false();
        };

        compare();
        done();
    });

    it('compares empty arguments objects', function (done) {

        var compare = function () {

            var arg1 = arguments;

            var inner = function () {

                expect(Hoek.deepEqual(arg1, arguments)).to.be.false(); // callee is not the same
            };

            inner();
        };

        compare();
        done();
    });

    it('compares dates', function (done) {

        expect(Hoek.deepEqual(new Date(2015, 1, 1), new Date(2015, 1, 1))).to.be.true();
        expect(Hoek.deepEqual(new Date(100), new Date(101))).to.be.false();
        expect(Hoek.deepEqual(new Date(), {})).to.be.false();
        done();
    });

    it('compares regular expressions', function (done) {

        expect(Hoek.deepEqual(/\s/, new RegExp('\\\s'))).to.be.true();
        expect(Hoek.deepEqual(/\s/g, /\s/g)).to.be.true();
        expect(Hoek.deepEqual(/a/, {})).to.be.false();
        expect(Hoek.deepEqual(/\s/g, /\s/i)).to.be.false();
        expect(Hoek.deepEqual(/a/g, /b/g)).to.be.false();
        done();
    });

    it('compares arrays', function (done) {

        expect(Hoek.deepEqual([[1]], [[1]])).to.be.true();
        expect(Hoek.deepEqual([1, 2, 3], [1, 2, 3])).to.be.true();
        expect(Hoek.deepEqual([1, 2, 3], [1, 3, 2])).to.be.false();
        expect(Hoek.deepEqual([1, 2, 3], [1, 2])).to.be.false();
        expect(Hoek.deepEqual([1], [1])).to.be.true();
        done();
    });

    it('compares buffers', function (done) {

        expect(Hoek.deepEqual(new Buffer([1, 2, 3]), new Buffer([1, 2, 3]))).to.be.true();
        expect(Hoek.deepEqual(new Buffer([1, 2, 3]), new Buffer([1, 3, 2]))).to.be.false();
        expect(Hoek.deepEqual(new Buffer([1, 2, 3]), new Buffer([1, 2]))).to.be.false();
        expect(Hoek.deepEqual(new Buffer([1, 2, 3]), {})).to.be.false();
        expect(Hoek.deepEqual(new Buffer([1, 2, 3]), [1, 2, 3])).to.be.false();
        done();
    });

    it('compares objects', function (done) {

        expect(Hoek.deepEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 })).to.be.true();
        expect(Hoek.deepEqual({ foo: 'bar' }, { foo: 'baz' })).to.be.false();
        expect(Hoek.deepEqual({ foo: { bar: 'foo' } }, { foo: { bar: 'baz' } })).to.be.false();
        done();
    });

    it('handles circular dependency', function (done) {

        var a = {};
        a.x = a;

        var b = Hoek.clone(a);
        expect(Hoek.deepEqual(a, b)).to.be.true();
        done();
    });

    it('compares an object with property getter without executing it', function (done) {

        var obj = {};
        var value = 1;
        var execCount = 0;

        Object.defineProperty(obj, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                ++execCount;
                return value;
            }
        });

        var copy = Hoek.clone(obj);
        expect(Hoek.deepEqual(obj, copy)).to.be.true();
        expect(execCount).to.equal(0);
        expect(copy.test).to.equal(1);
        expect(execCount).to.equal(1);
        done();
    });

    it('compares objects with property getters', function (done) {

        var obj = {};
        Object.defineProperty(obj, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                return 1;
            }
        });

        var ref = {};
        Object.defineProperty(ref, 'test', {
            enumerable: true,
            configurable: true,
            get: function () {

                return 2;
            }
        });

        expect(Hoek.deepEqual(obj, ref)).to.be.false();
        done();
    });

    it('compares object prototypes', function (done) {

        var Obj = function () {

            this.a = 5;
        };

        Obj.prototype.b = function () {

            return this.a;
        };

        var Ref = function () {

            this.a = 5;
        };

        Ref.prototype.b = function () {

            return this.a;
        };

        expect(Hoek.deepEqual(new Obj(), new Ref())).to.be.false();
        expect(Hoek.deepEqual(new Obj(), new Obj())).to.be.true();
        expect(Hoek.deepEqual(new Ref(), new Ref())).to.be.true();
        done();
    });

    it('compares plain objects', function (done) {

        var a = Object.create(null);
        var b = Object.create(null);

        a.b = 'c';
        b.b = 'c';

        expect(Hoek.deepEqual(a, b)).to.be.true();
        expect(Hoek.deepEqual(a, { b: 'c' })).to.be.false();
        done();
    });

    it('compares an object with an empty object', function (done) {

        var a = { a: 1, b: 2 };

        expect(Hoek.deepEqual({}, a)).to.be.false();
        expect(Hoek.deepEqual(a, {})).to.be.false();
        done();
    });

    it('compares an object ignoring the prototype', function (done) {

        var a = Object.create(null);
        var b = {};

        expect(Hoek.deepEqual(a, b, { prototype: false })).to.be.true();
        done();
    });

    it('compares an object ignoring the prototype recursively', function (done) {

        var a = [Object.create(null)];
        var b = [{}];

        expect(Hoek.deepEqual(a, b, { prototype: false })).to.be.true();
        done();
    });
});

describe('unique()', function () {

    it('ensures uniqueness within array of objects based on subkey', function (done) {

        var a = Hoek.unique(dupsArray, 'x');
        expect(a).to.deep.equal(reducedDupsArray);
        done();
    });

    it('removes duplicated without key', function (done) {

        expect(Hoek.unique([1, 2, 3, 4, 2, 1, 5])).to.deep.equal([1, 2, 3, 4, 5]);
        done();
    });
});

describe('mapToObject()', function () {

    it('returns null on null array', function (done) {

        var a = Hoek.mapToObject(null);
        expect(a).to.equal(null);
        done();
    });

    it('converts basic array to existential object', function (done) {

        var keys = [1, 2, 3, 4];
        var a = Hoek.mapToObject(keys);
        for (var i in keys) {
            expect(a[keys[i]]).to.equal(true);
        }
        done();
    });

    it('converts array of objects to existential object', function (done) {

        var keys = [{ x: 1 }, { x: 2 }, { x: 3 }, { y: 4 }];
        var subkey = 'x';
        var a = Hoek.mapToObject(keys, subkey);
        expect(a).to.deep.equal({ 1: true, 2: true, 3: true });
        done();
    });
});

describe('intersect()', function () {

    it('returns the common objects of two arrays', function (done) {

        var array1 = [1, 2, 3, 4, 4, 5, 5];
        var array2 = [5, 4, 5, 6, 7];
        var common = Hoek.intersect(array1, array2);
        expect(common.length).to.equal(2);
        done();
    });

    it('returns just the first common object of two arrays', function (done) {

        var array1 = [1, 2, 3, 4, 4, 5, 5];
        var array2 = [5, 4, 5, 6, 7];
        var common = Hoek.intersect(array1, array2, true);
        expect(common).to.equal(5);
        done();
    });

    it('returns null when no common and returning just the first common object of two arrays', function (done) {

        var array1 = [1, 2, 3, 4, 4, 5, 5];
        var array2 = [6, 7];
        var common = Hoek.intersect(array1, array2, true);
        expect(common).to.equal(null);
        done();
    });

    it('returns an empty array if either input is null', function (done) {

        expect(Hoek.intersect([1], null).length).to.equal(0);
        expect(Hoek.intersect(null, [1]).length).to.equal(0);
        done();
    });

    it('returns the common objects of object and array', function (done) {

        var array1 = [1, 2, 3, 4, 4, 5, 5];
        var array2 = [5, 4, 5, 6, 7];
        var common = Hoek.intersect(Hoek.mapToObject(array1), array2);
        expect(common.length).to.equal(2);
        done();
    });
});

describe('contain()', function () {

    it('tests strings', function (done) {

        expect(Hoek.contain('abc', 'ab')).to.be.true();
        expect(Hoek.contain('abc', 'abc', { only: true })).to.be.true();
        expect(Hoek.contain('aaa', 'a', { only: true })).to.be.true();
        expect(Hoek.contain('abc', 'b', { once: true })).to.be.true();
        expect(Hoek.contain('abc', ['a', 'c'])).to.be.true();
        expect(Hoek.contain('abc', ['a', 'd'], { part: true })).to.be.true();

        expect(Hoek.contain('abc', 'ac')).to.be.false();
        expect(Hoek.contain('abcd', 'abc', { only: true })).to.be.false();
        expect(Hoek.contain('aab', 'a', { only: true })).to.be.false();
        expect(Hoek.contain('abb', 'b', { once: true })).to.be.false();
        expect(Hoek.contain('abc', ['a', 'd'])).to.be.false();
        expect(Hoek.contain('abc', ['ab', 'bc'])).to.be.false();                      // Overlapping values not supported
        done();
    });

    it('tests arrays', function (done) {

        expect(Hoek.contain([1, 2, 3], 1)).to.be.true();
        expect(Hoek.contain([{ a: 1 }], { a: 1 }, { deep: true })).to.be.true();
        expect(Hoek.contain([1, 2, 3], [1, 2])).to.be.true();
        expect(Hoek.contain([{ a: 1 }], [{ a: 1 }], { deep: true })).to.be.true();
        expect(Hoek.contain([1, 1, 2], [1, 2], { only: true })).to.be.true();
        expect(Hoek.contain([1, 2], [1, 2], { once: true })).to.be.true();
        expect(Hoek.contain([1, 2, 3], [1, 4], { part: true })).to.be.true();
        expect(Hoek.contain([[1], [2]], [[1]], { deep: true })).to.be.true();

        expect(Hoek.contain([1, 2, 3], 4)).to.be.false();
        expect(Hoek.contain([{ a: 1 }], { a: 2 }, { deep: true })).to.be.false();
        expect(Hoek.contain([{ a: 1 }], { a: 1 })).to.be.false();
        expect(Hoek.contain([1, 2, 3], [4, 5])).to.be.false();
        expect(Hoek.contain([[3], [2]], [[1]])).to.be.false();
        expect(Hoek.contain([[1], [2]], [[1]])).to.be.false();
        expect(Hoek.contain([{ a: 1 }], [{ a: 2 }], { deep: true })).to.be.false();
        expect(Hoek.contain([1, 3, 2], [1, 2], { only: true })).to.be.false();
        expect(Hoek.contain([1, 2, 2], [1, 2], { once: true })).to.be.false();
        expect(Hoek.contain([0, 2, 3], [1, 4], { part: true })).to.be.false();
        done();
    });

    it('tests objects', function (done) {

        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, 'a')).to.be.true();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, ['a', 'c'])).to.be.true();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, ['a', 'b', 'c'], { only: true })).to.be.true();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1 })).to.be.true();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, c: 3 })).to.be.true();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, d: 4 }, { part: true })).to.be.true();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }, { only: true })).to.be.true();
        expect(Hoek.contain({ a: [1], b: [2], c: [3] }, { a: [1], c: [3] }, { deep: true })).to.be.true();
        expect(Hoek.contain({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true })).to.be.true();
        expect(Hoek.contain({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, part: true })).to.be.true();
        expect(Hoek.contain({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, part: false })).to.be.false();
        expect(Hoek.contain({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, only: true })).to.be.false();
        expect(Hoek.contain({ a: [{ b: 1 }, { c: 2 }, { d: 3, e: 4 }] }, { a: [{ b: 1 }, { d: 3 }] }, { deep: true, only: false })).to.be.true();

        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, 'd')).to.be.false();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, ['a', 'd'])).to.be.false();
        expect(Hoek.contain({ a: 1, b: 2, c: 3, d: 4 }, ['a', 'b', 'c'], { only: true })).to.be.false();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 2 })).to.be.false();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 2, b: 2 }, { part: true })).to.be.false();             // part does not ignore bad value
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, d: 3 })).to.be.false();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, d: 4 })).to.be.false();
        expect(Hoek.contain({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 }, { only: true })).to.be.false();
        expect(Hoek.contain({ a: [1], b: [2], c: [3] }, { a: [1], c: [3] })).to.be.false();
        expect(Hoek.contain({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } })).to.be.false();
        expect(Hoek.contain({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true })).to.be.true();
        expect(Hoek.contain({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, only: true })).to.be.false();
        expect(Hoek.contain({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, only: false })).to.be.true();
        expect(Hoek.contain({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, part: true })).to.be.true();
        expect(Hoek.contain({ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 1 } } }, { deep: true, part: false })).to.be.false();

        // Getter check
        var Foo = function (bar) {

            this.bar = bar;
        };

        Object.defineProperty(Foo.prototype, 'baz', {
            enumerable: true,
            get: function () {

                return this.bar;
            }
        });

        expect(Hoek.contain({ a: new Foo('b') }, { a: new Foo('b') }, { deep: true })).to.be.true();
        expect(Hoek.contain({ a: new Foo('b') }, { a: new Foo('b') }, { deep: true, part: true })).to.be.true();
        expect(Hoek.contain({ a: new Foo('b') }, { a: { baz: 'b' } }, { deep: true })).to.be.true();
        expect(Hoek.contain({ a: new Foo('b') }, { a: { baz: 'b' } }, { deep: true, only: true })).to.be.false();
        expect(Hoek.contain({ a: new Foo('b') }, { a: { baz: 'b' } }, { deep: true, part: false })).to.be.false();
        expect(Hoek.contain({ a: new Foo('b') }, { a: { baz: 'b' } }, { deep: true, part: true })).to.be.true();

        done();
    });
});

describe('flatten()', function () {

    it('returns a flat array', function (done) {

        var result = Hoek.flatten([1, 2, [3, 4, [5, 6], [7], 8], [9], [10, [11, 12]], 13]);
        expect(result.length).to.equal(13);
        expect(result).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
        done();
    });
});

describe('reach()', function () {

    var obj = {
        a: {
            b: {
                c: {
                    d: 1,
                    e: 2
                },
                f: 'hello'
            },
            g: {
                h: 3
            }
        },
        i: function () { },
        j: null,
        k: [4, 8, 9, 1]
    };

    obj.i.x = 5;

    it('returns first value of array', function (done) {

        expect(Hoek.reach(obj, 'k.0')).to.equal(4);
        done();
    });

    it('returns last value of array using negative index', function (done) {

        expect(Hoek.reach(obj, 'k.-2')).to.equal(9);
        done();
    });

    it('returns a valid member', function (done) {

        expect(Hoek.reach(obj, 'a.b.c.d')).to.equal(1);
        done();
    });

    it('returns a valid member with separator override', function (done) {

        expect(Hoek.reach(obj, 'a/b/c/d', '/')).to.equal(1);
        done();
    });

    it('returns undefined on null object', function (done) {

        expect(Hoek.reach(null, 'a.b.c.d')).to.equal(undefined);
        done();
    });

    it('returns undefined on missing object member', function (done) {

        expect(Hoek.reach(obj, 'a.b.c.d.x')).to.equal(undefined);
        done();
    });

    it('returns undefined on missing function member', function (done) {

        expect(Hoek.reach(obj, 'i.y', { functions: true })).to.equal(undefined);
        done();
    });

    it('throws on missing member in strict mode', function (done) {

        expect(function () {

            Hoek.reach(obj, 'a.b.c.o.x', { strict: true });
        }).to.throw('Missing segment o in reach path  a.b.c.o.x');

        done();
    });

    it('returns undefined on invalid member', function (done) {

        expect(Hoek.reach(obj, 'a.b.c.d-.x')).to.equal(undefined);
        done();
    });

    it('returns function member', function (done) {

        expect(typeof Hoek.reach(obj, 'i')).to.equal('function');
        done();
    });

    it('returns function property', function (done) {

        expect(Hoek.reach(obj, 'i.x')).to.equal(5);
        done();
    });

    it('returns null', function (done) {

        expect(Hoek.reach(obj, 'j')).to.equal(null);
        done();
    });

    it('throws on function property when functions not allowed', function (done) {

        expect(function () {

            Hoek.reach(obj, 'i.x', { functions: false });
        }).to.throw('Invalid segment x in reach path  i.x');

        done();
    });

    it('will return a default value if property is not found', function (done) {

        expect(Hoek.reach(obj, 'a.b.q', { default: 'defaultValue' })).to.equal('defaultValue');
        done();
    });

    it('will return a default value if path is not found', function (done) {

        expect(Hoek.reach(obj, 'q', { default: 'defaultValue' })).to.equal('defaultValue');
        done();
    });

    it('allows a falsey value to be used as the default value', function (done) {

        expect(Hoek.reach(obj, 'q', { default: '' })).to.equal('');
        done();
    });
});

describe('reachTemplate()', function () {

    it('applies object to template', function (done) {

        var obj = {
            a: {
                b: {
                    c: {
                        d: 1
                    }
                }
            },
            j: null,
            k: [4, 8, 9, 1]
        };

        var template = '{k.0}:{k.-2}:{a.b.c.d}:{x.y}:{j}';

        expect(Hoek.reachTemplate(obj, template)).to.equal('4:9:1::');
        done();
    });

    it('applies object to template (options)', function (done) {

        var obj = {
            a: {
                b: {
                    c: {
                        d: 1
                    }
                }
            },
            j: null,
            k: [4, 8, 9, 1]
        };

        var template = '{k/0}:{k/-2}:{a/b/c/d}:{x/y}:{j}';

        expect(Hoek.reachTemplate(obj, template, '/')).to.equal('4:9:1::');
        done();
    });
});

describe('callStack()', function () {

    it('returns the full call stack', function (done) {

        var stack = Hoek.callStack();
        expect(stack[0][0]).to.contain('index.js');
        expect(stack[0][2]).to.equal(26);
        done();
    });
});

describe('displayStack ()', function () {

    it('returns the full call stack for display', function (done) {

        var stack = Hoek.displayStack();
        expect(stack[0]).to.contain(Path.normalize('/test/index.js') + ':');
        done();
    });

    it('includes constructor functions correctly', function (done) {

        var Something = function (next) {

            next();
        };

        var something = new Something(function () {

            var stack = Hoek.displayStack();
            expect(stack[1]).to.contain('new Something');
            done();
        });
    });
});

describe('abort()', function () {

    it('exits process when not in test mode', function (done) {

        var env = process.env.NODE_ENV;
        var write = process.stdout.write;
        var exit = process.exit;

        process.env.NODE_ENV = 'nottatest';
        process.stdout.write = function () { };
        process.exit = function (state) {

            process.exit = exit;
            process.env.NODE_ENV = env;
            process.stdout.write = write;

            expect(state).to.equal(1);
            done();
        };

        Hoek.abort('Boom');
    });

    it('throws when not in test mode and abortThrow is true', function (done) {

        var env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'nottatest';
        Hoek.abortThrow = true;

        var fn = function () {

            Hoek.abort('my error message');
        };

        expect(fn).to.throw('my error message');
        Hoek.abortThrow = false;
        process.env.NODE_ENV = env;

        done();
    });

    it('respects hideStack argument', function (done) {

        var env = process.env.NODE_ENV;
        var write = process.stdout.write;
        var exit = process.exit;
        var output = '';

        process.exit = function () { };
        process.env.NODE_ENV = '';
        process.stdout.write = function (message) {

            output = message;
        };

        Hoek.abort('my error message', true);

        process.env.NODE_ENV = env;
        process.stdout.write = write;
        process.exit = exit;

        expect(output).to.equal('ABORT: my error message\n\t\n');

        done();
    });

    it('throws in test mode', function (done) {

        var env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';

        expect(function () {

            Hoek.abort('my error message', true);
        }).to.throw('my error message');

        process.env.NODE_ENV = env;
        done();
    });

    it('throws in test mode with default message', function (done) {

        var env = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';

        expect(function () {

            Hoek.abort('', true);
        }).to.throw('Unknown error');

        process.env.NODE_ENV = env;
        done();
    });

    it('defaults to showing stack', function (done) {

        var env = process.env.NODE_ENV;
        var write = process.stdout.write;
        var exit = process.exit;
        var output = '';

        process.exit = function () { };
        process.env.NODE_ENV = '';
        process.stdout.write = function (message) {

            output = message;
        };

        Hoek.abort('my error message');

        process.env.NODE_ENV = env;
        process.stdout.write = write;
        process.exit = exit;

        expect(output).to.contain('index.js');

        done();
    });
});

describe('assert()', function () {

    it('throws an Error when using assert in a test', function (done) {

        var fn = function () {

            Hoek.assert(false, 'my error message');
        };

        expect(fn).to.throw('my error message');
        done();
    });

    it('throws an Error when using assert in a test with no message', function (done) {

        var fn = function () {

            Hoek.assert(false);
        };

        expect(fn).to.throw('Unknown error');
        done();
    });

    it('throws an Error when using assert in a test with multipart message', function (done) {

        var fn = function () {

            Hoek.assert(false, 'This', 'is', 'my message');
        };

        expect(fn).to.throw('This is my message');
        done();
    });

    it('throws an Error when using assert in a test with multipart message (empty)', function (done) {

        var fn = function () {

            Hoek.assert(false, 'This', 'is', '', 'my message');
        };

        expect(fn).to.throw('This is my message');
        done();
    });

    it('throws an Error when using assert in a test with object message', function (done) {

        var fn = function () {

            Hoek.assert(false, 'This', 'is', { spinal: 'tap' });
        };

        expect(fn).to.throw('This is {"spinal":"tap"}');
        done();
    });

    it('throws an Error when using assert in a test with multipart string and error messages', function (done) {

        var fn = function () {

            Hoek.assert(false, 'This', 'is', new Error('spinal'), new Error('tap'));
        };

        expect(fn).to.throw('This is spinal tap');
        done();
    });

    it('throws an Error when using assert in a test with error object message', function (done) {

        var fn = function () {

            Hoek.assert(false, new Error('This is spinal tap'));
        };

        expect(fn).to.throw('This is spinal tap');
        done();
    });

    it('throws the same Error that is passed to it if there is only one error passed', function (done) {

        var error = new Error('ruh roh');
        var error2 = new Error('ruh roh');

        var fn = function () {

            Hoek.assert(false, error);
        };

        try {
            fn();
        } catch (err) {
            expect(error).to.equal(error);  // should be the same reference
            expect(error).to.not.equal(error2); // error with the same message should not match
        }

        done();
    });
});

describe('Timer', function () {

    it('returns time elapsed', function (done) {

        var timer = new Hoek.Timer();
        setTimeout(function () {

            expect(timer.elapsed()).to.be.above(9);
            done();
        }, 12);
    });
});

describe('Bench', function () {

    it('returns time elapsed', function (done) {

        var timer = new Hoek.Bench();
        setTimeout(function () {

            expect(timer.elapsed()).to.be.above(9);
            done();
        }, 12);
    });
});

describe('escapeRegex()', function () {

    it('escapes all special regular expression characters', function (done) {

        var a = Hoek.escapeRegex('4^f$s.4*5+-_?%=#!:@|~\\/`"(>)[<]d{}s,');
        expect(a).to.equal('4\\^f\\$s\\.4\\*5\\+\\-_\\?%\\=#\\!\\:@\\|~\\\\\\/`"\\(>\\)\\[<\\]d\\{\\}s\\,');
        done();
    });
});

describe('Base64Url', function () {

    var base64str = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn-AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq-wsbKztLW2t7i5uru8vb6_wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t_g4eLj5OXm5-jp6uvs7e7v8PHy8_T19vf4-fr7_P3-_w';
    var str = unescape('%00%01%02%03%04%05%06%07%08%09%0A%0B%0C%0D%0E%0F%10%11%12%13%14%15%16%17%18%19%1A%1B%1C%1D%1E%1F%20%21%22%23%24%25%26%27%28%29*+%2C-./0123456789%3A%3B%3C%3D%3E%3F@ABCDEFGHIJKLMNOPQRSTUVWXYZ%5B%5C%5D%5E_%60abcdefghijklmnopqrstuvwxyz%7B%7C%7D%7E%7F%80%81%82%83%84%85%86%87%88%89%8A%8B%8C%8D%8E%8F%90%91%92%93%94%95%96%97%98%99%9A%9B%9C%9D%9E%9F%A0%A1%A2%A3%A4%A5%A6%A7%A8%A9%AA%AB%AC%AD%AE%AF%B0%B1%B2%B3%B4%B5%B6%B7%B8%B9%BA%BB%BC%BD%BE%BF%C0%C1%C2%C3%C4%C5%C6%C7%C8%C9%CA%CB%CC%CD%CE%CF%D0%D1%D2%D3%D4%D5%D6%D7%D8%D9%DA%DB%DC%DD%DE%DF%E0%E1%E2%E3%E4%E5%E6%E7%E8%E9%EA%EB%EC%ED%EE%EF%F0%F1%F2%F3%F4%F5%F6%F7%F8%F9%FA%FB%FC%FD%FE%FF');

    describe('base64urlEncode()', function () {

        it('should base64 URL-safe a string', function (done) {

            expect(Hoek.base64urlEncode(str)).to.equal(base64str);
            done();
        });

        it('encodes a buffer', function (done) {

            expect(Hoek.base64urlEncode(new Buffer(str, 'binary'))).to.equal(base64str);
            done();
        });

        it('should base64 URL-safe a hex string', function (done) {

            var buffer = new Buffer(str, 'binary');
            expect(Hoek.base64urlEncode(buffer.toString('hex'), 'hex')).to.equal(base64str);
            done();
        });

        it('works on larger input strings', function (done) {

            var input = Fs.readFileSync(Path.join(__dirname, 'index.js')).toString();
            var encoded = Hoek.base64urlEncode(input);

            expect(encoded).to.not.contain('+');
            expect(encoded).to.not.contain('/');

            var decoded = Hoek.base64urlDecode(encoded);

            expect(decoded).to.equal(input);
            done();
        });
    });

    describe('base64urlDecode()', function () {

        it('should un-base64 URL-safe a string', function (done) {

            expect(Hoek.base64urlDecode(base64str)).to.equal(str);
            done();
        });

        it('should un-base64 URL-safe a string into hex', function (done) {

            expect(Hoek.base64urlDecode(base64str, 'hex')).to.equal(new Buffer(str, 'binary').toString('hex'));
            done();
        });

        it('should un-base64 URL-safe a string and return a buffer', function (done) {

            var buf = Hoek.base64urlDecode(base64str, 'buffer');
            expect(buf instanceof Buffer).to.equal(true);
            expect(buf.toString('binary')).to.equal(str);
            done();
        });

        it('returns error on undefined input', function (done) {

            expect(Hoek.base64urlDecode().message).to.exist();
            done();
        });

        it('returns error on invalid input', function (done) {

            expect(Hoek.base64urlDecode('*').message).to.exist();
            done();
        });
    });
});

describe('escapeHeaderAttribute()', function () {

    it('should not alter ascii values', function (done) {

        var a = Hoek.escapeHeaderAttribute('My Value');
        expect(a).to.equal('My Value');
        done();
    });

    it('escapes all special HTTP header attribute characters', function (done) {

        var a = Hoek.escapeHeaderAttribute('I said go!!!#"' + String.fromCharCode(92));
        expect(a).to.equal('I said go!!!#\\"\\\\');
        done();
    });

    it('throws on large unicode characters', function (done) {

        var fn = function () {

            Hoek.escapeHeaderAttribute('this is a test' + String.fromCharCode(500) + String.fromCharCode(300));
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('throws on CRLF to prevent response splitting', function (done) {

        var fn = function () {

            Hoek.escapeHeaderAttribute('this is a test\r\n');
        };

        expect(fn).to.throw(Error);
        done();
    });
});

describe('escapeHtml()', function () {

    it('escapes all special HTML characters', function (done) {

        var a = Hoek.escapeHtml('&<>"\'`');
        expect(a).to.equal('&amp;&lt;&gt;&quot;&#x27;&#x60;');
        done();
    });

    it('returns empty string on falsy input', function (done) {

        var a = Hoek.escapeHtml('');
        expect(a).to.equal('');
        done();
    });

    it('returns unchanged string on no reserved input', function (done) {

        var a = Hoek.escapeHtml('abc');
        expect(a).to.equal('abc');
        done();
    });
});

describe('nextTick()', function () {

    it('calls the provided callback on nextTick', function (done) {

        var a = 0;

        var inc = function (step, next) {

            a += step;
            next();
        };

        var ticked = Hoek.nextTick(inc);

        ticked(5, function () {

            expect(a).to.equal(6);
            done();
        });

        expect(a).to.equal(0);
        inc(1, function () {

            expect(a).to.equal(1);
        });
    });
});

describe('once()', function () {

    it('allows function to only execute once', function (done) {

        var gen = 0;
        var add = function (x) {

            gen += x;
        };

        add(5);
        expect(gen).to.equal(5);
        add = Hoek.once(add);
        add(5);
        expect(gen).to.equal(10);
        add(5);
        expect(gen).to.equal(10);
        done();
    });

    it('double once wraps one time', function (done) {

        var method = function () { };
        method = Hoek.once(method);
        method.x = 1;
        method = Hoek.once(method);
        expect(method.x).to.equal(1);
        done();
    });
});

describe('isAbsoltePath()', function () {

    it('identifies if path is absolute on Unix without node support', { parallel: false }, function (done) {

        var orig = Path.isAbsolute;
        Path.isAbsolute = undefined;

        expect(Hoek.isAbsolutePath('')).to.equal(false);
        expect(Hoek.isAbsolutePath('a')).to.equal(false);
        expect(Hoek.isAbsolutePath('./a')).to.equal(false);
        expect(Hoek.isAbsolutePath('/a')).to.equal(true);
        expect(Hoek.isAbsolutePath('/')).to.equal(true);

        Path.isAbsolute = orig;

        done();
    });

    it('identifies if path is absolute with fake node support', { parallel: false }, function (done) {

        var orig = Path.isAbsolute;
        Path.isAbsolute = function (path) {

            return path[0] === '/';
        };

        expect(Hoek.isAbsolutePath('', 'linux')).to.equal(false);
        expect(Hoek.isAbsolutePath('a', 'linux')).to.equal(false);
        expect(Hoek.isAbsolutePath('./a', 'linux')).to.equal(false);
        expect(Hoek.isAbsolutePath('/a', 'linux')).to.equal(true);
        expect(Hoek.isAbsolutePath('/', 'linux')).to.equal(true);

        Path.isAbsolute = orig;

        done();
    });

    it('identifies if path is absolute on Windows without node support', { parallel: false }, function (done) {

        var orig = Path.isAbsolute;
        Path.isAbsolute = undefined;

        expect(Hoek.isAbsolutePath('//server/file', 'win32')).to.equal(true);
        expect(Hoek.isAbsolutePath('//server/file', 'win32')).to.equal(true);
        expect(Hoek.isAbsolutePath('\\\\server\\file', 'win32')).to.equal(true);
        expect(Hoek.isAbsolutePath('C:/Users/', 'win32')).to.equal(true);
        expect(Hoek.isAbsolutePath('C:\\Users\\', 'win32')).to.equal(true);
        expect(Hoek.isAbsolutePath('C:cwd/another', 'win32')).to.equal(false);
        expect(Hoek.isAbsolutePath('C:cwd\\another', 'win32')).to.equal(false);
        expect(Hoek.isAbsolutePath('directory/directory', 'win32')).to.equal(false);
        expect(Hoek.isAbsolutePath('directory\\directory', 'win32')).to.equal(false);

        Path.isAbsolute = orig;

        done();
    });
});

describe('isInteger()', function () {

    it('validates integers', function (done) {

        expect(Hoek.isInteger(0)).to.equal(true);
        expect(Hoek.isInteger(1)).to.equal(true);
        expect(Hoek.isInteger(1394035612500)).to.equal(true);
        expect(Hoek.isInteger('0')).to.equal(false);
        expect(Hoek.isInteger(1.0)).to.equal(true);
        expect(Hoek.isInteger(1.1)).to.equal(false);
        done();
    });
});

describe('ignore()', function () {

    it('exists', function (done) {

        expect(Hoek.ignore).to.exist();
        expect(typeof Hoek.ignore).to.equal('function');
        done();
    });
});

describe('inherits()', function () {

    it('exists', function (done) {

        expect(Hoek.inherits).to.exist();
        expect(typeof Hoek.inherits).to.equal('function');
        done();
    });
});

describe('format()', function () {

    it('exists', function (done) {

        expect(Hoek.format).to.exist();
        expect(typeof Hoek.format).to.equal('function');
        done();
    });

    it('is a reference to Util.format', function (done) {

        expect(Hoek.format('hello %s', 'world')).to.equal('hello world');
        done();
    });
});

describe('transform()', function () {

    var source = {
        address: {
            one: '123 main street',
            two: 'PO Box 1234'
        },
        zip: {
            code: 3321232,
            province: null
        },
        title: 'Warehouse',
        state: 'CA'
    };

    it('transforms an object based on the input object', function (done) {

        var result = Hoek.transform(source, {
            'person.address.lineOne': 'address.one',
            'person.address.lineTwo': 'address.two',
            'title': 'title',
            'person.address.region': 'state',
            'person.address.zip': 'zip.code',
            'person.address.location': 'zip.province'
        });

        expect(result).to.deep.equal({
            person: {
                address: {
                    lineOne: '123 main street',
                    lineTwo: 'PO Box 1234',
                    region: 'CA',
                    zip: 3321232,
                    location: null
                }
            },
            title: 'Warehouse'
        });

        done();
    });

    it('uses the reach options passed into it', function (done) {

        var schema = {
            'person.address.lineOne': 'address-one',
            'person.address.lineTwo': 'address-two',
            'title': 'title',
            'person.address.region': 'state',
            'person.prefix': 'person-title',
            'person.zip': 'zip-code'
        };
        var options = {
            separator: '-',
            default: 'unknown'
        };
        var result = Hoek.transform(source, schema, options);

        expect(result).to.deep.equal({
            person: {
                address: {
                    lineOne: '123 main street',
                    lineTwo: 'PO Box 1234',
                    region: 'CA'
                },
                prefix: 'unknown',
                zip: 3321232
            },
            title: 'Warehouse'
        });

        done();
    });

    it('works to create shallow objects', function (done) {

        var result = Hoek.transform(source, {
            lineOne: 'address.one',
            lineTwo: 'address.two',
            title: 'title',
            region: 'state',
            province: 'zip.province'
        });

        expect(result).to.deep.equal({
            lineOne: '123 main street',
            lineTwo: 'PO Box 1234',
            title: 'Warehouse',
            region: 'CA',
            province: null
        });

        done();
    });

    it('only allows strings in the map', function (done) {

        expect(function () {

            var result = Hoek.transform(source, {
                lineOne: {}
            });
        }).to.throw('All mappings must be "." delineated strings');

        done();
    });

    it('throws an error on invalid arguments', function (done) {

        expect(function () {

            var result = Hoek.transform(NaN, {});
        }).to.throw('Invalid source object: must be null, undefined, or an object');

        done();
    });

    it('is safe to pass null', function (done) {

        var result = Hoek.transform(null, {});
        expect(result).to.deep.equal({});

        done();
    });

    it('is safe to pass undefined', function (done) {

        var result = Hoek.transform(undefined, {});
        expect(result).to.deep.equal({});

        done();
    });
});

describe('uniqueFilename()', function () {

    it('generates a random file path', function (done) {

        var result = Hoek.uniqueFilename('./test/modules');

        expect(result).to.exist();
        expect(result).to.be.a.string();
        expect(result).to.contain('test/modules');
        done();
    });

    it('is random enough to use in fast loops', function (done) {

        var results = [];

        for (var i = 0; i < 10; ++i) {
            results[i] = Hoek.uniqueFilename('./test/modules');
        }

        var filter = results.filter(function (item, index, array) {

            return array.indexOf(item) === index;
        });

        expect(filter.length).to.equal(10);
        expect(results.length).to.equal(10);
        done();

    });

    it('combines the random elements with a supplied character', function (done) {

        var result = Hoek.uniqueFilename('./test', 'txt');

        expect(result).to.contain('test/');
        expect(result).to.contain('.txt');

        done();
    });

    it('accepts extensions with a "." in it', function (done) {

        var result = Hoek.uniqueFilename('./test', '.mp3');

        expect(result).to.contain('test/');
        expect(result).to.contain('.mp3');

        done();
    });
});

describe('stringify()', function (done) {

    it('converts object to string', function (done) {

        var obj = { a: 1 };
        expect(Hoek.stringify(obj)).to.equal('{"a":1}');
        done();
    });

    it('returns error in result string', function (done) {

        var obj = { a: 1 };
        obj.b = obj;
        expect(Hoek.stringify(obj)).to.equal('[Cannot display object: Converting circular structure to JSON]');
        done();
    });
});

describe('shallow()', function (done) {

    it('shallow copies an object', function (done) {

        var obj = {
            a: 5,
            b: {
                c: 6
            }
        };

        var shallow = Hoek.shallow(obj);
        expect(shallow).to.not.equal(obj);
        expect(shallow).to.deep.equal(obj);
        expect(shallow.b).to.equal(obj.b);
        done();
    });
});

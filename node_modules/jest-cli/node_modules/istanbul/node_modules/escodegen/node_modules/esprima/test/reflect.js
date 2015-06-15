// This is modified from Mozilla Reflect.parse test suite (the file is located
// at js/src/tests/js1_8_5/extensions/reflect-parse.js in the source tree).
//
// Some notable changes:
//   * Removed unsupported features (destructuring, let, comprehensions...).
//   * Removed tests for E4X (ECMAScript for XML).
//   * Removed everything related to builder.
//   * Enclosed every 'Pattern' construct with a scope.
//   * Tweaked some expected tree to remove generator field.
//   * Removed the test for bug 632030 and bug 632024.

/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
/*
 * Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/licenses/publicdomain/
 */

(function (exports) {

function testReflect(Reflect, Pattern) {

function program(elts) { return Pattern({ type: "Program", body: elts }) }
function exprStmt(expr) { return Pattern({ type: "ExpressionStatement", expression: expr }) }
function throwStmt(expr) { return Pattern({ type: "ThrowStatement", argument: expr }) }
function returnStmt(expr) { return Pattern({ type: "ReturnStatement", argument: expr }) }
function yieldExpr(expr) { return Pattern({ type: "YieldExpression", argument: expr }) }
function lit(val) { return Pattern({ type: "Literal", value: val }) }
var thisExpr = Pattern({ type: "ThisExpression" });
function funDecl(id, params, body) { return Pattern({ type: "FunctionDeclaration",
                                             id: id,
                                             params: params,
                                             defaults: [],
                                             body: body,
                                             rest: null,
                                             generator: false,
                                             expression: false
                                             }) }
function genFunDecl(id, params, body) { return Pattern({ type: "FunctionDeclaration",
                                                id: id,
                                                params: params,
                                                defaults: [],
                                                body: body,
                                                rest: null,
                                                generator: false,
                                                expression: false
                                                }) }
function declarator(id, init) { return Pattern({ type: "VariableDeclarator", id: id, init: init }) }
function varDecl(decls) { return Pattern({ type: "VariableDeclaration", declarations: decls, kind: "var" }) }
function letDecl(decls) { return Pattern({ type: "VariableDeclaration", declarations: decls, kind: "let" }) }
function constDecl(decls) { return Pattern({ type: "VariableDeclaration", declarations: decls, kind: "const" }) }
function ident(name) { return Pattern({ type: "Identifier", name: name }) }
function dotExpr(obj, id) { return Pattern({ type: "MemberExpression", computed: false, object: obj, property: id }) }
function memExpr(obj, id) { return Pattern({ type: "MemberExpression", computed: true, object: obj, property: id }) }
function forStmt(init, test, update, body) { return Pattern({ type: "ForStatement", init: init, test: test, update: update, body: body }) }
function forInStmt(lhs, rhs, body) { return Pattern({ type: "ForInStatement", left: lhs, right: rhs, body: body, each: false }) }
function forEachInStmt(lhs, rhs, body) { return Pattern({ type: "ForInStatement", left: lhs, right: rhs, body: body, each: true }) }
function breakStmt(lab) { return Pattern({ type: "BreakStatement", label: lab }) }
function continueStmt(lab) { return Pattern({ type: "ContinueStatement", label: lab }) }
function blockStmt(body) { return Pattern({ type: "BlockStatement", body: body }) }
var emptyStmt = Pattern({ type: "EmptyStatement" });
function ifStmt(test, cons, alt) { return Pattern({ type: "IfStatement", test: test, alternate: alt, consequent: cons }) }
function labStmt(lab, stmt) { return Pattern({ type: "LabeledStatement", label: lab, body: stmt }) }
function withStmt(obj, stmt) { return Pattern({ type: "WithStatement", object: obj, body: stmt }) }
function whileStmt(test, stmt) { return Pattern({ type: "WhileStatement", test: test, body: stmt }) }
function doStmt(stmt, test) { return Pattern({ type: "DoWhileStatement", test: test, body: stmt }) }
function switchStmt(disc, cases) { return Pattern({ type: "SwitchStatement", discriminant: disc, cases: cases }) }
function caseClause(test, stmts) { return Pattern({ type: "SwitchCase", test: test, consequent: stmts }) }
function defaultClause(stmts) { return Pattern({ type: "SwitchCase", test: null, consequent: stmts }) }
function catchClause(id, guard, body) { if (guard) { return Pattern({ type: "GuardedCatchClause", param: id, guard: guard, body: body }) } else { return Pattern({ type: "CatchClause", param: id, body: body }) } }
function tryStmt(body, guarded, catches, fin) { return Pattern({ type: "TryStatement", block: body, guardedHandlers: guarded, handlers: catches, finalizer: fin }) }
function letStmt(head, body) { return Pattern({ type: "LetStatement", head: head, body: body }) }
function funExpr(id, args, body, gen) { return Pattern({ type: "FunctionExpression",
                                                id: id,
                                                params: args,
                                                defaults: [],
                                                body: body,
                                                rest: null,
                                                generator: false,
                                                expression: false
                                                }) }
function genFunExpr(id, args, body) { return Pattern({ type: "FunctionExpression",
                                              id: id,
                                              params: args,
                                              defaults: [],
                                              body: body,
                                              rest: null,
                                              generator: false,
                                              expression: false
                                              }) }

function unExpr(op, arg) { return Pattern({ type: "UnaryExpression", operator: op, argument: arg, prefix: true }) }
function binExpr(op, left, right) { return Pattern({ type: "BinaryExpression", operator: op, left: left, right: right }) }
function aExpr(op, left, right) { return Pattern({ type: "AssignmentExpression", operator: op, left: left, right: right }) }
function updExpr(op, arg, prefix) { return Pattern({ type: "UpdateExpression", operator: op, argument: arg, prefix: prefix }) }
function logExpr(op, left, right) { return Pattern({ type: "LogicalExpression", operator: op, left: left, right: right }) }

function condExpr(test, cons, alt) { return Pattern({ type: "ConditionalExpression", test: test, consequent: cons, alternate: alt }) }
function seqExpr(exprs) { return Pattern({ type: "SequenceExpression", expressions: exprs }) }
function newExpr(callee, args) { return Pattern({ type: "NewExpression", callee: callee, arguments: args }) }
function callExpr(callee, args) { return Pattern({ type: "CallExpression", callee: callee, arguments: args }) }
function arrExpr(elts) { return Pattern({ type: "ArrayExpression", elements: elts }) }
function objExpr(elts) { return Pattern({ type: "ObjectExpression", properties: elts }) }
function objProp(key, value, kind) { return Pattern({ type: "Property", key: key, value: value, kind: kind }) }

function arrPatt(elts) { return Pattern({ type: "ArrayPattern", elements: elts }) }
function objPatt(elts) { return Pattern({ type: "ObjectPattern", properties: elts }) }

function localSrc(src) { return "(function(){ " + src + " })" }
function localPatt(patt) { return program([exprStmt(funExpr(null, [], blockStmt([patt])))]) }
function blockSrc(src) { return "(function(){ { " + src + " } })" }
function blockPatt(patt) { return program([exprStmt(funExpr(null, [], blockStmt([blockStmt([patt])])))]) }

function assertBlockStmt(src, patt) {
    blockPatt(patt).assert(Reflect.parse(blockSrc(src)));
}

function assertBlockExpr(src, patt) {
    assertBlockStmt(src, exprStmt(patt));
}

function assertBlockDecl(src, patt, builder) {
    blockPatt(patt).assert(Reflect.parse(blockSrc(src), {builder: builder}));
}

function assertLocalStmt(src, patt) {
    localPatt(patt).assert(Reflect.parse(localSrc(src)));
}

function assertLocalExpr(src, patt) {
    assertLocalStmt(src, exprStmt(patt));
}

function assertLocalDecl(src, patt) {
    localPatt(patt).assert(Reflect.parse(localSrc(src)));
}

function assertGlobalStmt(src, patt, builder) {
    program([patt]).assert(Reflect.parse(src, {builder: builder}));
}

function assertGlobalExpr(src, patt, builder) {
    program([exprStmt(patt)]).assert(Reflect.parse(src, {builder: builder}));
    //assertStmt(src, exprStmt(patt));
}

function assertGlobalDecl(src, patt) {
    program([patt]).assert(Reflect.parse(src));
}

function assertProg(src, patt) {
    program(patt).assert(Reflect.parse(src));
}

function assertStmt(src, patt) {
    assertLocalStmt(src, patt);
    assertGlobalStmt(src, patt);
    assertBlockStmt(src, patt);
}

function assertExpr(src, patt) {
    assertLocalExpr(src, patt);
    assertGlobalExpr(src, patt);
    assertBlockExpr(src, patt);
}

function assertDecl(src, patt) {
    assertLocalDecl(src, patt);
    assertGlobalDecl(src, patt);
    assertBlockDecl(src, patt);
}

function assertError(src, errorType) {
    try {
        Reflect.parse(src);
    } catch (e) {
        return;
    }
    throw new Error("expected " + errorType.name + " for " + uneval(src));
}


// general tests

// NB: These are useful but for now jit-test doesn't do I/O reliably.

//program(_).assert(Reflect.parse(snarf('data/flapjax.txt')));
//program(_).assert(Reflect.parse(snarf('data/jquery-1.4.2.txt')));
//program(_).assert(Reflect.parse(snarf('data/prototype.js')));
//program(_).assert(Reflect.parse(snarf('data/dojo.js.uncompressed.js')));
//program(_).assert(Reflect.parse(snarf('data/mootools-1.2.4-core-nc.js')));


// declarations

assertDecl("var x = 1, y = 2, z = 3",
           varDecl([declarator(ident("x"), lit(1)),
                    declarator(ident("y"), lit(2)),
                    declarator(ident("z"), lit(3))]));
assertDecl("var x, y, z",
           varDecl([declarator(ident("x"), null),
                    declarator(ident("y"), null),
                    declarator(ident("z"), null)]));
assertDecl("function foo() { }",
           funDecl(ident("foo"), [], blockStmt([])));
assertDecl("function foo() { return 42 }",
           funDecl(ident("foo"), [], blockStmt([returnStmt(lit(42))])));


// Bug 591437: rebound args have their defs turned into uses
assertDecl("function f(a) { function a() { } }",
           funDecl(ident("f"), [ident("a")], blockStmt([funDecl(ident("a"), [], blockStmt([]))])));
assertDecl("function f(a,b,c) { function b() { } }",
           funDecl(ident("f"), [ident("a"),ident("b"),ident("c")], blockStmt([funDecl(ident("b"), [], blockStmt([]))])));

// expressions

assertExpr("true", lit(true));
assertExpr("false", lit(false));
assertExpr("42", lit(42));
assertExpr("(/asdf/)", lit(/asdf/));
assertExpr("this", thisExpr);
assertExpr("foo", ident("foo"));
assertExpr("foo.bar", dotExpr(ident("foo"), ident("bar")));
assertExpr("foo[bar]", memExpr(ident("foo"), ident("bar")));
assertExpr("(function(){})", funExpr(null, [], blockStmt([])));
assertExpr("(function f() {})", funExpr(ident("f"), [], blockStmt([])));
assertExpr("(function f(x,y,z) {})", funExpr(ident("f"), [ident("x"),ident("y"),ident("z")], blockStmt([])));
assertExpr("(++x)", updExpr("++", ident("x"), true));
assertExpr("(x++)", updExpr("++", ident("x"), false));
assertExpr("(+x)", unExpr("+", ident("x")));
assertExpr("(-x)", unExpr("-", ident("x")));
assertExpr("(!x)", unExpr("!", ident("x")));
assertExpr("(~x)", unExpr("~", ident("x")));
assertExpr("(delete x)", unExpr("delete", ident("x")));
assertExpr("(typeof x)", unExpr("typeof", ident("x")));
assertExpr("(void x)", unExpr("void", ident("x")));
assertExpr("(x == y)", binExpr("==", ident("x"), ident("y")));
assertExpr("(x != y)", binExpr("!=", ident("x"), ident("y")));
assertExpr("(x === y)", binExpr("===", ident("x"), ident("y")));
assertExpr("(x !== y)", binExpr("!==", ident("x"), ident("y")));
assertExpr("(x < y)", binExpr("<", ident("x"), ident("y")));
assertExpr("(x <= y)", binExpr("<=", ident("x"), ident("y")));
assertExpr("(x > y)", binExpr(">", ident("x"), ident("y")));
assertExpr("(x >= y)", binExpr(">=", ident("x"), ident("y")));
assertExpr("(x << y)", binExpr("<<", ident("x"), ident("y")));
assertExpr("(x >> y)", binExpr(">>", ident("x"), ident("y")));
assertExpr("(x >>> y)", binExpr(">>>", ident("x"), ident("y")));
assertExpr("(x + y)", binExpr("+", ident("x"), ident("y")));
assertExpr("(w + x + y + z)", binExpr("+", binExpr("+", binExpr("+", ident("w"), ident("x")), ident("y")), ident("z")));
assertExpr("(x - y)", binExpr("-", ident("x"), ident("y")));
assertExpr("(w - x - y - z)", binExpr("-", binExpr("-", binExpr("-", ident("w"), ident("x")), ident("y")), ident("z")));
assertExpr("(x * y)", binExpr("*", ident("x"), ident("y")));
assertExpr("(x / y)", binExpr("/", ident("x"), ident("y")));
assertExpr("(x % y)", binExpr("%", ident("x"), ident("y")));
assertExpr("(x | y)", binExpr("|", ident("x"), ident("y")));
assertExpr("(x ^ y)", binExpr("^", ident("x"), ident("y")));
assertExpr("(x & y)", binExpr("&", ident("x"), ident("y")));
assertExpr("(x in y)", binExpr("in", ident("x"), ident("y")));
assertExpr("(x instanceof y)", binExpr("instanceof", ident("x"), ident("y")));
assertExpr("(x = y)", aExpr("=", ident("x"), ident("y")));
assertExpr("(x += y)", aExpr("+=", ident("x"), ident("y")));
assertExpr("(x -= y)", aExpr("-=", ident("x"), ident("y")));
assertExpr("(x *= y)", aExpr("*=", ident("x"), ident("y")));
assertExpr("(x /= y)", aExpr("/=", ident("x"), ident("y")));
assertExpr("(x %= y)", aExpr("%=", ident("x"), ident("y")));
assertExpr("(x <<= y)", aExpr("<<=", ident("x"), ident("y")));
assertExpr("(x >>= y)", aExpr(">>=", ident("x"), ident("y")));
assertExpr("(x >>>= y)", aExpr(">>>=", ident("x"), ident("y")));
assertExpr("(x |= y)", aExpr("|=", ident("x"), ident("y")));
assertExpr("(x ^= y)", aExpr("^=", ident("x"), ident("y")));
assertExpr("(x &= y)", aExpr("&=", ident("x"), ident("y")));
assertExpr("(x || y)", logExpr("||", ident("x"), ident("y")));
assertExpr("(x && y)", logExpr("&&", ident("x"), ident("y")));
assertExpr("(w || x || y || z)", logExpr("||", logExpr("||", logExpr("||", ident("w"), ident("x")), ident("y")), ident("z")))
assertExpr("(x ? y : z)", condExpr(ident("x"), ident("y"), ident("z")));
assertExpr("(x,y)", seqExpr([ident("x"),ident("y")]))
assertExpr("(x,y,z)", seqExpr([ident("x"),ident("y"),ident("z")]))
assertExpr("(a,b,c,d,e,f,g)", seqExpr([ident("a"),ident("b"),ident("c"),ident("d"),ident("e"),ident("f"),ident("g")]));
assertExpr("(new Object)", newExpr(ident("Object"), []));
assertExpr("(new Object())", newExpr(ident("Object"), []));
assertExpr("(new Object(42))", newExpr(ident("Object"), [lit(42)]));
assertExpr("(new Object(1,2,3))", newExpr(ident("Object"), [lit(1),lit(2),lit(3)]));
assertExpr("(String())", callExpr(ident("String"), []));
assertExpr("(String(42))", callExpr(ident("String"), [lit(42)]));
assertExpr("(String(1,2,3))", callExpr(ident("String"), [lit(1),lit(2),lit(3)]));
assertExpr("[]", arrExpr([]));
assertExpr("[1]", arrExpr([lit(1)]));
assertExpr("[1,2]", arrExpr([lit(1),lit(2)]));
assertExpr("[1,2,3]", arrExpr([lit(1),lit(2),lit(3)]));
assertExpr("[1,,2,3]", arrExpr([lit(1),,lit(2),lit(3)]));
assertExpr("[1,,,2,3]", arrExpr([lit(1),,,lit(2),lit(3)]));
assertExpr("[1,,,2,,3]", arrExpr([lit(1),,,lit(2),,lit(3)]));
assertExpr("[1,,,2,,,3]", arrExpr([lit(1),,,lit(2),,,lit(3)]));
assertExpr("[,1,2,3]", arrExpr([,lit(1),lit(2),lit(3)]));
assertExpr("[,,1,2,3]", arrExpr([,,lit(1),lit(2),lit(3)]));
assertExpr("[,,,1,2,3]", arrExpr([,,,lit(1),lit(2),lit(3)]));
assertExpr("[,,,1,2,3,]", arrExpr([,,,lit(1),lit(2),lit(3)]));
assertExpr("[,,,1,2,3,,]", arrExpr([,,,lit(1),lit(2),lit(3),undefined]));
assertExpr("[,,,1,2,3,,,]", arrExpr([,,,lit(1),lit(2),lit(3),undefined,undefined]));
assertExpr("[,,,,,]", arrExpr([undefined,undefined,undefined,undefined,undefined]));
assertExpr("({})", objExpr([]));
assertExpr("({x:1})", objExpr([objProp(ident("x"), lit(1), "init")]));
assertExpr("({x:1, y:2})", objExpr([objProp(ident("x"), lit(1), "init"),
                                    objProp(ident("y"), lit(2), "init")]));
assertExpr("({x:1, y:2, z:3})", objExpr([objProp(ident("x"), lit(1), "init"),
                                         objProp(ident("y"), lit(2), "init"),
                                         objProp(ident("z"), lit(3), "init") ]));
assertExpr("({x:1, 'y':2, z:3})", objExpr([objProp(ident("x"), lit(1), "init"),
                                           objProp(lit("y"), lit(2), "init"),
                                           objProp(ident("z"), lit(3), "init") ]));
assertExpr("({'x':1, 'y':2, z:3})", objExpr([objProp(lit("x"), lit(1), "init"),
                                             objProp(lit("y"), lit(2), "init"),
                                             objProp(ident("z"), lit(3), "init") ]));
assertExpr("({'x':1, 'y':2, 3:3})", objExpr([objProp(lit("x"), lit(1), "init"),
                                             objProp(lit("y"), lit(2), "init"),
                                             objProp(lit(3), lit(3), "init") ]));

// Bug 571617: eliminate constant-folding
assertExpr("2 + 3", binExpr("+", lit(2), lit(3)));

// Bug 632026: constant-folding
assertExpr("typeof(0?0:a)", unExpr("typeof", condExpr(lit(0), lit(0), ident("a"))));

// Bug 632056: constant-folding
program([exprStmt(ident("f")),
         ifStmt(lit(1),
                funDecl(ident("f"), [], blockStmt([])),
                null)]).assert(Reflect.parse("f; if (1) function f(){}"));

// statements

assertStmt("throw 42", throwStmt(lit(42)));
assertStmt("for (;;) break", forStmt(null, null, null, breakStmt(null)));
assertStmt("for (x; y; z) break", forStmt(ident("x"), ident("y"), ident("z"), breakStmt(null)));
assertStmt("for (var x; y; z) break", forStmt(varDecl([declarator(ident("x"), null)]), ident("y"), ident("z"), breakStmt(null)));
assertStmt("for (var x = 42; y; z) break", forStmt(varDecl([declarator(ident("x"), lit(42))]), ident("y"), ident("z"), breakStmt(null)));
assertStmt("for (x; ; z) break", forStmt(ident("x"), null, ident("z"), breakStmt(null)));
assertStmt("for (var x; ; z) break", forStmt(varDecl([declarator(ident("x"), null)]), null, ident("z"), breakStmt(null)));
assertStmt("for (var x = 42; ; z) break", forStmt(varDecl([declarator(ident("x"), lit(42))]), null, ident("z"), breakStmt(null)));
assertStmt("for (x; y; ) break", forStmt(ident("x"), ident("y"), null, breakStmt(null)));
assertStmt("for (var x; y; ) break", forStmt(varDecl([declarator(ident("x"), null)]), ident("y"), null, breakStmt(null)));
assertStmt("for (var x = 42; y; ) break", forStmt(varDecl([declarator(ident("x"),lit(42))]), ident("y"), null, breakStmt(null)));
assertStmt("for (var x in y) break", forInStmt(varDecl([declarator(ident("x"),null)]), ident("y"), breakStmt(null)));
assertStmt("for (x in y) break", forInStmt(ident("x"), ident("y"), breakStmt(null)));
assertStmt("{ }", blockStmt([]));
assertStmt("{ throw 1; throw 2; throw 3; }", blockStmt([ throwStmt(lit(1)), throwStmt(lit(2)), throwStmt(lit(3))]));
assertStmt(";", emptyStmt);
assertStmt("if (foo) throw 42;", ifStmt(ident("foo"), throwStmt(lit(42)), null));
assertStmt("if (foo) throw 42; else true;", ifStmt(ident("foo"), throwStmt(lit(42)), exprStmt(lit(true))));
assertStmt("if (foo) { throw 1; throw 2; throw 3; }",
           ifStmt(ident("foo"),
                  blockStmt([throwStmt(lit(1)), throwStmt(lit(2)), throwStmt(lit(3))]),
                  null));
assertStmt("if (foo) { throw 1; throw 2; throw 3; } else true;",
           ifStmt(ident("foo"),
                  blockStmt([throwStmt(lit(1)), throwStmt(lit(2)), throwStmt(lit(3))]),
                  exprStmt(lit(true))));
assertStmt("foo: for(;;) break foo;", labStmt(ident("foo"), forStmt(null, null, null, breakStmt(ident("foo")))));
assertStmt("foo: for(;;) continue foo;", labStmt(ident("foo"), forStmt(null, null, null, continueStmt(ident("foo")))));
assertStmt("with (obj) { }", withStmt(ident("obj"), blockStmt([])));
assertStmt("with (obj) { obj; }", withStmt(ident("obj"), blockStmt([exprStmt(ident("obj"))])));
assertStmt("while (foo) { }", whileStmt(ident("foo"), blockStmt([])));
assertStmt("while (foo) { foo; }", whileStmt(ident("foo"), blockStmt([exprStmt(ident("foo"))])));
assertStmt("do { } while (foo);", doStmt(blockStmt([]), ident("foo")));
assertStmt("do { foo; } while (foo)", doStmt(blockStmt([exprStmt(ident("foo"))]), ident("foo")));
assertStmt("switch (foo) { case 1: 1; break; case 2: 2; break; default: 3; }",
           switchStmt(ident("foo"),
                      [ caseClause(lit(1), [ exprStmt(lit(1)), breakStmt(null) ]),
                        caseClause(lit(2), [ exprStmt(lit(2)), breakStmt(null) ]),
                        defaultClause([ exprStmt(lit(3)) ]) ]));
assertStmt("switch (foo) { case 1: 1; break; case 2: 2; break; default: 3; case 42: 42; }",
           switchStmt(ident("foo"),
                      [ caseClause(lit(1), [ exprStmt(lit(1)), breakStmt(null) ]),
                        caseClause(lit(2), [ exprStmt(lit(2)), breakStmt(null) ]),
                        defaultClause([ exprStmt(lit(3)) ]),
                        caseClause(lit(42), [ exprStmt(lit(42)) ]) ]));
assertStmt("try { } catch (e) { }",
           tryStmt(blockStmt([]),
                   [],
                   [ catchClause(ident("e"), null, blockStmt([])) ],
                   null));
assertStmt("try { } catch (e) { } finally { }",
           tryStmt(blockStmt([]),
                   [],
                   [ catchClause(ident("e"), null, blockStmt([])) ],
                   blockStmt([])));
assertStmt("try { } finally { }",
           tryStmt(blockStmt([]),
                   [],
                   [],
                   blockStmt([])));

// redeclarations (TOK_NAME nodes with lexdef)

assertStmt("function f() { function g() { } function g() { } }",
           funDecl(ident("f"), [], blockStmt([funDecl(ident("g"), [], blockStmt([])),
                                              funDecl(ident("g"), [], blockStmt([]))])));

assertStmt("function f() { function g() { } function g() { return 42 } }",
           funDecl(ident("f"), [], blockStmt([funDecl(ident("g"), [], blockStmt([])),
                                              funDecl(ident("g"), [], blockStmt([returnStmt(lit(42))]))])));

assertStmt("function f() { var x = 42; var x = 43; }",
           funDecl(ident("f"), [], blockStmt([varDecl([declarator(ident("x"),lit(42))]),
                                              varDecl([declarator(ident("x"),lit(43))])])));

// getters and setters

 assertExpr("({ get x() { return 42 } })",
            objExpr([ objProp(ident("x"),
                              funExpr(null, [], blockStmt([returnStmt(lit(42))])),
                              "get" ) ]));
 assertExpr("({ set x(v) { return 42 } })",
            objExpr([ objProp(ident("x"),
                              funExpr(null, [ident("v")], blockStmt([returnStmt(lit(42))])),
                              "set" ) ]));

}

exports.testReflect = testReflect;

}(typeof exports === 'undefined' ? this : exports));

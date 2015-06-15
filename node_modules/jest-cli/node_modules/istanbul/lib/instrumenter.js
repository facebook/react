/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global esprima, escodegen, window */
(function (isNode) {
    "use strict";
    var SYNTAX,
        nodeType,
        ESP = isNode ? require('esprima') : esprima,
        ESPGEN = isNode ? require('escodegen') : escodegen,  //TODO - package as dependency
        crypto = isNode ? require('crypto') : null,
        LEADER_WRAP = '(function () { ',
        TRAILER_WRAP = '\n}());',
        COMMENT_RE = /^\s*istanbul\s+ignore\s+(if|else|next)(?=\W|$)/,
        astgen,
        preconditions,
        cond,
        isArray = Array.isArray;

    /* istanbul ignore if: untestable */
    if (!isArray) {
        isArray = function (thing) { return thing &&  Object.prototype.toString.call(thing) === '[object Array]'; };
    }

    if (!isNode) {
        preconditions = {
            'Could not find esprima': ESP,
            'Could not find escodegen': ESPGEN,
            'JSON object not in scope': JSON,
            'Array does not implement push': [].push,
            'Array does not implement unshift': [].unshift
        };
        /* istanbul ignore next: untestable */
        for (cond in preconditions) {
            if (preconditions.hasOwnProperty(cond)) {
                if (!preconditions[cond]) { throw new Error(cond); }
            }
        }
    }

    function generateTrackerVar(filename, omitSuffix) {
        var hash, suffix;
        if (crypto !== null) {
            hash = crypto.createHash('md5');
            hash.update(filename);
            suffix = hash.digest('base64');
            //trim trailing equal signs, turn identifier unsafe chars to safe ones + => _ and / => $
            suffix = suffix.replace(new RegExp('=', 'g'), '')
                .replace(new RegExp('\\+', 'g'), '_')
                .replace(new RegExp('/', 'g'), '$');
        } else {
            window.__cov_seq = window.__cov_seq || 0;
            window.__cov_seq += 1;
            suffix = window.__cov_seq;
        }
        return '__cov_' + (omitSuffix ? '' : suffix);
    }

    function pushAll(ary, thing) {
        if (!isArray(thing)) {
            thing = [ thing ];
        }
        Array.prototype.push.apply(ary, thing);
    }

    SYNTAX = {
        // keep in sync with estraverse's VisitorKeys
        AssignmentExpression: ['left', 'right'],
        AssignmentPattern: ['left', 'right'],
        ArrayExpression: ['elements'],
        ArrayPattern: ['elements'],
        ArrowFunctionExpression: ['params', 'body'],
        AwaitExpression: ['argument'], // CAUTION: It's deferred to ES7.
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ClassBody: ['body'],
        ClassDeclaration: ['id', 'superClass', 'body'],
        ClassExpression: ['id', 'superClass', 'body'],
        ComprehensionBlock: ['left', 'right'],  // CAUTION: It's deferred to ES7.
        ComprehensionExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DebuggerStatement: [],
        DirectiveStatement: [],
        DoWhileStatement: ['body', 'test'],
        EmptyStatement: [],
        ExportAllDeclaration: ['source'],
        ExportDefaultDeclaration: ['declaration'],
        ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
        ExportSpecifier: ['exported', 'local'],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        ForOfStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        GeneratorExpression: ['blocks', 'filter', 'body'],  // CAUTION: It's deferred to ES7.
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        ImportDeclaration: ['specifiers', 'source'],
        ImportDefaultSpecifier: ['local'],
        ImportNamespaceSpecifier: ['local'],
        ImportSpecifier: ['imported', 'local'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        MethodDefinition: ['key', 'value'],
        ModuleSpecifier: [],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        ObjectPattern: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        RestElement: [ 'argument' ],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SpreadElement: ['argument'],
        SuperExpression: ['super'],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        TaggedTemplateExpression: ['tag', 'quasi'],
        TemplateElement: [],
        TemplateLiteral: ['quasis', 'expressions'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handler', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body'],
        YieldExpression: ['argument']
    };

    for (nodeType in SYNTAX) {
        /* istanbul ignore else: has own property */
        if (SYNTAX.hasOwnProperty(nodeType)) {
            SYNTAX[nodeType] = { name: nodeType, children: SYNTAX[nodeType] };
        }
    }

    astgen = {
        variable: function (name) { return { type: SYNTAX.Identifier.name, name: name }; },
        stringLiteral: function (str) { return { type: SYNTAX.Literal.name, value: String(str) }; },
        numericLiteral: function (num) { return { type: SYNTAX.Literal.name, value: Number(num) }; },
        statement: function (contents) { return { type: SYNTAX.ExpressionStatement.name, expression: contents }; },
        dot: function (obj, field) { return { type: SYNTAX.MemberExpression.name, computed: false, object: obj, property: field }; },
        subscript: function (obj, sub) { return { type: SYNTAX.MemberExpression.name, computed: true, object: obj, property: sub }; },
        postIncrement: function (obj) { return { type: SYNTAX.UpdateExpression.name, operator: '++', prefix: false, argument: obj }; },
        sequence: function (one, two) { return { type: SYNTAX.SequenceExpression.name, expressions: [one, two] }; },
        returnStatement: function (expr) { return { type: SYNTAX.ReturnStatement.name, argument: expr }; }
    };

    function Walker(walkMap, preprocessor, scope, debug) {
        this.walkMap = walkMap;
        this.preprocessor = preprocessor;
        this.scope = scope;
        this.debug = debug;
        if (this.debug) {
            this.level = 0;
            this.seq = true;
        }
    }

    function defaultWalker(node, walker) {

        var type = node.type,
            preprocessor,
            postprocessor,
            children = SYNTAX[type],
            // don't run generated nodes thru custom walks otherwise we will attempt to instrument the instrumentation code :)
            applyCustomWalker = !!node.loc || node.type === SYNTAX.Program.name,
            walkerFn = applyCustomWalker ? walker.walkMap[type] : null,
            i,
            j,
            walkFnIndex,
            childType,
            childNode,
            ret,
            childArray,
            childElement,
            pathElement,
            assignNode,
            isLast;

        if (!SYNTAX[type]) {
            console.error(node);
            console.error('Unsupported node type:' + type);
            return;
        }
        children = SYNTAX[type].children;
        /* istanbul ignore if: guard */
        if (node.walking) { throw new Error('Infinite regress: Custom walkers may NOT call walker.apply(node)'); }
        node.walking = true;

        ret = walker.apply(node, walker.preprocessor);

        preprocessor = ret.preprocessor;
        if (preprocessor) {
            delete ret.preprocessor;
            ret = walker.apply(node, preprocessor);
        }

        if (isArray(walkerFn)) {
            for (walkFnIndex = 0; walkFnIndex < walkerFn.length; walkFnIndex += 1) {
                isLast = walkFnIndex === walkerFn.length - 1;
                ret = walker.apply(ret, walkerFn[walkFnIndex]);
                /*istanbul ignore next: paranoid check */
                if (ret.type !== type && !isLast) {
                    throw new Error('Only the last walker is allowed to change the node type: [type was: ' + type + ' ]');
                }
            }
        } else {
            if (walkerFn) {
                ret = walker.apply(node, walkerFn);
            }
        }

        for (i = 0; i < children.length; i += 1) {
            childType = children[i];
            childNode = node[childType];
            if (childNode && !childNode.skipWalk) {
                pathElement = { node: node, property: childType };
                if (isArray(childNode)) {
                    childArray = [];
                    for (j = 0; j < childNode.length; j += 1) {
                        childElement = childNode[j];
                        pathElement.index = j;
                        if (childElement) {
                          assignNode = walker.apply(childElement, null, pathElement);
                          if (isArray(assignNode.prepend)) {
                              pushAll(childArray, assignNode.prepend);
                              delete assignNode.prepend;
                          }
                        }
                        pushAll(childArray, assignNode);
                    }
                    node[childType] = childArray;
                } else {
                    assignNode = walker.apply(childNode, null, pathElement);
                    /*istanbul ignore if: paranoid check */
                    if (isArray(assignNode.prepend)) {
                        throw new Error('Internal error: attempt to prepend statements in disallowed (non-array) context');
                        /* if this should be allowed, this is how to solve it
                        tmpNode = { type: 'BlockStatement', body: [] };
                        pushAll(tmpNode.body, assignNode.prepend);
                        pushAll(tmpNode.body, assignNode);
                        node[childType] = tmpNode;
                        delete assignNode.prepend;
                        */
                    } else {
                        node[childType] = assignNode;
                    }
                }
            }
        }

        postprocessor = ret.postprocessor;
        if (postprocessor) {
            delete ret.postprocessor;
            ret = walker.apply(ret, postprocessor);
        }

        delete node.walking;

        return ret;
    }

    Walker.prototype = {
        startWalk: function (node) {
            this.path = [];
            this.apply(node);
        },

        apply: function (node, walkFn, pathElement) {
            var ret, i, seq, prefix;

            walkFn = walkFn || defaultWalker;
            if (this.debug) {
                this.seq += 1;
                this.level += 1;
                seq = this.seq;
                prefix = '';
                for (i = 0; i < this.level; i += 1) { prefix += '    '; }
                console.log(prefix + 'Enter (' + seq + '):' + node.type);
            }
            if (pathElement) { this.path.push(pathElement); }
            ret = walkFn.call(this.scope, node, this);
            if (pathElement) { this.path.pop(); }
            if (this.debug) {
                this.level -= 1;
                console.log(prefix + 'Return (' + seq + '):' + node.type);
            }
            return ret || node;
        },

        startLineForNode: function (node) {
            return node && node.loc && node.loc.start ? node.loc.start.line : /* istanbul ignore next: guard */ null;
        },

        ancestor: function (n) {
            return this.path.length > n - 1 ? this.path[this.path.length - n] : /* istanbul ignore next: guard */ null;
        },

        parent: function () {
            return this.ancestor(1);
        },

        isLabeled: function () {
            var el = this.parent();
            return el && el.node.type === SYNTAX.LabeledStatement.name;
        }
    };

    /**
     * mechanism to instrument code for coverage. It uses the `esprima` and
     * `escodegen` libraries for JS parsing and code generation respectively.
     *
     * Works on `node` as well as the browser.
     *
     * Usage on nodejs
     * ---------------
     *
     *      var instrumenter = new require('istanbul').Instrumenter(),
     *          changed = instrumenter.instrumentSync('function meaningOfLife() { return 42; }', 'filename.js');
     *
     * Usage in a browser
     * ------------------
     *
     * Load `esprima.js`, `escodegen.js` and `instrumenter.js` (this file) using `script` tags or other means.
     *
     * Create an instrumenter object as:
     *
     *      var instrumenter = new Instrumenter(),
     *          changed = instrumenter.instrumentSync('function meaningOfLife() { return 42; }', 'filename.js');
     *
     * Aside from demonstration purposes, it is unclear why you would want to instrument code in a browser.
     *
     * @class Instrumenter
     * @constructor
     * @param {Object} options Optional. Configuration options.
     * @param {String} [options.coverageVariable] the global variable name to use for
     *      tracking coverage. Defaults to `__coverage__`
     * @param {Boolean} [options.embedSource] whether to embed the source code of every
     *      file as an array in the file coverage object for that file. Defaults to `false`
     * @param {Boolean} [options.preserveComments] whether comments should be preserved in the output. Defaults to `false`
     * @param {Boolean} [options.noCompact] emit readable code when set. Defaults to `false`
     * @param {Boolean} [options.noAutoWrap] do not automatically wrap the source in
     *      an anonymous function before covering it. By default, code is wrapped in
     *      an anonymous function before it is parsed. This is done because
     *      some nodejs libraries have `return` statements outside of
     *      a function which is technically invalid Javascript and causes the parser to fail.
     *      This construct, however, works correctly in node since module loading
     *      is done in the context of an anonymous function.
     *
     * Note that the semantics of the code *returned* by the instrumenter does not change in any way.
     * The function wrapper is "unwrapped" before the instrumented code is generated.
     * @param {Object} [options.codeGenerationOptions] an object that is directly passed to the `escodegen`
     *      library as configuration for code generation. The `noCompact` setting is not honored when this
     *      option is specified
     * @param {Boolean} [options.debug] assist in debugging. Currently, the only effect of
     *      setting this option is a pretty-print of the coverage variable. Defaults to `false`
     * @param {Boolean} [options.walkDebug] assist in debugging of the AST walker used by this class.
     *
     */
    function Instrumenter(options) {
        this.opts = options || {
            debug: false,
            walkDebug: false,
            coverageVariable: '__coverage__',
            codeGenerationOptions: undefined,
            noAutoWrap: false,
            noCompact: false,
            embedSource: false,
            preserveComments: false
        };

        this.walker = new Walker({
            ArrowFunctionExpression: [ this.arrowBlockConverter ],
            ExpressionStatement: this.coverStatement,
            BreakStatement: this.coverStatement,
            ContinueStatement: this.coverStatement,
            DebuggerStatement: this.coverStatement,
            ReturnStatement: this.coverStatement,
            ThrowStatement: this.coverStatement,
            TryStatement: [ this.paranoidHandlerCheck, this.coverStatement],
            VariableDeclaration: this.coverStatement,
            IfStatement: [ this.ifBlockConverter, this.coverStatement, this.ifBranchInjector ],
            ForStatement: [ this.skipInit, this.loopBlockConverter, this.coverStatement ],
            ForInStatement: [ this.skipLeft, this.loopBlockConverter, this.coverStatement ],
            ForOfStatement: [ this.skipLeft, this.loopBlockConverter, this.coverStatement ],
            WhileStatement: [ this.loopBlockConverter, this.coverStatement ],
            DoWhileStatement: [ this.loopBlockConverter, this.coverStatement ],
            SwitchStatement: [ this.coverStatement, this.switchBranchInjector ],
            SwitchCase: [ this.switchCaseInjector ],
            WithStatement: [ this.withBlockConverter, this.coverStatement ],
            FunctionDeclaration: [ this.coverFunction, this.coverStatement ],
            FunctionExpression: this.coverFunction,
            LabeledStatement: this.coverStatement,
            ConditionalExpression: this.conditionalBranchInjector,
            LogicalExpression: this.logicalExpressionBranchInjector,
            ObjectExpression: this.maybeAddType
        }, this.extractCurrentHint, this, this.opts.walkDebug);

        //unit testing purposes only
        if (this.opts.backdoor && this.opts.backdoor.omitTrackerSuffix) {
            this.omitTrackerSuffix = true;
        }
    }

    Instrumenter.prototype = {
        /**
         * synchronous instrumentation method. Throws when illegal code is passed to it
         * @method instrumentSync
         * @param {String} code the code to be instrumented as a String
         * @param {String} filename Optional. The name of the file from which
         *  the code was read. A temporary filename is generated when not specified.
         *  Not specifying a filename is only useful for unit tests and demonstrations
         *  of this library.
         */
        instrumentSync: function (code, filename) {
            var program;

            //protect from users accidentally passing in a Buffer object instead
            if (typeof code !== 'string') { throw new Error('Code must be string'); }
            if (code.charAt(0) === '#') { //shebang, 'comment' it out, won't affect syntax tree locations for things we care about
                code = '//' + code;
            }
            if (!this.opts.noAutoWrap) {
                code = LEADER_WRAP + code + TRAILER_WRAP;
            }
            program = ESP.parse(code, {
                loc: true,
                range: true,
                tokens: this.opts.preserveComments,
                comment: true
            });
            if (this.opts.preserveComments) {
                program = ESPGEN.attachComments(program, program.comments, program.tokens);
            }
            if (!this.opts.noAutoWrap) {
                program = {
                    type: SYNTAX.Program.name,
                    body: program.body[0].expression.callee.body.body,
                    comments: program.comments
                };
            }
            return this.instrumentASTSync(program, filename, code);
        },
        filterHints: function (comments) {
            var ret = [],
                i,
                comment,
                groups;
            if (!(comments && isArray(comments))) {
                return ret;
            }
            for (i = 0; i < comments.length; i += 1) {
                comment = comments[i];
                /* istanbul ignore else: paranoid check */
                if (comment && comment.value && comment.range && isArray(comment.range)) {
                    groups = String(comment.value).match(COMMENT_RE);
                    if (groups) {
                        ret.push({ type: groups[1], start: comment.range[0], end: comment.range[1] });
                    }
                }
            }
            return ret;
        },
        extractCurrentHint: function (node) {
            if (!node.range) { return; }
            var i = this.currentState.lastHintPosition + 1,
                hints = this.currentState.hints,
                nodeStart = node.range[0],
                hint;
            this.currentState.currentHint = null;
            while (i < hints.length) {
                hint = hints[i];
                if (hint.end < nodeStart) {
                    this.currentState.currentHint = hint;
                    this.currentState.lastHintPosition = i;
                    i += 1;
                } else {
                    break;
                }
            }
        },
        /**
         * synchronous instrumentation method that instruments an AST instead.
         * @method instrumentASTSync
         * @param {String} program the AST to be instrumented
         * @param {String} filename Optional. The name of the file from which
         *  the code was read. A temporary filename is generated when not specified.
         *  Not specifying a filename is only useful for unit tests and demonstrations
         *  of this library.
         *  @param {String} originalCode the original code corresponding to the AST,
         *  used for embedding the source into the coverage object
         */
        instrumentASTSync: function (program, filename, originalCode) {
            var usingStrict = false,
                codegenOptions,
                generated,
                preamble,
                lineCount,
                i;
            filename = filename || String(new Date().getTime()) + '.js';
            this.sourceMap = null;
            this.coverState = {
                path: filename,
                s: {},
                b: {},
                f: {},
                fnMap: {},
                statementMap: {},
                branchMap: {}
            };
            this.currentState = {
                trackerVar: generateTrackerVar(filename, this.omitTrackerSuffix),
                func: 0,
                branch: 0,
                variable: 0,
                statement: 0,
                hints: this.filterHints(program.comments),
                currentHint: null,
                lastHintPosition: -1,
                ignoring: 0
            };
            if (program.body && program.body.length > 0 && this.isUseStrictExpression(program.body[0])) {
                //nuke it
                program.body.shift();
                //and add it back at code generation time
                usingStrict = true;
            }
            this.walker.startWalk(program);
            codegenOptions = this.opts.codeGenerationOptions || { format: { compact: !this.opts.noCompact }};
            codegenOptions.comment = this.opts.preserveComments;
            //console.log(JSON.stringify(program, undefined, 2));

            generated = ESPGEN.generate(program, codegenOptions);
            preamble = this.getPreamble(originalCode || '', usingStrict);

            if (generated.map && generated.code) {
                lineCount = preamble.split(/\r\n|\r|\n/).length;
                // offset all the generated line numbers by the number of lines in the preamble
                for (i = 0; i < generated.map._mappings._array.length; i += 1) {
                    generated.map._mappings._array[i].generatedLine += lineCount;
                }
                this.sourceMap = generated.map;
                generated = generated.code;
            }

            return preamble + '\n' + generated + '\n';
        },
        /**
         * Callback based instrumentation. Note that this still executes synchronously in the same process tick
         * and calls back immediately. It only provides the options for callback style error handling as
         * opposed to a `try-catch` style and nothing more. Implemented as a wrapper over `instrumentSync`
         *
         * @method instrument
         * @param {String} code the code to be instrumented as a String
         * @param {String} filename Optional. The name of the file from which
         *  the code was read. A temporary filename is generated when not specified.
         *  Not specifying a filename is only useful for unit tests and demonstrations
         *  of this library.
         * @param {Function(err, instrumentedCode)} callback - the callback function
         */
        instrument: function (code, filename, callback) {

            if (!callback && typeof filename === 'function') {
                callback = filename;
                filename = null;
            }
            try {
                callback(null, this.instrumentSync(code, filename));
            } catch (ex) {
                callback(ex);
            }
        },
        /**
         * returns the file coverage object for the code that was instrumented
         * just before calling this method. Note that this represents a
         * "zero-coverage" object which is not even representative of the code
         * being loaded in node or a browser (which would increase the statement
         * counts for mainline code).
         * @method lastFileCoverage
         * @return {Object} a "zero-coverage" file coverage object for the code last instrumented
         * by this instrumenter
         */
        lastFileCoverage: function () {
            return this.coverState;
        },
        /**
         * returns the source map object for the code that was instrumented
         * just before calling this method.
         * @method lastSourceMap
         * @return {Object} a source map object for the code last instrumented
         * by this instrumenter
         */
        lastSourceMap: function () {
            return this.sourceMap;
        },
        fixColumnPositions: function (coverState) {
            var offset = LEADER_WRAP.length,
                fixer = function (loc) {
                    if (loc.start.line === 1) {
                        loc.start.column -= offset;
                    }
                    if (loc.end.line === 1) {
                        loc.end.column -= offset;
                    }
                },
                k,
                obj,
                i,
                locations;

            obj = coverState.statementMap;
            for (k in obj) {
                /* istanbul ignore else: has own property */
                if (obj.hasOwnProperty(k)) { fixer(obj[k]); }
            }
            obj = coverState.fnMap;
            for (k in obj) {
                /* istanbul ignore else: has own property */
                if (obj.hasOwnProperty(k)) { fixer(obj[k].loc); }
            }
            obj = coverState.branchMap;
            for (k in obj) {
                /* istanbul ignore else: has own property */
                if (obj.hasOwnProperty(k)) {
                    locations = obj[k].locations;
                    for (i = 0; i < locations.length; i += 1) {
                        fixer(locations[i]);
                    }
                }
            }
        },

        getPreamble: function (sourceCode, emitUseStrict) {
            var varName = this.opts.coverageVariable || '__coverage__',
                file = this.coverState.path.replace(/\\/g, '\\\\'),
                tracker = this.currentState.trackerVar,
                coverState,
                strictLine = emitUseStrict ? '"use strict";' : '',
                // return replacements using the function to ensure that the replacement is
                // treated like a dumb string and not as a string with RE replacement patterns
                replacer = function (s) {
                    return function () { return s; };
                },
                code;
            if (!this.opts.noAutoWrap) {
                this.fixColumnPositions(this.coverState);
            }
            if (this.opts.embedSource) {
                this.coverState.code = sourceCode.split(/(?:\r?\n)|\r/);
            }
            coverState = this.opts.debug ? JSON.stringify(this.coverState, undefined, 4) : JSON.stringify(this.coverState);
            code = [
                "%STRICT%",
                "var %VAR% = (Function('return this'))();",
                "if (!%VAR%.%GLOBAL%) { %VAR%.%GLOBAL% = {}; }",
                "%VAR% = %VAR%.%GLOBAL%;",
                "if (!(%VAR%['%FILE%'])) {",
                "   %VAR%['%FILE%'] = %OBJECT%;",
                "}",
                "%VAR% = %VAR%['%FILE%'];"
            ].join("\n")
                .replace(/%STRICT%/g, replacer(strictLine))
                .replace(/%VAR%/g, replacer(tracker))
                .replace(/%GLOBAL%/g, replacer(varName))
                .replace(/%FILE%/g, replacer(file))
                .replace(/%OBJECT%/g, replacer(coverState));
            return code;
        },

        startIgnore: function () {
            this.currentState.ignoring += 1;
        },

        endIgnore: function () {
            this.currentState.ignoring -= 1;
        },

        convertToBlock: function (node) {
            if (!node) {
                return { type: 'BlockStatement', body: [] };
            } else if (node.type === 'BlockStatement') {
                return node;
            } else {
                return { type: 'BlockStatement', body: [ node ] };
            }
        },

        arrowBlockConverter: function (node) {
            var retStatement;
            if (node.expression) { // turn expression nodes into a block with a return statement
                retStatement = astgen.returnStatement(node.body);
                // ensure the generated return statement is covered
                retStatement.loc = node.body.loc;
                node.body = this.convertToBlock(retStatement);
                node.expression = false;
            }
        },

        paranoidHandlerCheck: function (node) {
            // if someone is using an older esprima on the browser
            // convert handlers array to single handler attribute
            // containing its first element
            /* istanbul ignore next */
            if (!node.handler && node.handlers) {
                node.handler = node.handlers[0];
            }
        },

        ifBlockConverter: function (node) {
            node.consequent = this.convertToBlock(node.consequent);
            node.alternate = this.convertToBlock(node.alternate);
        },

        loopBlockConverter: function (node) {
            node.body = this.convertToBlock(node.body);
        },

        withBlockConverter: function (node) {
            node.body = this.convertToBlock(node.body);
        },

        statementName: function (location, initValue) {
            var sName,
                ignoring = !!this.currentState.ignoring;

            location.skip = ignoring || undefined;
            initValue = initValue || 0;
            this.currentState.statement += 1;
            sName = this.currentState.statement;
            this.coverState.statementMap[sName] = location;
            this.coverState.s[sName] = initValue;
            return sName;
        },

        skipInit: function (node /*, walker */) {
            if (node.init) {
                node.init.skipWalk = true;
            }
        },

        skipLeft: function (node /*, walker */) {
            node.left.skipWalk = true;
        },

        isUseStrictExpression: function (node) {
            return node && node.type === SYNTAX.ExpressionStatement.name &&
                node.expression  && node.expression.type === SYNTAX.Literal.name &&
                node.expression.value === 'use strict';
        },

        maybeSkipNode: function (node, type) {
            var alreadyIgnoring = !!this.currentState.ignoring,
                hint = this.currentState.currentHint,
                ignoreThis = !alreadyIgnoring && hint && hint.type === type;

            if (ignoreThis) {
                this.startIgnore();
                node.postprocessor = this.endIgnore;
                return true;
            }
            return false;
        },

        coverStatement: function (node, walker) {
            var sName,
                incrStatementCount,
                grandParent;

            this.maybeSkipNode(node, 'next');

            if (this.isUseStrictExpression(node)) {
                grandParent = walker.ancestor(2);
                /* istanbul ignore else: difficult to test */
                if (grandParent) {
                    if ((grandParent.node.type === SYNTAX.FunctionExpression.name ||
                        grandParent.node.type === SYNTAX.FunctionDeclaration.name)  &&
                        walker.parent().node.body[0] === node) {
                        return;
                    }
                }
            }
            if (node.type === SYNTAX.FunctionDeclaration.name) {
                sName = this.statementName(node.loc, 1);
            } else {
                sName = this.statementName(node.loc);
                incrStatementCount = astgen.statement(
                    astgen.postIncrement(
                        astgen.subscript(
                            astgen.dot(astgen.variable(this.currentState.trackerVar), astgen.variable('s')),
                            astgen.stringLiteral(sName)
                        )
                    )
                );
                this.splice(incrStatementCount, node, walker);
            }
        },

        splice: function (statements, node, walker) {
            var targetNode = walker.isLabeled() ? walker.parent().node : node;
            targetNode.prepend = targetNode.prepend || [];
            pushAll(targetNode.prepend, statements);
        },

        functionName: function (node, line, location) {
            this.currentState.func += 1;
            var id = this.currentState.func,
                ignoring = !!this.currentState.ignoring,
                name = node.id ? node.id.name : '(anonymous_' + id + ')',
                clone = function (attr) {
                    var obj = location[attr] || /* istanbul ignore next */ {};
                    return { line: obj.line, column: obj.column };
                };
            this.coverState.fnMap[id] = {
                name: name, line: line,
                loc: {
                    start: clone('start'),
                    end: clone('end')
                },
                skip: ignoring || undefined
            };
            this.coverState.f[id] = 0;
            return id;
        },

        coverFunction: function (node, walker) {
            var id,
                body = node.body,
                blockBody = body.body,
                popped;

            this.maybeSkipNode(node, 'next');

            id = this.functionName(node, walker.startLineForNode(node), {
                start: node.loc.start,
                end: { line: node.body.loc.start.line, column: node.body.loc.start.column }
            });

            if (blockBody.length > 0 && this.isUseStrictExpression(blockBody[0])) {
                popped = blockBody.shift();
            }
            blockBody.unshift(
                astgen.statement(
                    astgen.postIncrement(
                        astgen.subscript(
                            astgen.dot(astgen.variable(this.currentState.trackerVar), astgen.variable('f')),
                            astgen.stringLiteral(id)
                        )
                    )
                )
            );
            if (popped) {
                blockBody.unshift(popped);
            }
        },

        branchName: function (type, startLine, pathLocations) {
            var bName,
                paths = [],
                locations = [],
                i,
                ignoring = !!this.currentState.ignoring;
            this.currentState.branch += 1;
            bName = this.currentState.branch;
            for (i = 0; i < pathLocations.length; i += 1) {
                pathLocations[i].skip = pathLocations[i].skip || ignoring || undefined;
                locations.push(pathLocations[i]);
                paths.push(0);
            }
            this.coverState.b[bName] = paths;
            this.coverState.branchMap[bName] = { line: startLine, type: type, locations: locations };
            return bName;
        },

        branchIncrementExprAst: function (varName, branchIndex, down) {
            var ret = astgen.postIncrement(
                astgen.subscript(
                    astgen.subscript(
                        astgen.dot(astgen.variable(this.currentState.trackerVar), astgen.variable('b')),
                        astgen.stringLiteral(varName)
                    ),
                    astgen.numericLiteral(branchIndex)
                ),
                down
            );
            return ret;
        },

        locationsForNodes: function (nodes) {
            var ret = [],
                i;
            for (i = 0; i < nodes.length; i += 1) {
                ret.push(nodes[i].loc);
            }
            return ret;
        },

        ifBranchInjector: function (node, walker) {
            var alreadyIgnoring = !!this.currentState.ignoring,
                hint = this.currentState.currentHint,
                ignoreThen = !alreadyIgnoring && hint && hint.type === 'if',
                ignoreElse = !alreadyIgnoring && hint && hint.type === 'else',
                line = node.loc.start.line,
                col = node.loc.start.column,
                makeLoc = function () { return  { line: line, column: col }; },
                bName = this.branchName('if', walker.startLineForNode(node), [
                    { start: makeLoc(), end: makeLoc(), skip: ignoreThen || undefined },
                    { start: makeLoc(), end: makeLoc(), skip: ignoreElse || undefined }
                ]),
                thenBody = node.consequent.body,
                elseBody = node.alternate.body,
                child;
            thenBody.unshift(astgen.statement(this.branchIncrementExprAst(bName, 0)));
            elseBody.unshift(astgen.statement(this.branchIncrementExprAst(bName, 1)));
            if (ignoreThen) { child = node.consequent; child.preprocessor = this.startIgnore; child.postprocessor = this.endIgnore; }
            if (ignoreElse) { child = node.alternate; child.preprocessor = this.startIgnore; child.postprocessor = this.endIgnore; }
        },

        branchLocationFor: function (name, index) {
            return this.coverState.branchMap[name].locations[index];
        },

        switchBranchInjector: function (node, walker) {
            var cases = node.cases,
                bName,
                i;

            if (!(cases && cases.length > 0)) {
                return;
            }
            bName = this.branchName('switch', walker.startLineForNode(node), this.locationsForNodes(cases));
            for (i = 0; i < cases.length; i += 1) {
                cases[i].branchLocation = this.branchLocationFor(bName, i);
                cases[i].consequent.unshift(astgen.statement(this.branchIncrementExprAst(bName, i)));
            }
        },

        switchCaseInjector: function (node) {
            var location = node.branchLocation;
            delete node.branchLocation;
            if (this.maybeSkipNode(node, 'next')) {
                location.skip = true;
            }
        },

        conditionalBranchInjector: function (node, walker) {
            var bName = this.branchName('cond-expr', walker.startLineForNode(node), this.locationsForNodes([ node.consequent, node.alternate ])),
                ast1 = this.branchIncrementExprAst(bName, 0),
                ast2 = this.branchIncrementExprAst(bName, 1);

            node.consequent.preprocessor = this.maybeAddSkip(this.branchLocationFor(bName, 0));
            node.alternate.preprocessor = this.maybeAddSkip(this.branchLocationFor(bName, 1));
            node.consequent = astgen.sequence(ast1, node.consequent);
            node.alternate = astgen.sequence(ast2, node.alternate);
        },

        maybeAddSkip: function (branchLocation) {
            return function (node) {
                var alreadyIgnoring = !!this.currentState.ignoring,
                    hint = this.currentState.currentHint,
                    ignoreThis = !alreadyIgnoring && hint && hint.type === 'next';
                if (ignoreThis) {
                    this.startIgnore();
                    node.postprocessor = this.endIgnore;
                }
                if (ignoreThis || alreadyIgnoring) {
                    branchLocation.skip = true;
                }
            };
        },

        logicalExpressionBranchInjector: function (node, walker) {
            var parent = walker.parent(),
                leaves = [],
                bName,
                tuple,
                i;

            this.maybeSkipNode(node, 'next');

            if (parent && parent.node.type === SYNTAX.LogicalExpression.name) {
                //already covered
                return;
            }

            this.findLeaves(node, leaves);
            bName = this.branchName('binary-expr',
                walker.startLineForNode(node),
                this.locationsForNodes(leaves.map(function (item) { return item.node; }))
            );
            for (i = 0; i < leaves.length; i += 1) {
                tuple = leaves[i];
                tuple.parent[tuple.property] = astgen.sequence(this.branchIncrementExprAst(bName, i), tuple.node);
                tuple.node.preprocessor = this.maybeAddSkip(this.branchLocationFor(bName, i));
            }
        },

        findLeaves: function (node, accumulator, parent, property) {
            if (node.type === SYNTAX.LogicalExpression.name) {
                this.findLeaves(node.left, accumulator, node, 'left');
                this.findLeaves(node.right, accumulator, node, 'right');
            } else {
                accumulator.push({ node: node, parent: parent, property: property });
            }
        },
        maybeAddType: function (node /*, walker */) {
            var props = node.properties,
                i,
                child;
            for (i = 0; i < props.length; i += 1) {
                child = props[i];
                if (!child.type) {
                    child.type = SYNTAX.Property.name;
                }
            }
        }
    };

    if (isNode) {
        module.exports = Instrumenter;
    } else {
        window.Instrumenter = Instrumenter;
    }

}(typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof exports !== 'undefined'));


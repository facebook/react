/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true */
/*global escodegen:true, exports:true, generateStatement: true*/

(function (exports) {
    'use strict';

    var Syntax,
        Precedence,
        BinaryPrecedence,
        base,
        indent,
        extra,
        parse;

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    Precedence = {
        Sequence: 0,
        Assignment: 1,
        Conditional: 2,
        LogicalOR: 3,
        LogicalAND: 4,
        LogicalXOR: 5,
        BitwiseOR: 6,
        BitwiseAND: 7,
        Equality: 8,
        Relational: 9,
        BitwiseSHIFT: 10,
        Additive: 11,
        Multiplicative: 12,
        Unary: 13,
        Postfix: 14,
        Call: 15,
        New: 16,
        Member: 17,
        Primary: 18
    };

    BinaryPrecedence = {
        '||': Precedence.LogicalOR,
        '&&': Precedence.LogicalAND,
        '^': Precedence.LogicalXOR,
        '|': Precedence.BitwiseOR,
        '&': Precedence.BitwiseAND,
        '==': Precedence.Equality,
        '!=': Precedence.Equality,
        '===': Precedence.Equality,
        '!==': Precedence.Equality,
        '<': Precedence.Relational,
        '>': Precedence.Relational,
        '<=': Precedence.Relational,
        '>=': Precedence.Relational,
        'in': Precedence.Relational,
        'instanceof': Precedence.Relational,
        '<<': Precedence.BitwiseSHIFT,
        '>>': Precedence.BitwiseSHIFT,
        '>>>': Precedence.BitwiseSHIFT,
        '+': Precedence.Additive,
        '-': Precedence.Additive,
        '*': Precedence.Multiplicative,
        '%': Precedence.Multiplicative,
        '/': Precedence.Multiplicative
    };

    if (typeof Object.freeze === 'function') {
        Object.freeze(Syntax);
        Object.freeze(Precedence);
        Object.freeze(BinaryPrecedence);
    }

    function unicodeEscape(ch) {
        var result, i;
        result = ch.charCodeAt(0).toString(16);
        for (i = result.length; i < 4; i += 1) {
            result = '0' + result;
        }
        return '\\u' + result;
    }

    function stringToArray(str) {
        var length = str.length,
            result = [],
            i;
        for (i = 0; i < length; i += 1) {
            result[i] = str.charAt(i);
        }
        return result;
    }

    function escapeString(str) {
        var result = '', i, len, ch;

        if (typeof str[0] === 'undefined') {
            str = stringToArray(str);
        }

        for (i = 0, len = str.length; i < len; i += 1) {
            ch = str[i];
            if ('\'\\\b\f\n\r\t'.indexOf(ch) >= 0) {
                result += '\\';
                switch (ch) {
                case '\'':
                    result += '\'';
                    break;
                case '\\':
                    result += '\\';
                    break;
                case '\b':
                    result += 'b';
                    break;
                case '\f':
                    result += 'f';
                    break;
                case '\n':
                    result += 'n';
                    break;
                case '\r':
                    result += 'r';
                    break;
                case '\t':
                    result += 't';
                    break;
                }
            } else if (ch < ' ' || ch.charCodeAt(0) >= 0x80) {
                result += unicodeEscape(ch);
            } else {
                result += ch;
            }
        }

        return '\'' + result + '\'';
    }

    function addIndent(stmt) {
        return base + stmt;
    }

    function parenthesize(text, current, should) {
        return (current < should) ?  '(' + text + ')' : text;
    }

    function maybeBlock(stmt, suffix) {
        var previousBase, result;

        if (stmt.type === Syntax.BlockStatement) {
            result = ' ' + generateStatement(stmt);
            if (suffix) {
                return result + ' ';
            }
            return result;
        }

        if (stmt.type === Syntax.EmptyStatement) {
            result = ';';
        } else {
            previousBase = base;
            base += indent;
            result = '\n' + addIndent(generateStatement(stmt));
            base = previousBase;
        }

        if (suffix) {
            return result + '\n' + addIndent('');
        }
        return result;
    }

    function generateFunctionBody(node) {
        var result, i, len;
        result = '(';
        for (i = 0, len = node.params.length; i < len; i += 1) {
            result += node.params[i].name;
            if ((i + 1) < len) {
                result += ', ';
            }
        }
        return result + ')' + maybeBlock(node.body);
    }

    function generateExpression(expr, precedence) {
        var result, currentPrecedence, previousBase, i, len, raw;

        if (!precedence) {
            precedence = Precedence.Sequence;
        }

        switch (expr.type) {
        case Syntax.SequenceExpression:
            result = '';
            for (i = 0, len = expr.expressions.length; i < len; i += 1) {
                result += generateExpression(expr.expressions[i], Precedence.Assignment);
                if ((i + 1) < len) {
                    result += ', ';
                }
            }
            result = parenthesize(result, Precedence.Sequence, precedence);
            break;

        case Syntax.AssignmentExpression:
            result = parenthesize(
                generateExpression(expr.left, Precedence.Call) + ' ' + expr.operator + ' ' +
                    generateExpression(expr.right, Precedence.Assignment),
                Precedence.Assignment,
                precedence
            );
            break;

        case Syntax.ConditionalExpression:
            result = parenthesize(
                generateExpression(expr.test, Precedence.LogicalOR) + ' ? ' +
                    generateExpression(expr.consequent, Precedence.Assignment) + ' : ' +
                    generateExpression(expr.alternate, Precedence.Assignment),
                Precedence.Conditional,
                precedence
            );
            break;

        case Syntax.LogicalExpression:
        case Syntax.BinaryExpression:
            currentPrecedence = BinaryPrecedence[expr.operator];

            result = generateExpression(expr.left, currentPrecedence) +
                ' ' + expr.operator + ' ' +
                generateExpression(expr.right, currentPrecedence + 1);
            if (expr.operator === 'in') {
                // TODO parenthesize only in allowIn = false case
                result = '(' + result + ')';
            } else {
                result = parenthesize(result, currentPrecedence, precedence);
            }
            break;

        case Syntax.CallExpression:
            result = '';
            for (i = 0, len = expr['arguments'].length; i < len; i += 1) {
                result += generateExpression(expr['arguments'][i], Precedence.Assignment);
                if ((i + 1) < len) {
                    result += ', ';
                }
            }
            result = parenthesize(
                generateExpression(expr.callee, Precedence.Call) + '(' + result + ')',
                Precedence.Call,
                precedence
            );
            break;

        case Syntax.NewExpression:
            result = '';
            for (i = 0, len = expr['arguments'].length; i < len; i += 1) {
                result += generateExpression(expr['arguments'][i], Precedence.Assignment);
                if ((i + 1) < len) {
                    result += ', ';
                }
            }
            result = parenthesize(
                'new ' + generateExpression(expr.callee, Precedence.New) + '(' + result + ')',
                Precedence.New,
                precedence
            );
            break;

        case Syntax.MemberExpression:
            result = generateExpression(expr.object, Precedence.Call);
            if (expr.computed) {
                result += '[' + generateExpression(expr.property) + ']';
            } else {
                if (expr.object.type === Syntax.Literal && typeof expr.object.value === 'number') {
                    if (result.indexOf('.') < 0) {
                        if (!/[eExX]/.test(result) && !(result.length >= 2 && result[0] === '0')) {
                            result += '.';
                        }
                    }
                }
                result += '.' + expr.property.name;
            }
            result = parenthesize(result, Precedence.Member, precedence);
            break;

        case Syntax.UnaryExpression:
            result = expr.operator;
            if (result.length > 2) {
                result += ' ';
            }
            result = parenthesize(
                result + generateExpression(expr.argument, Precedence.Unary +
                    (
                        expr.argument.type === Syntax.UnaryExpression &&
                        expr.operator.length < 3 &&
                        expr.argument.operator === expr.operator ? 1 : 0
                    )
                    ),
                Precedence.Unary,
                precedence
            );
            break;

        case Syntax.UpdateExpression:
            if (expr.prefix) {
                result = parenthesize(
                    expr.operator +
                        generateExpression(expr.argument, Precedence.Unary),
                    Precedence.Unary,
                    precedence
                );
            } else {
                result = parenthesize(
                    generateExpression(expr.argument, Precedence.Postfix) +
                        expr.operator,
                    Precedence.Postfix,
                    precedence
                );
            }
            break;

        case Syntax.FunctionExpression:
            result = 'function ';
            if (expr.id) {
                result += expr.id.name;
            }
            result += generateFunctionBody(expr);
            break;

        case Syntax.ArrayExpression:
            if (!expr.elements.length) {
                result = '[]';
                break;
            }
            result = '[\n';
            previousBase = base;
            base += indent;
            for (i = 0, len = expr.elements.length; i < len; i += 1) {
                if (!expr.elements[i]) {
                    result += addIndent('');
                    if ((i + 1) === len) {
                        result += ',';
                    }
                } else {
                    result += addIndent(generateExpression(expr.elements[i], Precedence.Assignment));
                }
                if ((i + 1) < len) {
                    result += ',\n';
                }
            }
            base = previousBase;
            result += '\n' + addIndent(']');
            break;

        case Syntax.Property:
            if (expr.kind === 'get' || expr.kind === 'set') {
                result = expr.kind + ' ' + generateExpression(expr.key) +
                    generateFunctionBody(expr.value);
            } else {
                result = generateExpression(expr.key) + ': ' +
                    generateExpression(expr.value, Precedence.Assignment);
            }
            break;

        case Syntax.ObjectExpression:
            if (!expr.properties.length) {
                result = '{}';
                break;
            }
            result = '{\n';
            previousBase = base;
            base += indent;
            for (i = 0, len = expr.properties.length; i < len; i += 1) {
                result += addIndent(generateExpression(expr.properties[i]));
                if ((i + 1) < len) {
                    result += ',\n';
                }
            }
            base = previousBase;
            result += '\n' + addIndent('}');
            break;

        case Syntax.ThisExpression:
            result = 'this';
            break;

        case Syntax.Identifier:
            result = expr.name;
            break;

        case Syntax.Literal:
            if (expr.hasOwnProperty('raw') && parse) {
                try {
                    raw = parse(expr.raw).body[0].expression;
                    if (raw.type === Syntax.Literal) {
                        if (raw.value === expr.value) {
                            result = expr.raw;
                            break;
                        }
                    }
                } catch (e) {
                    // not use raw property
                }
            }

            if (expr.value === null) {
                result = 'null';
                break;
            }

            if (typeof expr.value === 'string') {
                result = escapeString(expr.value);
                break;
            }

            if (typeof expr.value === 'number' && expr.value === Infinity) {
                // Infinity is variable
                result = '1e+1000';
                break;
            }

            result = expr.value.toString();
            break;

        default:
            break;
        }

        if (result === undefined) {
            throw new Error('Unknown expression type: ' + expr.type);
        }
        return result;
    }

    function generateStatement(stmt) {
        var i, len, result, previousBase;

        switch (stmt.type) {
        case Syntax.BlockStatement:
            result = '{\n';

            previousBase = base;
            base += indent;
            for (i = 0, len = stmt.body.length; i < len; i += 1) {
                result += addIndent(generateStatement(stmt.body[i])) + '\n';
            }
            base = previousBase;

            result += addIndent('}');
            break;

        case Syntax.BreakStatement:
            if (stmt.label) {
                result = 'break ' + stmt.label.name + ';';
            } else {
                result = 'break;';
            }
            break;

        case Syntax.ContinueStatement:
            if (stmt.label) {
                result = 'continue ' + stmt.label.name + ';';
            } else {
                result = 'continue;';
            }
            break;

        case Syntax.DoWhileStatement:
            result = 'do' + maybeBlock(stmt.body, true) + 'while (' + generateExpression(stmt.test) + ');';
            break;

        case Syntax.CatchClause:
            previousBase = base;
            base += indent;
            result = ' catch (' + generateExpression(stmt.param) + ')';
            base = previousBase;
            result += maybeBlock(stmt.body);
            break;

        case Syntax.DebuggerStatement:
            result = 'debugger;';
            break;

        case Syntax.EmptyStatement:
            result = ';';
            break;

        case Syntax.ExpressionStatement:
            result = generateExpression(stmt.expression);
            // 12.4 '{', 'function' is not allowed in this position.
            // wrap espression with parentheses
            if (result[0] === '{' || result.indexOf('function ') === 0) {
                result = '(' + result + ');';
            } else {
                result += ';';
            }
            break;

        case Syntax.VariableDeclarator:
            if (stmt.init) {
                result = stmt.id.name + ' = ' + generateExpression(stmt.init, Precedence.Assignment);
            } else {
                result = stmt.id.name;
            }
            break;

        case Syntax.VariableDeclaration:
            result = stmt.kind + ' ';
            // special path for
            // var x = function () {
            // };
            if (stmt.declarations.length === 1 && stmt.declarations[0].init &&
                    stmt.declarations[0].init.type === Syntax.FunctionExpression) {
                result += generateStatement(stmt.declarations[0]);
            } else {
                previousBase = base;
                base += indent;
                for (i = 0, len = stmt.declarations.length; i < len; i += 1) {
                    result += generateStatement(stmt.declarations[i]);
                    if ((i + 1) < len) {
                        result += ', ';
                    }
                }
                base = previousBase;
            }
            result += ';';
            break;

        case Syntax.ThrowStatement:
            result = 'throw ' + generateExpression(stmt.argument) + ';';
            break;

        case Syntax.TryStatement:
            result = 'try' + maybeBlock(stmt.block);
            for (i = 0, len = stmt.handlers.length; i < len; i += 1) {
                result += generateStatement(stmt.handlers[i]);
            }
            if (stmt.finalizer) {
                result += ' finally' + maybeBlock(stmt.finalizer);
            }
            break;

        case Syntax.SwitchStatement:
            previousBase = base;
            base += indent;
            result = 'switch (' + generateExpression(stmt.discriminant) + ') {\n';
            base = previousBase;
            if (stmt.cases) {
                for (i = 0, len = stmt.cases.length; i < len; i += 1) {
                    result += addIndent(generateStatement(stmt.cases[i])) + '\n';
                }
            }
            result += addIndent('}');
            break;

        case Syntax.SwitchCase:
            previousBase = base;
            base += indent;
            if (stmt.test) {
                result = 'case ' + generateExpression(stmt.test) + ':';
            } else {
                result = 'default:';
            }

            i = 0;
            len = stmt.consequent.length;
            if (len && stmt.consequent[0].type === Syntax.BlockStatement) {
                result += maybeBlock(stmt.consequent[0]);
                i = 1;
            }

            for (; i < len; i += 1) {
                result += '\n' + addIndent(generateStatement(stmt.consequent[i]));
            }

            base = previousBase;
            break;

        case Syntax.IfStatement:
            if (stmt.alternate) {
                if (stmt.alternate.type === Syntax.IfStatement) {
                    previousBase = base;
                    base += indent;
                    result = 'if (' +  generateExpression(stmt.test) + ')';
                    base = previousBase;
                    result += maybeBlock(stmt.consequent, true) + 'else ' + generateStatement(stmt.alternate);
                } else {
                    previousBase = base;
                    base += indent;
                    result = 'if (' + generateExpression(stmt.test) + ')';
                    base = previousBase;
                    result += maybeBlock(stmt.consequent, true) + 'else' + maybeBlock(stmt.alternate);
                }
            } else {
                previousBase = base;
                base += indent;
                result = 'if (' + generateExpression(stmt.test) + ')';
                base = previousBase;
                result += maybeBlock(stmt.consequent);
            }
            break;

        case Syntax.ForStatement:
            previousBase = base;
            base += indent;
            result = 'for (';
            if (stmt.init) {
                if (stmt.init.type === Syntax.VariableDeclaration) {
                    result += generateStatement(stmt.init);
                } else {
                    result += generateExpression(stmt.init) + ';';
                }
            } else {
                result += ';';
            }

            if (stmt.test) {
                result += ' ' + generateExpression(stmt.test) + ';';
            } else {
                result += ';';
            }

            if (stmt.update) {
                result += ' ' + generateExpression(stmt.update) + ')';
            } else {
                result += ')';
            }
            base = previousBase;

            result += maybeBlock(stmt.body);
            break;

        case Syntax.ForInStatement:
            result = 'for (';
            if (stmt.left.type === Syntax.VariableDeclaration) {
                previousBase = base;
                base += indent + indent;
                result += stmt.left.kind + ' ' + generateStatement(stmt.left.declarations[0]);
                base = previousBase;
            } else {
                previousBase = base;
                base += indent;
                result += generateExpression(stmt.left, Precedence.Call);
                base = previousBase;
            }

            previousBase = base;
            base += indent;
            result += ' in ' + generateExpression(stmt.right) + ')';
            base = previousBase;
            result += maybeBlock(stmt.body);
            break;

        case Syntax.LabeledStatement:
            result = stmt.label.name + ':' + maybeBlock(stmt.body);
            break;

        case Syntax.Program:
            result = '';
            for (i = 0, len = stmt.body.length; i < len; i += 1) {
                result += generateStatement(stmt.body[i]);
                if ((i + 1) < len) {
                    result += '\n';
                }
            }
            break;

        case Syntax.FunctionDeclaration:
            result = 'function ';
            if (stmt.id) {
                result += stmt.id.name;
            }
            result += generateFunctionBody(stmt);
            break;

        case Syntax.ReturnStatement:
            if (stmt.argument) {
                result = 'return ' + generateExpression(stmt.argument) + ';';
            } else {
                result = 'return;';
            }
            break;

        case Syntax.WhileStatement:
            previousBase = base;
            base += indent;
            result = 'while (' + generateExpression(stmt.test) + ')';
            base = previousBase;
            result += maybeBlock(stmt.body);
            break;

        case Syntax.WithStatement:
            previousBase = base;
            base += indent;
            result = 'with (' + generateExpression(stmt.object) + ')';
            base = previousBase;
            result += maybeBlock(stmt.body);
            break;

        default:
            break;
        }

        if (result === undefined) {
            throw new Error('Unknown statement type: ' + stmt.type);
        }
        return result;
    }

    function generate(node, options) {
        if (typeof options !== 'undefined') {
            base = options.base || '';
            indent = options.indent || '    ';
            parse = options.parse;
        } else {
            base = '';
            indent = '    ';
            parse = null;
        }

        switch (node.type) {
        case Syntax.BlockStatement:
        case Syntax.BreakStatement:
        case Syntax.CatchClause:
        case Syntax.ContinueStatement:
        case Syntax.DoWhileStatement:
        case Syntax.DebuggerStatement:
        case Syntax.EmptyStatement:
        case Syntax.ExpressionStatement:
        case Syntax.ForStatement:
        case Syntax.ForInStatement:
        case Syntax.FunctionDeclaration:
        case Syntax.IfStatement:
        case Syntax.LabeledStatement:
        case Syntax.Program:
        case Syntax.ReturnStatement:
        case Syntax.SwitchStatement:
        case Syntax.SwitchCase:
        case Syntax.ThrowStatement:
        case Syntax.TryStatement:
        case Syntax.VariableDeclaration:
        case Syntax.VariableDeclarator:
        case Syntax.WhileStatement:
        case Syntax.WithStatement:
            return generateStatement(node);

        case Syntax.AssignmentExpression:
        case Syntax.ArrayExpression:
        case Syntax.BinaryExpression:
        case Syntax.CallExpression:
        case Syntax.ConditionalExpression:
        case Syntax.FunctionExpression:
        case Syntax.Identifier:
        case Syntax.Literal:
        case Syntax.LogicalExpression:
        case Syntax.MemberExpression:
        case Syntax.NewExpression:
        case Syntax.ObjectExpression:
        case Syntax.Property:
        case Syntax.SequenceExpression:
        case Syntax.ThisExpression:
        case Syntax.UnaryExpression:
        case Syntax.UpdateExpression:
            return generateExpression(node);

        default:
            break;
        }
        throw new Error('Unknown node type: ' + node.type);
    }

    // Sync with package.json.
    exports.version = '0.0.3-dev';

    exports.generate = generate;

}(typeof exports === 'undefined' ? (escodegen = {}) : exports));
/* vim: set sw=4 ts=4 et tw=80 : */
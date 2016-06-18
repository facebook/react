import {Injectable} from '@angular/core';

import {SetWrapper} from '../facade/collection';
import {BaseException} from '../facade/exceptions';
import {NumberWrapper, StringJoiner, StringWrapper, isPresent} from '../facade/lang';

export enum TokenType {
  Character,
  Identifier,
  Keyword,
  String,
  Operator,
  Number
}

@Injectable()
export class Lexer {
  tokenize(text: string): any[] {
    var scanner = new _Scanner(text);
    var tokens: Token[] = [];
    var token = scanner.scanToken();
    while (token != null) {
      tokens.push(token);
      token = scanner.scanToken();
    }
    return tokens;
  }
}

export class Token {
  constructor(
      public index: number, public type: TokenType, public numValue: number,
      public strValue: string) {}

  isCharacter(code: number): boolean {
    return (this.type == TokenType.Character && this.numValue == code);
  }

  isNumber(): boolean { return (this.type == TokenType.Number); }

  isString(): boolean { return (this.type == TokenType.String); }

  isOperator(operater: string): boolean {
    return (this.type == TokenType.Operator && this.strValue == operater);
  }

  isIdentifier(): boolean { return (this.type == TokenType.Identifier); }

  isKeyword(): boolean { return (this.type == TokenType.Keyword); }

  isKeywordDeprecatedVar(): boolean {
    return (this.type == TokenType.Keyword && this.strValue == 'var');
  }

  isKeywordLet(): boolean { return (this.type == TokenType.Keyword && this.strValue == 'let'); }

  isKeywordNull(): boolean { return (this.type == TokenType.Keyword && this.strValue == 'null'); }

  isKeywordUndefined(): boolean {
    return (this.type == TokenType.Keyword && this.strValue == 'undefined');
  }

  isKeywordTrue(): boolean { return (this.type == TokenType.Keyword && this.strValue == 'true'); }

  isKeywordFalse(): boolean { return (this.type == TokenType.Keyword && this.strValue == 'false'); }

  toNumber(): number {
    // -1 instead of NULL ok?
    return (this.type == TokenType.Number) ? this.numValue : -1;
  }

  toString(): string {
    switch (this.type) {
      case TokenType.Character:
      case TokenType.Identifier:
      case TokenType.Keyword:
      case TokenType.Operator:
      case TokenType.String:
        return this.strValue;
      case TokenType.Number:
        return this.numValue.toString();
      default:
        return null;
    }
  }
}

function newCharacterToken(index: number, code: number): Token {
  return new Token(index, TokenType.Character, code, StringWrapper.fromCharCode(code));
}

function newIdentifierToken(index: number, text: string): Token {
  return new Token(index, TokenType.Identifier, 0, text);
}

function newKeywordToken(index: number, text: string): Token {
  return new Token(index, TokenType.Keyword, 0, text);
}

function newOperatorToken(index: number, text: string): Token {
  return new Token(index, TokenType.Operator, 0, text);
}

function newStringToken(index: number, text: string): Token {
  return new Token(index, TokenType.String, 0, text);
}

function newNumberToken(index: number, n: number): Token {
  return new Token(index, TokenType.Number, n, '');
}


export var EOF: Token = new Token(-1, TokenType.Character, 0, '');

export const $EOF = /*@ts2dart_const*/ 0;
export const $TAB = /*@ts2dart_const*/ 9;
export const $LF = /*@ts2dart_const*/ 10;
export const $VTAB = /*@ts2dart_const*/ 11;
export const $FF = /*@ts2dart_const*/ 12;
export const $CR = /*@ts2dart_const*/ 13;
export const $SPACE = /*@ts2dart_const*/ 32;
export const $BANG = /*@ts2dart_const*/ 33;
export const $DQ = /*@ts2dart_const*/ 34;
export const $HASH = /*@ts2dart_const*/ 35;
export const $$ = /*@ts2dart_const*/ 36;
export const $PERCENT = /*@ts2dart_const*/ 37;
export const $AMPERSAND = /*@ts2dart_const*/ 38;
export const $SQ = /*@ts2dart_const*/ 39;
export const $LPAREN = /*@ts2dart_const*/ 40;
export const $RPAREN = /*@ts2dart_const*/ 41;
export const $STAR = /*@ts2dart_const*/ 42;
export const $PLUS = /*@ts2dart_const*/ 43;
export const $COMMA = /*@ts2dart_const*/ 44;
export const $MINUS = /*@ts2dart_const*/ 45;
export const $PERIOD = /*@ts2dart_const*/ 46;
export const $SLASH = /*@ts2dart_const*/ 47;
export const $COLON = /*@ts2dart_const*/ 58;
export const $SEMICOLON = /*@ts2dart_const*/ 59;
export const $LT = /*@ts2dart_const*/ 60;
export const $EQ = /*@ts2dart_const*/ 61;
export const $GT = /*@ts2dart_const*/ 62;
export const $QUESTION = /*@ts2dart_const*/ 63;

const $0 = /*@ts2dart_const*/ 48;
const $9 = /*@ts2dart_const*/ 57;

const $A = /*@ts2dart_const*/ 65, $E = /*@ts2dart_const*/ 69, $Z = /*@ts2dart_const*/ 90;

export const $LBRACKET = /*@ts2dart_const*/ 91;
export const $BACKSLASH = /*@ts2dart_const*/ 92;
export const $RBRACKET = /*@ts2dart_const*/ 93;
const $CARET = /*@ts2dart_const*/ 94;
const $_ = /*@ts2dart_const*/ 95;
export const $BT = /*@ts2dart_const*/ 96;
const $a = /*@ts2dart_const*/ 97, $e = /*@ts2dart_const*/ 101, $f = /*@ts2dart_const*/ 102;
const $n = /*@ts2dart_const*/ 110, $r = /*@ts2dart_const*/ 114, $t = /*@ts2dart_const*/ 116,
      $u = /*@ts2dart_const*/ 117, $v = /*@ts2dart_const*/ 118, $z = /*@ts2dart_const*/ 122;

export const $LBRACE = /*@ts2dart_const*/ 123;
export const $BAR = /*@ts2dart_const*/ 124;
export const $RBRACE = /*@ts2dart_const*/ 125;
const $NBSP = /*@ts2dart_const*/ 160;

export class ScannerError extends BaseException {
  constructor(public message: string) { super(); }

  toString(): string { return this.message; }
}

class _Scanner {
  length: number;
  peek: number = 0;
  index: number = -1;

  constructor(public input: string) {
    this.length = input.length;
    this.advance();
  }

  advance() {
    this.peek =
        ++this.index >= this.length ? $EOF : StringWrapper.charCodeAt(this.input, this.index);
  }

  scanToken(): Token {
    var input = this.input, length = this.length, peek = this.peek, index = this.index;

    // Skip whitespace.
    while (peek <= $SPACE) {
      if (++index >= length) {
        peek = $EOF;
        break;
      } else {
        peek = StringWrapper.charCodeAt(input, index);
      }
    }

    this.peek = peek;
    this.index = index;

    if (index >= length) {
      return null;
    }

    // Handle identifiers and numbers.
    if (isIdentifierStart(peek)) return this.scanIdentifier();
    if (isDigit(peek)) return this.scanNumber(index);

    var start: number = index;
    switch (peek) {
      case $PERIOD:
        this.advance();
        return isDigit(this.peek) ? this.scanNumber(start) : newCharacterToken(start, $PERIOD);
      case $LPAREN:
      case $RPAREN:
      case $LBRACE:
      case $RBRACE:
      case $LBRACKET:
      case $RBRACKET:
      case $COMMA:
      case $COLON:
      case $SEMICOLON:
        return this.scanCharacter(start, peek);
      case $SQ:
      case $DQ:
        return this.scanString();
      case $HASH:
      case $PLUS:
      case $MINUS:
      case $STAR:
      case $SLASH:
      case $PERCENT:
      case $CARET:
        return this.scanOperator(start, StringWrapper.fromCharCode(peek));
      case $QUESTION:
        return this.scanComplexOperator(start, '?', $PERIOD, '.');
      case $LT:
      case $GT:
        return this.scanComplexOperator(start, StringWrapper.fromCharCode(peek), $EQ, '=');
      case $BANG:
      case $EQ:
        return this.scanComplexOperator(
            start, StringWrapper.fromCharCode(peek), $EQ, '=', $EQ, '=');
      case $AMPERSAND:
        return this.scanComplexOperator(start, '&', $AMPERSAND, '&');
      case $BAR:
        return this.scanComplexOperator(start, '|', $BAR, '|');
      case $NBSP:
        while (isWhitespace(this.peek)) this.advance();
        return this.scanToken();
    }

    this.error(`Unexpected character [${StringWrapper.fromCharCode(peek)}]`, 0);
    return null;
  }

  scanCharacter(start: number, code: number): Token {
    this.advance();
    return newCharacterToken(start, code);
  }


  scanOperator(start: number, str: string): Token {
    this.advance();
    return newOperatorToken(start, str);
  }

  /**
   * Tokenize a 2/3 char long operator
   *
   * @param start start index in the expression
   * @param one first symbol (always part of the operator)
   * @param twoCode code point for the second symbol
   * @param two second symbol (part of the operator when the second code point matches)
   * @param threeCode code point for the third symbol
   * @param three third symbol (part of the operator when provided and matches source expression)
   * @returns {Token}
   */
  scanComplexOperator(
      start: number, one: string, twoCode: number, two: string, threeCode?: number,
      three?: string): Token {
    this.advance();
    var str: string = one;
    if (this.peek == twoCode) {
      this.advance();
      str += two;
    }
    if (isPresent(threeCode) && this.peek == threeCode) {
      this.advance();
      str += three;
    }
    return newOperatorToken(start, str);
  }

  scanIdentifier(): Token {
    var start: number = this.index;
    this.advance();
    while (isIdentifierPart(this.peek)) this.advance();
    var str: string = this.input.substring(start, this.index);
    if (SetWrapper.has(KEYWORDS, str)) {
      return newKeywordToken(start, str);
    } else {
      return newIdentifierToken(start, str);
    }
  }

  scanNumber(start: number): Token {
    var simple: boolean = (this.index === start);
    this.advance();  // Skip initial digit.
    while (true) {
      if (isDigit(this.peek)) {
        // Do nothing.
      } else if (this.peek == $PERIOD) {
        simple = false;
      } else if (isExponentStart(this.peek)) {
        this.advance();
        if (isExponentSign(this.peek)) this.advance();
        if (!isDigit(this.peek)) this.error('Invalid exponent', -1);
        simple = false;
      } else {
        break;
      }
      this.advance();
    }
    var str: string = this.input.substring(start, this.index);
    // TODO
    var value: number =
        simple ? NumberWrapper.parseIntAutoRadix(str) : NumberWrapper.parseFloat(str);
    return newNumberToken(start, value);
  }

  scanString(): Token {
    var start: number = this.index;
    var quote: number = this.peek;
    this.advance();  // Skip initial quote.

    var buffer: StringJoiner;
    var marker: number = this.index;
    var input: string = this.input;

    while (this.peek != quote) {
      if (this.peek == $BACKSLASH) {
        if (buffer == null) buffer = new StringJoiner();
        buffer.add(input.substring(marker, this.index));
        this.advance();
        var unescapedCode: number;
        if (this.peek == $u) {
          // 4 character hex code for unicode character.
          var hex: string = input.substring(this.index + 1, this.index + 5);
          try {
            unescapedCode = NumberWrapper.parseInt(hex, 16);
          } catch (e) {
            this.error(`Invalid unicode escape [\\u${hex}]`, 0);
          }
          for (var i: number = 0; i < 5; i++) {
            this.advance();
          }
        } else {
          unescapedCode = unescape(this.peek);
          this.advance();
        }
        buffer.add(StringWrapper.fromCharCode(unescapedCode));
        marker = this.index;
      } else if (this.peek == $EOF) {
        this.error('Unterminated quote', 0);
      } else {
        this.advance();
      }
    }

    var last: string = input.substring(marker, this.index);
    this.advance();  // Skip terminating quote.

    // Compute the unescaped string value.
    var unescaped: string = last;
    if (buffer != null) {
      buffer.add(last);
      unescaped = buffer.toString();
    }
    return newStringToken(start, unescaped);
  }

  error(message: string, offset: number) {
    var position: number = this.index + offset;
    throw new ScannerError(
        `Lexer Error: ${message} at column ${position} in expression [${this.input}]`);
  }
}

function isWhitespace(code: number): boolean {
  return (code >= $TAB && code <= $SPACE) || (code == $NBSP);
}

function isIdentifierStart(code: number): boolean {
  return ($a <= code && code <= $z) || ($A <= code && code <= $Z) || (code == $_) || (code == $$);
}

export function isIdentifier(input: string): boolean {
  if (input.length == 0) return false;
  var scanner = new _Scanner(input);
  if (!isIdentifierStart(scanner.peek)) return false;
  scanner.advance();
  while (scanner.peek !== $EOF) {
    if (!isIdentifierPart(scanner.peek)) return false;
    scanner.advance();
  }
  return true;
}

function isIdentifierPart(code: number): boolean {
  return ($a <= code && code <= $z) || ($A <= code && code <= $Z) || ($0 <= code && code <= $9) ||
      (code == $_) || (code == $$);
}

function isDigit(code: number): boolean {
  return $0 <= code && code <= $9;
}

function isExponentStart(code: number): boolean {
  return code == $e || code == $E;
}

function isExponentSign(code: number): boolean {
  return code == $MINUS || code == $PLUS;
}

export function isQuote(code: number): boolean {
  return code === $SQ || code === $DQ || code === $BT;
}

function unescape(code: number): number {
  switch (code) {
    case $n:
      return $LF;
    case $f:
      return $FF;
    case $r:
      return $CR;
    case $t:
      return $TAB;
    case $v:
      return $VTAB;
    default:
      return code;
  }
}

var OPERATORS = SetWrapper.createFromList([
  '+', '-',  '*',  '/',  '%',  '^', '=', '==', '!=', '===', '!==', '<',
  '>', '<=', '>=', '&&', '||', '&', '|', '!',  '?',  '#',   '?.'
]);


var KEYWORDS =
    SetWrapper.createFromList(['var', 'let', 'null', 'undefined', 'true', 'false', 'if', 'else']);

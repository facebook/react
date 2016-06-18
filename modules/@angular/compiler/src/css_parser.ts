import {$AT, $COLON, $COMMA, $EOF, $GT, $LBRACE, $LBRACKET, $LPAREN, $PLUS, $RBRACE, $RBRACKET, $RPAREN, $SEMICOLON, $SLASH, $SPACE, $TAB, $TILDA, CssLexerMode, CssScanner, CssScannerError, CssToken, CssTokenType, generateErrorMessage, isNewline, isWhitespace} from './css_lexer';
import {NumberWrapper, StringWrapper, isPresent} from './facade/lang';
import {ParseError, ParseLocation, ParseSourceFile, ParseSourceSpan} from './parse_util';

const SPACE_OPERATOR = ' ';

export {CssToken} from './css_lexer';

export enum BlockType {
  Import,
  Charset,
  Namespace,
  Supports,
  Keyframes,
  MediaQuery,
  Selector,
  FontFace,
  Page,
  Document,
  Viewport,
  Unsupported
}

const SLASH_CHARACTER = '/';
const GT_CHARACTER = '>';
const TRIPLE_GT_OPERATOR_STR = '>>>';
const DEEP_OPERATOR_STR = '/deep/';

const EOF_DELIM_FLAG = 1;
const RBRACE_DELIM_FLAG = 2;
const LBRACE_DELIM_FLAG = 4;
const COMMA_DELIM_FLAG = 8;
const COLON_DELIM_FLAG = 16;
const SEMICOLON_DELIM_FLAG = 32;
const NEWLINE_DELIM_FLAG = 64;
const RPAREN_DELIM_FLAG = 128;
const LPAREN_DELIM_FLAG = 256;
const SPACE_DELIM_FLAG = 512;

function _pseudoSelectorSupportsInnerSelectors(name: string): boolean {
  return ['not', 'host', 'host-context'].indexOf(name) >= 0;
}

function isSelectorOperatorCharacter(code: number): boolean {
  switch (code) {
    case $SLASH:
    case $TILDA:
    case $PLUS:
    case $GT:
      return true;
    default:
      return isWhitespace(code);
  }
}

function mergeTokens(tokens: CssToken[], separator: string = ''): CssToken {
  var mainToken = tokens[0];
  var str = mainToken.strValue;
  for (var i = 1; i < tokens.length; i++) {
    str += separator + tokens[i].strValue;
  }

  return new CssToken(mainToken.index, mainToken.column, mainToken.line, mainToken.type, str);
}

function getDelimFromToken(token: CssToken): number {
  return getDelimFromCharacter(token.numValue);
}

function getDelimFromCharacter(code: number): number {
  switch (code) {
    case $EOF:
      return EOF_DELIM_FLAG;
    case $COMMA:
      return COMMA_DELIM_FLAG;
    case $COLON:
      return COLON_DELIM_FLAG;
    case $SEMICOLON:
      return SEMICOLON_DELIM_FLAG;
    case $RBRACE:
      return RBRACE_DELIM_FLAG;
    case $LBRACE:
      return LBRACE_DELIM_FLAG;
    case $RPAREN:
      return RPAREN_DELIM_FLAG;
    case $SPACE:
    case $TAB:
      return SPACE_DELIM_FLAG;
    default:
      return isNewline(code) ? NEWLINE_DELIM_FLAG : 0;
  }
}

function characterContainsDelimiter(code: number, delimiters: number): boolean {
  return (getDelimFromCharacter(code) & delimiters) > 0;
}

export abstract class CssAst {
  constructor(public start: number, public end: number) {}
  abstract visit(visitor: CssAstVisitor, context?: any): any;
}

export interface CssAstVisitor {
  visitCssValue(ast: CssStyleValueAst, context?: any): any;
  visitCssInlineRule(ast: CssInlineRuleAst, context?: any): any;
  visitCssAtRulePredicate(ast: CssAtRulePredicateAst, context?: any): any;
  visitCssKeyframeRule(ast: CssKeyframeRuleAst, context?: any): any;
  visitCssKeyframeDefinition(ast: CssKeyframeDefinitionAst, context?: any): any;
  visitCssMediaQueryRule(ast: CssMediaQueryRuleAst, context?: any): any;
  visitCssSelectorRule(ast: CssSelectorRuleAst, context?: any): any;
  visitCssSelector(ast: CssSelectorAst, context?: any): any;
  visitCssSimpleSelector(ast: CssSimpleSelectorAst, context?: any): any;
  visitCssPseudoSelector(ast: CssPseudoSelectorAst, context?: any): any;
  visitCssDefinition(ast: CssDefinitionAst, context?: any): any;
  visitCssBlock(ast: CssBlockAst, context?: any): any;
  visitCssStylesBlock(ast: CssStylesBlockAst, context?: any): any;
  visitCssStyleSheet(ast: CssStyleSheetAst, context?: any): any;
  visitCssUnknownRule(ast: CssUnknownRuleAst, context?: any): any;
  visitCssUnknownTokenList(ast: CssUnknownTokenListAst, context?: any): any;
}

export class ParsedCssResult {
  constructor(public errors: CssParseError[], public ast: CssStyleSheetAst) {}
}

export class CssParser {
  private _errors: CssParseError[] = [];
  private _file: ParseSourceFile;

  constructor(private _scanner: CssScanner, private _fileName: string) {
    this._file = new ParseSourceFile(this._scanner.input, _fileName);
  }

  /** @internal */
  _resolveBlockType(token: CssToken): BlockType {
    switch (token.strValue) {
      case '@-o-keyframes':
      case '@-moz-keyframes':
      case '@-webkit-keyframes':
      case '@keyframes':
        return BlockType.Keyframes;

      case '@charset':
        return BlockType.Charset;

      case '@import':
        return BlockType.Import;

      case '@namespace':
        return BlockType.Namespace;

      case '@page':
        return BlockType.Page;

      case '@document':
        return BlockType.Document;

      case '@media':
        return BlockType.MediaQuery;

      case '@font-face':
        return BlockType.FontFace;

      case '@viewport':
        return BlockType.Viewport;

      case '@supports':
        return BlockType.Supports;

      default:
        return BlockType.Unsupported;
    }
  }

  parse(): ParsedCssResult {
    var delimiters: number = EOF_DELIM_FLAG;
    var ast = this._parseStyleSheet(delimiters);

    var errors = this._errors;
    this._errors = [];

    return new ParsedCssResult(errors, ast);
  }

  /** @internal */
  _parseStyleSheet(delimiters: number): CssStyleSheetAst {
    const start = this._getScannerIndex();
    var results: any[] /** TODO #9100 */ = [];
    this._scanner.consumeEmptyStatements();
    while (this._scanner.peek != $EOF) {
      this._scanner.setMode(CssLexerMode.BLOCK);
      results.push(this._parseRule(delimiters));
    }
    const end = this._getScannerIndex() - 1;
    return new CssStyleSheetAst(start, end, results);
  }

  /** @internal */
  _parseRule(delimiters: number): CssRuleAst {
    if (this._scanner.peek == $AT) {
      return this._parseAtRule(delimiters);
    }
    return this._parseSelectorRule(delimiters);
  }

  /** @internal */
  _parseAtRule(delimiters: number): CssRuleAst {
    const start = this._getScannerIndex();
    var end: number;

    this._scanner.setMode(CssLexerMode.BLOCK);
    var token = this._scan();

    this._assertCondition(
        token.type == CssTokenType.AtKeyword,
        `The CSS Rule ${token.strValue} is not a valid [@] rule.`, token);

    var block: CssBlockAst;
    var type = this._resolveBlockType(token);
    switch (type) {
      case BlockType.Charset:
      case BlockType.Namespace:
      case BlockType.Import:
        var value = this._parseValue(delimiters);
        this._scanner.setMode(CssLexerMode.BLOCK);
        end = value.end;
        this._scanner.consumeEmptyStatements();
        return new CssInlineRuleAst(start, end, type, value);

      case BlockType.Viewport:
      case BlockType.FontFace:
        block = this._parseStyleBlock(delimiters);
        end = this._getScannerIndex() - 1;
        return new CssBlockRuleAst(start, end, type, block);

      case BlockType.Keyframes:
        var tokens = this._collectUntilDelim(delimiters | RBRACE_DELIM_FLAG | LBRACE_DELIM_FLAG);
        // keyframes only have one identifier name
        var name = tokens[0];
        end = this._getScannerIndex() - 1;
        return new CssKeyframeRuleAst(start, end, name, this._parseKeyframeBlock(delimiters));

      case BlockType.MediaQuery:
        this._scanner.setMode(CssLexerMode.MEDIA_QUERY);
        var tokens = this._collectUntilDelim(delimiters | RBRACE_DELIM_FLAG | LBRACE_DELIM_FLAG);
        end = this._getScannerIndex() - 1;
        var strValue = this._scanner.input.substring(start, end);
        var query = new CssAtRulePredicateAst(start, end, strValue, tokens);
        block = this._parseBlock(delimiters);
        end = this._getScannerIndex() - 1;
        strValue = this._scanner.input.substring(start, end);
        return new CssMediaQueryRuleAst(start, end, strValue, query, block);

      case BlockType.Document:
      case BlockType.Supports:
      case BlockType.Page:
        this._scanner.setMode(CssLexerMode.AT_RULE_QUERY);
        var tokens = this._collectUntilDelim(delimiters | RBRACE_DELIM_FLAG | LBRACE_DELIM_FLAG);
        end = this._getScannerIndex() - 1;
        var strValue = this._scanner.input.substring(start, end);
        var query = new CssAtRulePredicateAst(start, end, strValue, tokens);
        block = this._parseBlock(delimiters);
        end = this._getScannerIndex() - 1;
        strValue = this._scanner.input.substring(start, end);
        return new CssBlockDefinitionRuleAst(start, end, strValue, type, query, block);

      // if a custom @rule { ... } is used it should still tokenize the insides
      default:
        var listOfTokens: CssToken[] = [];
        var tokenName = token.strValue;
        this._scanner.setMode(CssLexerMode.ALL);
        this._error(
            generateErrorMessage(
                this._scanner.input, `The CSS "at" rule "${tokenName}" is not allowed to used here`,
                token.strValue, token.index, token.line, token.column),
            token);

        this._collectUntilDelim(delimiters | LBRACE_DELIM_FLAG | SEMICOLON_DELIM_FLAG)
            .forEach((token) => { listOfTokens.push(token); });
        if (this._scanner.peek == $LBRACE) {
          listOfTokens.push(this._consume(CssTokenType.Character, '{'));
          this._collectUntilDelim(delimiters | RBRACE_DELIM_FLAG | LBRACE_DELIM_FLAG)
              .forEach((token) => { listOfTokens.push(token); });
          listOfTokens.push(this._consume(CssTokenType.Character, '}'));
        }
        end = this._getScannerIndex() - 1;
        return new CssUnknownRuleAst(start, end, tokenName, listOfTokens);
    }
  }

  /** @internal */
  _parseSelectorRule(delimiters: number): CssRuleAst {
    const start = this._getScannerIndex();
    var selectors = this._parseSelectors(delimiters);
    var block = this._parseStyleBlock(delimiters);
    const end = this._getScannerIndex() - 1;
    var token: CssRuleAst;
    if (isPresent(block)) {
      token = new CssSelectorRuleAst(start, end, selectors, block);
    } else {
      var name = this._scanner.input.substring(start, end);
      var innerTokens: CssToken[] = [];
      selectors.forEach((selector: CssSelectorAst) => {
        selector.selectorParts.forEach((part: CssSimpleSelectorAst) => {
          part.tokens.forEach((token: CssToken) => { innerTokens.push(token); });
        });
      });
      token = new CssUnknownTokenListAst(start, end, name, innerTokens);
    }
    this._scanner.setMode(CssLexerMode.BLOCK);
    this._scanner.consumeEmptyStatements();
    return token;
  }

  /** @internal */
  _parseSelectors(delimiters: number): CssSelectorAst[] {
    delimiters |= LBRACE_DELIM_FLAG | SEMICOLON_DELIM_FLAG;

    var selectors: any[] /** TODO #9100 */ = [];
    var isParsingSelectors = true;
    while (isParsingSelectors) {
      selectors.push(this._parseSelector(delimiters));

      isParsingSelectors = !characterContainsDelimiter(this._scanner.peek, delimiters);

      if (isParsingSelectors) {
        this._consume(CssTokenType.Character, ',');
        isParsingSelectors = !characterContainsDelimiter(this._scanner.peek, delimiters);
        if (isParsingSelectors) {
          this._scanner.consumeWhitespace();
        }
      }
    }

    return selectors;
  }

  /** @internal */
  _scan(): CssToken {
    var output = this._scanner.scan();
    var token = output.token;
    var error = output.error;
    if (isPresent(error)) {
      this._error(error.rawMessage, token);
    }
    return token;
  }

  /** @internal */
  _getScannerIndex(): number { return this._scanner.index; }

  /** @internal */
  _consume(type: CssTokenType, value: string = null): CssToken {
    var output = this._scanner.consume(type, value);
    var token = output.token;
    var error = output.error;
    if (isPresent(error)) {
      this._error(error.rawMessage, token);
    }
    return token;
  }

  /** @internal */
  _parseKeyframeBlock(delimiters: number): CssBlockAst {
    const start = this._getScannerIndex();

    delimiters |= RBRACE_DELIM_FLAG;
    this._scanner.setMode(CssLexerMode.KEYFRAME_BLOCK);

    this._consume(CssTokenType.Character, '{');

    var definitions: any[] /** TODO #9100 */ = [];
    while (!characterContainsDelimiter(this._scanner.peek, delimiters)) {
      definitions.push(this._parseKeyframeDefinition(delimiters));
    }

    this._consume(CssTokenType.Character, '}');

    const end = this._getScannerIndex() - 1;
    return new CssBlockAst(start, end, definitions);
  }

  /** @internal */
  _parseKeyframeDefinition(delimiters: number): CssKeyframeDefinitionAst {
    const start = this._getScannerIndex();
    var stepTokens: any[] /** TODO #9100 */ = [];
    delimiters |= LBRACE_DELIM_FLAG;
    while (!characterContainsDelimiter(this._scanner.peek, delimiters)) {
      stepTokens.push(this._parseKeyframeLabel(delimiters | COMMA_DELIM_FLAG));
      if (this._scanner.peek != $LBRACE) {
        this._consume(CssTokenType.Character, ',');
      }
    }
    var styles = this._parseStyleBlock(delimiters | RBRACE_DELIM_FLAG);
    this._scanner.setMode(CssLexerMode.BLOCK);
    const end = this._getScannerIndex() - 1;
    return new CssKeyframeDefinitionAst(start, end, stepTokens, styles);
  }

  /** @internal */
  _parseKeyframeLabel(delimiters: number): CssToken {
    this._scanner.setMode(CssLexerMode.KEYFRAME_BLOCK);
    return mergeTokens(this._collectUntilDelim(delimiters));
  }

  /** @internal */
  _parsePseudoSelector(delimiters: number): CssPseudoSelectorAst {
    const start = this._getScannerIndex();

    delimiters &= ~COMMA_DELIM_FLAG;

    // we keep the original value since we may use it to recurse when :not, :host are used
    var startingDelims = delimiters;

    var startToken = this._consume(CssTokenType.Character, ':');
    var tokens = [startToken];

    if (this._scanner.peek == $COLON) {  // ::something
      startToken = this._consume(CssTokenType.Character, ':');
      tokens.push(startToken);
    }

    var innerSelectors: CssSelectorAst[] = [];

    this._scanner.setMode(CssLexerMode.PSEUDO_SELECTOR);

    // host, host-context, lang, not, nth-child are all identifiers
    var pseudoSelectorToken = this._consume(CssTokenType.Identifier);
    var pseudoSelectorName = pseudoSelectorToken.strValue;
    tokens.push(pseudoSelectorToken);

    // host(), lang(), nth-child(), etc...
    if (this._scanner.peek == $LPAREN) {
      this._scanner.setMode(CssLexerMode.PSEUDO_SELECTOR_WITH_ARGUMENTS);

      var openParenToken = this._consume(CssTokenType.Character, '(');
      tokens.push(openParenToken);

      // :host(innerSelector(s)), :not(selector), etc...
      if (_pseudoSelectorSupportsInnerSelectors(pseudoSelectorName)) {
        var innerDelims = startingDelims | LPAREN_DELIM_FLAG | RPAREN_DELIM_FLAG;
        if (pseudoSelectorName == 'not') {
          // the inner selector inside of :not(...) can only be one
          // CSS selector (no commas allowed) ... This is according
          // to the CSS specification
          innerDelims |= COMMA_DELIM_FLAG;
        }

        // :host(a, b, c) {
        this._parseSelectors(innerDelims).forEach((selector, index) => {
          innerSelectors.push(selector);
        });
      } else {
        // this branch is for things like "en-us, 2k + 1, etc..."
        // which all end up in pseudoSelectors like :lang, :nth-child, etc..
        var innerValueDelims = delimiters | LBRACE_DELIM_FLAG | COLON_DELIM_FLAG |
            RPAREN_DELIM_FLAG | LPAREN_DELIM_FLAG;
        while (!characterContainsDelimiter(this._scanner.peek, innerValueDelims)) {
          var token = this._scan();
          tokens.push(token);
        }
      }

      var closeParenToken = this._consume(CssTokenType.Character, ')');
      tokens.push(closeParenToken);
    }

    const end = this._getScannerIndex() - 1;
    var strValue = this._scanner.input.substring(start, end);
    return new CssPseudoSelectorAst(
        start, end, strValue, pseudoSelectorName, tokens, innerSelectors);
  }

  /** @internal */
  _parseSimpleSelector(delimiters: number): CssSimpleSelectorAst {
    const start = this._getScannerIndex();

    delimiters |= COMMA_DELIM_FLAG;

    this._scanner.setMode(CssLexerMode.SELECTOR);
    var selectorCssTokens: CssToken[] = [];
    var pseudoSelectors: CssPseudoSelectorAst[] = [];

    var previousToken: CssToken;

    var selectorPartDelimiters = delimiters | SPACE_DELIM_FLAG;
    var loopOverSelector = !characterContainsDelimiter(this._scanner.peek, selectorPartDelimiters);

    var hasAttributeError = false;
    while (loopOverSelector) {
      var peek = this._scanner.peek;

      switch (peek) {
        case $COLON:
          var innerPseudo = this._parsePseudoSelector(delimiters);
          pseudoSelectors.push(innerPseudo);
          this._scanner.setMode(CssLexerMode.SELECTOR);
          break;

        case $LBRACKET:
          // we set the mode after the scan because attribute mode does not
          // allow attribute [] values. And this also will catch any errors
          // if an extra "[" is used inside.
          selectorCssTokens.push(this._scan());
          this._scanner.setMode(CssLexerMode.ATTRIBUTE_SELECTOR);
          break;

        case $RBRACKET:
          if (this._scanner.getMode() != CssLexerMode.ATTRIBUTE_SELECTOR) {
            hasAttributeError = true;
          }
          // we set the mode early because attribute mode does not
          // allow attribute [] values
          this._scanner.setMode(CssLexerMode.SELECTOR);
          selectorCssTokens.push(this._scan());
          break;

        default:
          if (isSelectorOperatorCharacter(peek)) {
            loopOverSelector = false;
            continue;
          }

          var token = this._scan();
          previousToken = token;
          selectorCssTokens.push(token);
          break;
      }

      loopOverSelector = !characterContainsDelimiter(this._scanner.peek, selectorPartDelimiters);
    }

    hasAttributeError =
        hasAttributeError || this._scanner.getMode() == CssLexerMode.ATTRIBUTE_SELECTOR;
    if (hasAttributeError) {
      this._error(
          `Unbalanced CSS attribute selector at column ${previousToken.line}:${previousToken.column}`,
          previousToken);
    }

    var end = this._getScannerIndex();
    if (characterContainsDelimiter(this._scanner.peek, delimiters)) {
      // this happens if the selector is followed by a comma or curly
      // brace without a space in between
      end--;
    } else {
      var operator: CssToken = null;
      var operatorScanCount = 0;
      var lastOperatorToken: CssToken = null;
      while (operator == null && !characterContainsDelimiter(this._scanner.peek, delimiters) &&
             isSelectorOperatorCharacter(this._scanner.peek)) {
        var token = this._scan();
        var tokenOperator = token.strValue;
        operatorScanCount++;
        lastOperatorToken = token;
        if (tokenOperator != SPACE_OPERATOR) {
          switch (tokenOperator) {
            case SLASH_CHARACTER:
              // /deep/ operator
              let deepToken = this._consume(CssTokenType.Identifier);
              let deepSlash = this._consume(CssTokenType.Character);
              let index = lastOperatorToken.index;
              let line = lastOperatorToken.line;
              let column = lastOperatorToken.column;
              if (isPresent(deepToken) && deepToken.strValue.toLowerCase() == 'deep' &&
                  deepSlash.strValue == SLASH_CHARACTER) {
                token = new CssToken(
                    lastOperatorToken.index, lastOperatorToken.column, lastOperatorToken.line,
                    CssTokenType.Identifier, DEEP_OPERATOR_STR);
              } else {
                let text = SLASH_CHARACTER + deepToken.strValue + deepSlash.strValue;
                this._error(
                    generateErrorMessage(
                        this._scanner.input, `${text} is an invalid CSS operator`, text, index,
                        line, column),
                    lastOperatorToken);
                token = new CssToken(index, column, line, CssTokenType.Invalid, text);
              }
              break;

            case GT_CHARACTER:
              // >>> operator
              if (this._scanner.peek == $GT && this._scanner.peekPeek == $GT) {
                this._consume(CssTokenType.Character, GT_CHARACTER);
                this._consume(CssTokenType.Character, GT_CHARACTER);
                token = new CssToken(
                    lastOperatorToken.index, lastOperatorToken.column, lastOperatorToken.line,
                    CssTokenType.Identifier, TRIPLE_GT_OPERATOR_STR);
              }
              break;
          }

          operator = token;
          end = this._getScannerIndex() - 1;
        }
      }
    }

    this._scanner.consumeWhitespace();

    // if we do come across one or more spaces inside of
    // the operators loop then an empty space is still a
    // valid operator to use if something else was not found
    if (operator == null && operatorScanCount > 0 && this._scanner.peek != $LBRACE) {
      operator = lastOperatorToken;
    }

    var strValue = this._scanner.input.substring(start, end);
    return new CssSimpleSelectorAst(
        start, end, selectorCssTokens, strValue, pseudoSelectors, operator);
  }

  /** @internal */
  _parseSelector(delimiters: number): CssSelectorAst {
    const start = this._getScannerIndex();

    delimiters |= COMMA_DELIM_FLAG;
    this._scanner.setMode(CssLexerMode.SELECTOR);

    var simpleSelectors: CssSimpleSelectorAst[] = [];
    var end = this._getScannerIndex() - 1;
    while (!characterContainsDelimiter(this._scanner.peek, delimiters)) {
      simpleSelectors.push(this._parseSimpleSelector(delimiters));
      this._scanner.consumeWhitespace();
    }

    // we do this to avoid any trailing whitespace that is processed
    // in order to determine the final operator value
    var limit = simpleSelectors.length - 1;
    if (limit >= 0) {
      end = simpleSelectors[limit].end;
    }

    return new CssSelectorAst(start, end, simpleSelectors);
  }

  /** @internal */
  _parseValue(delimiters: number): CssStyleValueAst {
    delimiters |= RBRACE_DELIM_FLAG | SEMICOLON_DELIM_FLAG | NEWLINE_DELIM_FLAG;

    this._scanner.setMode(CssLexerMode.STYLE_VALUE);
    const start = this._getScannerIndex();

    var tokens: CssToken[] = [];
    var wsStr = '';
    var previous: CssToken;
    while (!characterContainsDelimiter(this._scanner.peek, delimiters)) {
      var token: CssToken;
      if (isPresent(previous) && previous.type == CssTokenType.Identifier &&
          this._scanner.peek == $LPAREN) {
        token = this._consume(CssTokenType.Character, '(');
        tokens.push(token);

        this._scanner.setMode(CssLexerMode.STYLE_VALUE_FUNCTION);

        token = this._scan();
        tokens.push(token);

        this._scanner.setMode(CssLexerMode.STYLE_VALUE);

        token = this._consume(CssTokenType.Character, ')');
        tokens.push(token);
      } else {
        token = this._scan();
        if (token.type == CssTokenType.Whitespace) {
          wsStr += token.strValue;
        } else {
          wsStr = '';
          tokens.push(token);
        }
      }
      previous = token;
    }

    const end = this._getScannerIndex() - 1;
    this._scanner.consumeWhitespace();

    var code = this._scanner.peek;
    if (code == $SEMICOLON) {
      this._consume(CssTokenType.Character, ';');
    } else if (code != $RBRACE) {
      this._error(
          generateErrorMessage(
              this._scanner.input, `The CSS key/value definition did not end with a semicolon`,
              previous.strValue, previous.index, previous.line, previous.column),
          previous);
    }

    var strValue = this._scanner.input.substring(start, end);
    return new CssStyleValueAst(start, end, tokens, strValue);
  }

  /** @internal */
  _collectUntilDelim(delimiters: number, assertType: CssTokenType = null): CssToken[] {
    var tokens: any[] /** TODO #9100 */ = [];
    while (!characterContainsDelimiter(this._scanner.peek, delimiters)) {
      var val = isPresent(assertType) ? this._consume(assertType) : this._scan();
      tokens.push(val);
    }
    return tokens;
  }

  /** @internal */
  _parseBlock(delimiters: number): CssBlockAst {
    const start = this._getScannerIndex();

    delimiters |= RBRACE_DELIM_FLAG;

    this._scanner.setMode(CssLexerMode.BLOCK);

    this._consume(CssTokenType.Character, '{');
    this._scanner.consumeEmptyStatements();

    var results: any[] /** TODO #9100 */ = [];
    while (!characterContainsDelimiter(this._scanner.peek, delimiters)) {
      results.push(this._parseRule(delimiters));
    }

    this._consume(CssTokenType.Character, '}');

    this._scanner.setMode(CssLexerMode.BLOCK);
    this._scanner.consumeEmptyStatements();

    const end = this._getScannerIndex() - 1;
    return new CssBlockAst(start, end, results);
  }

  /** @internal */
  _parseStyleBlock(delimiters: number): CssStylesBlockAst {
    const start = this._getScannerIndex();

    delimiters |= RBRACE_DELIM_FLAG | LBRACE_DELIM_FLAG;

    this._scanner.setMode(CssLexerMode.STYLE_BLOCK);

    var result = this._consume(CssTokenType.Character, '{');
    if (result.numValue != $LBRACE) {
      return null;
    }

    var definitions: CssDefinitionAst[] = [];
    this._scanner.consumeEmptyStatements();

    while (!characterContainsDelimiter(this._scanner.peek, delimiters)) {
      definitions.push(this._parseDefinition(delimiters));
      this._scanner.consumeEmptyStatements();
    }

    this._consume(CssTokenType.Character, '}');

    this._scanner.setMode(CssLexerMode.STYLE_BLOCK);
    this._scanner.consumeEmptyStatements();

    const end = this._getScannerIndex() - 1;
    return new CssStylesBlockAst(start, end, definitions);
  }

  /** @internal */
  _parseDefinition(delimiters: number): CssDefinitionAst {
    const start = this._getScannerIndex();
    this._scanner.setMode(CssLexerMode.STYLE_BLOCK);

    var prop = this._consume(CssTokenType.Identifier);
    var parseValue: any /** TODO #9100 */, value: any /** TODO #9100 */ = null;

    // the colon value separates the prop from the style.
    // there are a few cases as to what could happen if it
    // is missing
    switch (this._scanner.peek) {
      case $COLON:
        this._consume(CssTokenType.Character, ':');
        parseValue = true;
        break;

      case $SEMICOLON:
      case $RBRACE:
      case $EOF:
        parseValue = false;
        break;

      default:
        var propStr = [prop.strValue];
        if (this._scanner.peek != $COLON) {
          // this will throw the error
          var nextValue = this._consume(CssTokenType.Character, ':');
          propStr.push(nextValue.strValue);

          var remainingTokens = this._collectUntilDelim(
              delimiters | COLON_DELIM_FLAG | SEMICOLON_DELIM_FLAG, CssTokenType.Identifier);
          if (remainingTokens.length > 0) {
            remainingTokens.forEach((token) => { propStr.push(token.strValue); });
          }

          prop = new CssToken(prop.index, prop.column, prop.line, prop.type, propStr.join(' '));
        }

        // this means we've reached the end of the definition and/or block
        if (this._scanner.peek == $COLON) {
          this._consume(CssTokenType.Character, ':');
          parseValue = true;
        } else {
          parseValue = false;
        }
        break;
    }

    if (parseValue) {
      value = this._parseValue(delimiters);
    } else {
      this._error(
          generateErrorMessage(
              this._scanner.input, `The CSS property was not paired with a style value`,
              prop.strValue, prop.index, prop.line, prop.column),
          prop);
    }

    const end = this._getScannerIndex() - 1;
    return new CssDefinitionAst(start, end, prop, value);
  }

  /** @internal */
  _assertCondition(status: boolean, errorMessage: string, problemToken: CssToken): boolean {
    if (!status) {
      this._error(errorMessage, problemToken);
      return true;
    }
    return false;
  }

  /** @internal */
  _error(message: string, problemToken: CssToken) {
    var length = problemToken.strValue.length;
    var error = CssParseError.create(
        this._file, 0, problemToken.line, problemToken.column, length, message);
    this._errors.push(error);
  }
}

export class CssStyleValueAst extends CssAst {
  constructor(start: number, end: number, public tokens: CssToken[], public strValue: string) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any { return visitor.visitCssValue(this); }
}

export abstract class CssRuleAst extends CssAst {
  constructor(start: number, end: number) { super(start, end); }
}

export class CssBlockRuleAst extends CssRuleAst {
  constructor(
      start: number, end: number, public type: BlockType, public block: CssBlockAst,
      public name: CssToken = null) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssBlock(this.block, context);
  }
}

export class CssKeyframeRuleAst extends CssBlockRuleAst {
  constructor(start: number, end: number, name: CssToken, block: CssBlockAst) {
    super(start, end, BlockType.Keyframes, block, name);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssKeyframeRule(this, context);
  }
}

export class CssKeyframeDefinitionAst extends CssBlockRuleAst {
  public steps: CssToken[];
  constructor(start: number, end: number, _steps: CssToken[], block: CssBlockAst) {
    super(start, end, BlockType.Keyframes, block, mergeTokens(_steps, ','));
    this.steps = _steps;
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssKeyframeDefinition(this, context);
  }
}

export class CssBlockDefinitionRuleAst extends CssBlockRuleAst {
  constructor(
      start: number, end: number, public strValue: string, type: BlockType,
      public query: CssAtRulePredicateAst, block: CssBlockAst) {
    super(start, end, type, block);
    var firstCssToken: CssToken = query.tokens[0];
    this.name = new CssToken(
        firstCssToken.index, firstCssToken.column, firstCssToken.line, CssTokenType.Identifier,
        this.strValue);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssBlock(this.block, context);
  }
}

export class CssMediaQueryRuleAst extends CssBlockDefinitionRuleAst {
  constructor(
      start: number, end: number, strValue: string, query: CssAtRulePredicateAst,
      block: CssBlockAst) {
    super(start, end, strValue, BlockType.MediaQuery, query, block);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssMediaQueryRule(this, context);
  }
}

export class CssAtRulePredicateAst extends CssAst {
  constructor(start: number, end: number, public strValue: string, public tokens: CssToken[]) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssAtRulePredicate(this, context);
  }
}

export class CssInlineRuleAst extends CssRuleAst {
  constructor(start: number, end: number, public type: BlockType, public value: CssStyleValueAst) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssInlineRule(this, context);
  }
}

export class CssSelectorRuleAst extends CssBlockRuleAst {
  public strValue: string;

  constructor(start: number, end: number, public selectors: CssSelectorAst[], block: CssBlockAst) {
    super(start, end, BlockType.Selector, block);
    this.strValue = selectors.map(selector => selector.strValue).join(',');
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssSelectorRule(this, context);
  }
}

export class CssDefinitionAst extends CssAst {
  constructor(
      start: number, end: number, public property: CssToken, public value: CssStyleValueAst) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssDefinition(this, context);
  }
}

export abstract class CssSelectorPartAst extends CssAst {
  constructor(start: number, end: number) { super(start, end); }
}

export class CssSelectorAst extends CssSelectorPartAst {
  public strValue: string;
  constructor(start: number, end: number, public selectorParts: CssSimpleSelectorAst[]) {
    super(start, end);
    this.strValue = selectorParts.map(part => part.strValue).join('');
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssSelector(this, context);
  }
}

export class CssSimpleSelectorAst extends CssSelectorPartAst {
  public selectorStrValue: string;

  constructor(
      start: number, end: number, public tokens: CssToken[], public strValue: string,
      public pseudoSelectors: CssPseudoSelectorAst[], public operator: CssToken) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssSimpleSelector(this, context);
  }
}

export class CssPseudoSelectorAst extends CssSelectorPartAst {
  constructor(
      start: number, end: number, public strValue: string, public name: string,
      public tokens: CssToken[], public innerSelectors: CssSelectorAst[]) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssPseudoSelector(this, context);
  }
}

export class CssBlockAst extends CssAst {
  constructor(start: number, end: number, public entries: CssAst[]) { super(start, end); }
  visit(visitor: CssAstVisitor, context?: any): any { return visitor.visitCssBlock(this, context); }
}

/*
  a style block is different from a standard block because it contains
  css prop:value definitions. A regular block can contain a list of Ast entries.
 */
export class CssStylesBlockAst extends CssBlockAst {
  constructor(start: number, end: number, public definitions: CssDefinitionAst[]) {
    super(start, end, definitions);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssStylesBlock(this, context);
  }
}

export class CssStyleSheetAst extends CssAst {
  constructor(start: number, end: number, public rules: CssAst[]) { super(start, end); }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssStyleSheet(this, context);
  }
}

export class CssParseError extends ParseError {
  static create(
      file: ParseSourceFile, offset: number, line: number, col: number, length: number,
      errMsg: string): CssParseError {
    var start = new ParseLocation(file, offset, line, col);
    const end = new ParseLocation(file, offset, line, col + length);
    var span = new ParseSourceSpan(start, end);
    return new CssParseError(span, 'CSS Parse Error: ' + errMsg);
  }

  constructor(span: ParseSourceSpan, message: string) { super(span, message); }
}

export class CssUnknownRuleAst extends CssRuleAst {
  constructor(start: number, end: number, public ruleName: string, public tokens: CssToken[]) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssUnknownRule(this, context);
  }
}

export class CssUnknownTokenListAst extends CssRuleAst {
  constructor(start: number, end: number, public name: string, public tokens: CssToken[]) {
    super(start, end);
  }
  visit(visitor: CssAstVisitor, context?: any): any {
    return visitor.visitCssUnknownTokenList(this, context);
  }
}

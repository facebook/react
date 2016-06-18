import {afterEach, beforeEach, ddescribe, describe, expect, iit, it, xit} from '../../core/testing/testing_internal';
import {CssLexer, CssLexerMode, CssScannerError, CssToken, CssTokenType} from '../src/css_lexer';
import {isPresent} from '../src/facade/lang';

export function main() {
  function tokenize(
      code: any /** TODO #9100 */, trackComments: boolean = false,
      mode: CssLexerMode = CssLexerMode.ALL): CssToken[] {
    var scanner = new CssLexer().scan(code, trackComments);
    scanner.setMode(mode);

    var tokens: any[] /** TODO #9100 */ = [];
    var output = scanner.scan();
    while (output != null) {
      var error = output.error;
      if (isPresent(error)) {
        throw new CssScannerError(error.token, error.rawMessage);
      }
      tokens.push(output.token);
      output = scanner.scan();
    }

    return tokens;
  }

  describe('CssLexer', () => {
    it('should lex newline characters as whitespace when whitespace mode is on', () => {
      var newlines = ['\n', '\r\n', '\r', '\f'];
      newlines.forEach((line) => {
        var token = tokenize(line, false, CssLexerMode.ALL_TRACK_WS)[0];
        expect(token.type).toEqual(CssTokenType.Whitespace);
      });
    });

    it('should combined newline characters as one newline token when whitespace mode is on', () => {
      var newlines = ['\n', '\r\n', '\r', '\f'].join('');
      var tokens = tokenize(newlines, false, CssLexerMode.ALL_TRACK_WS);
      expect(tokens.length).toEqual(1);
      expect(tokens[0].type).toEqual(CssTokenType.Whitespace);
    });

    it('should not consider whitespace or newline values at all when whitespace mode is off',
       () => {
         var newlines = ['\n', '\r\n', '\r', '\f'].join('');
         var tokens = tokenize(newlines);
         expect(tokens.length).toEqual(0);
       });

    it('should lex simple selectors and their inner properties', () => {
      var cssCode = '\n' +
          '  .selector { my-prop: my-value; }\n';
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Character);
      expect(tokens[0].strValue).toEqual('.');

      expect(tokens[1].type).toEqual(CssTokenType.Identifier);
      expect(tokens[1].strValue).toEqual('selector');

      expect(tokens[2].type).toEqual(CssTokenType.Character);
      expect(tokens[2].strValue).toEqual('{');

      expect(tokens[3].type).toEqual(CssTokenType.Identifier);
      expect(tokens[3].strValue).toEqual('my-prop');

      expect(tokens[4].type).toEqual(CssTokenType.Character);
      expect(tokens[4].strValue).toEqual(':');

      expect(tokens[5].type).toEqual(CssTokenType.Identifier);
      expect(tokens[5].strValue).toEqual('my-value');

      expect(tokens[6].type).toEqual(CssTokenType.Character);
      expect(tokens[6].strValue).toEqual(';');

      expect(tokens[7].type).toEqual(CssTokenType.Character);
      expect(tokens[7].strValue).toEqual('}');
    });

    it('should capture the column and line values for each token', () => {
      var cssCode = '#id {\n' +
          '  prop:value;\n' +
          '}';

      var tokens = tokenize(cssCode);

      // #
      expect(tokens[0].type).toEqual(CssTokenType.Character);
      expect(tokens[0].column).toEqual(0);
      expect(tokens[0].line).toEqual(0);

      // id
      expect(tokens[1].type).toEqual(CssTokenType.Identifier);
      expect(tokens[1].column).toEqual(1);
      expect(tokens[1].line).toEqual(0);

      // {
      expect(tokens[2].type).toEqual(CssTokenType.Character);
      expect(tokens[2].column).toEqual(4);
      expect(tokens[2].line).toEqual(0);

      // prop
      expect(tokens[3].type).toEqual(CssTokenType.Identifier);
      expect(tokens[3].column).toEqual(2);
      expect(tokens[3].line).toEqual(1);

      // :
      expect(tokens[4].type).toEqual(CssTokenType.Character);
      expect(tokens[4].column).toEqual(6);
      expect(tokens[4].line).toEqual(1);

      // value
      expect(tokens[5].type).toEqual(CssTokenType.Identifier);
      expect(tokens[5].column).toEqual(7);
      expect(tokens[5].line).toEqual(1);

      // ;
      expect(tokens[6].type).toEqual(CssTokenType.Character);
      expect(tokens[6].column).toEqual(12);
      expect(tokens[6].line).toEqual(1);

      // }
      expect(tokens[7].type).toEqual(CssTokenType.Character);
      expect(tokens[7].column).toEqual(0);
      expect(tokens[7].line).toEqual(2);
    });

    it('should lex quoted strings and escape accordingly', () => {
      var cssCode = 'prop: \'some { value } \\\' that is quoted\'';
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Identifier);
      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[2].type).toEqual(CssTokenType.String);
      expect(tokens[2].strValue).toEqual('\'some { value } \\\' that is quoted\'');
    });

    it('should treat attribute operators as regular characters', () => {
      tokenize('^|~+*').forEach((token) => { expect(token.type).toEqual(CssTokenType.Character); });
    });

    it('should lex numbers properly and set them as numbers', () => {
      var cssCode = '0 1 -2 3.0 -4.001';
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Number);
      expect(tokens[0].strValue).toEqual('0');

      expect(tokens[1].type).toEqual(CssTokenType.Number);
      expect(tokens[1].strValue).toEqual('1');

      expect(tokens[2].type).toEqual(CssTokenType.Number);
      expect(tokens[2].strValue).toEqual('-2');

      expect(tokens[3].type).toEqual(CssTokenType.Number);
      expect(tokens[3].strValue).toEqual('3.0');

      expect(tokens[4].type).toEqual(CssTokenType.Number);
      expect(tokens[4].strValue).toEqual('-4.001');
    });

    it('should lex @keywords', () => {
      var cssCode = '@import()@something';
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.AtKeyword);
      expect(tokens[0].strValue).toEqual('@import');

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[1].strValue).toEqual('(');

      expect(tokens[2].type).toEqual(CssTokenType.Character);
      expect(tokens[2].strValue).toEqual(')');

      expect(tokens[3].type).toEqual(CssTokenType.AtKeyword);
      expect(tokens[3].strValue).toEqual('@something');
    });

    it('should still lex a number even if it has a dimension suffix', () => {
      var cssCode = '40% is 40 percent';
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Number);
      expect(tokens[0].strValue).toEqual('40');

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[1].strValue).toEqual('%');

      expect(tokens[2].type).toEqual(CssTokenType.Identifier);
      expect(tokens[2].strValue).toEqual('is');

      expect(tokens[3].type).toEqual(CssTokenType.Number);
      expect(tokens[3].strValue).toEqual('40');
    });

    it('should allow escaped character and unicode character-strings in CSS selectors', () => {
      var cssCode = '\\123456 .some\\thing \{\}';
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Identifier);
      expect(tokens[0].strValue).toEqual('\\123456');

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[2].type).toEqual(CssTokenType.Identifier);
      expect(tokens[2].strValue).toEqual('some\\thing');
    });

    it('should distinguish identifiers and numbers from special characters', () => {
      var cssCode = 'one*two=-4+three-4-equals_value$';
      var tokens = tokenize(cssCode);

      expect(tokens[0].type).toEqual(CssTokenType.Identifier);
      expect(tokens[0].strValue).toEqual('one');

      expect(tokens[1].type).toEqual(CssTokenType.Character);
      expect(tokens[1].strValue).toEqual('*');

      expect(tokens[2].type).toEqual(CssTokenType.Identifier);
      expect(tokens[2].strValue).toEqual('two');

      expect(tokens[3].type).toEqual(CssTokenType.Character);
      expect(tokens[3].strValue).toEqual('=');

      expect(tokens[4].type).toEqual(CssTokenType.Number);
      expect(tokens[4].strValue).toEqual('-4');

      expect(tokens[5].type).toEqual(CssTokenType.Character);
      expect(tokens[5].strValue).toEqual('+');

      expect(tokens[6].type).toEqual(CssTokenType.Identifier);
      expect(tokens[6].strValue).toEqual('three-4-equals_value');

      expect(tokens[7].type).toEqual(CssTokenType.Character);
      expect(tokens[7].strValue).toEqual('$');
    });

    it('should filter out comments and whitespace by default', () => {
      var cssCode = '.selector /* comment */ { /* value */ }';
      var tokens = tokenize(cssCode);

      expect(tokens[0].strValue).toEqual('.');
      expect(tokens[1].strValue).toEqual('selector');
      expect(tokens[2].strValue).toEqual('{');
      expect(tokens[3].strValue).toEqual('}');
    });

    it('should track comments when the flag is set to true', () => {
      var cssCode = '.selector /* comment */ { /* value */ }';
      var trackComments = true;
      var tokens = tokenize(cssCode, trackComments, CssLexerMode.ALL_TRACK_WS);

      expect(tokens[0].strValue).toEqual('.');
      expect(tokens[1].strValue).toEqual('selector');
      expect(tokens[2].strValue).toEqual(' ');

      expect(tokens[3].type).toEqual(CssTokenType.Comment);
      expect(tokens[3].strValue).toEqual('/* comment */');

      expect(tokens[4].strValue).toEqual(' ');
      expect(tokens[5].strValue).toEqual('{');
      expect(tokens[6].strValue).toEqual(' ');

      expect(tokens[7].type).toEqual(CssTokenType.Comment);
      expect(tokens[7].strValue).toEqual('/* value */');
    });

    describe('Selector Mode', () => {
      it('should throw an error if a selector is being parsed while in the wrong mode', () => {
        var cssCode = '.class > tag';

        var capturedMessage: any /** TODO #9100 */;
        try {
          tokenize(cssCode, false, CssLexerMode.STYLE_BLOCK);
        } catch (e) {
          capturedMessage = e.rawMessage;
        }

        expect(capturedMessage)
            .toMatchPattern(/Unexpected character \[\>\] at column 0:7 in expression/g);
        capturedMessage = null;

        try {
          tokenize(cssCode, false, CssLexerMode.SELECTOR);
        } catch (e) {
          capturedMessage = e.rawMessage;
        }

        expect(capturedMessage).toEqual(null);
      });
    });

    describe('Attribute Mode', () => {
      it('should consider attribute selectors as valid input and throw when an invalid modifier is used',
         () => {
           function tokenizeAttr(modifier: any /** TODO #9100 */) {
             var cssCode = 'value' + modifier + '=\'something\'';
             return tokenize(cssCode, false, CssLexerMode.ATTRIBUTE_SELECTOR);
           }

           expect(tokenizeAttr('*').length).toEqual(4);
           expect(tokenizeAttr('|').length).toEqual(4);
           expect(tokenizeAttr('^').length).toEqual(4);
           expect(tokenizeAttr('$').length).toEqual(4);
           expect(tokenizeAttr('~').length).toEqual(4);
           expect(tokenizeAttr('').length).toEqual(3);

           expect(() => { tokenizeAttr('+'); }).toThrow();
         });
    });

    describe('Media Query Mode', () => {
      it('should validate media queries with a reduced subset of valid characters', () => {
        function tokenizeQuery(code: any /** TODO #9100 */) {
          return tokenize(code, false, CssLexerMode.MEDIA_QUERY);
        }

        // the reason why the numbers are so high is because MediaQueries keep
        // track of the whitespace values
        expect(tokenizeQuery('(prop: value)').length).toEqual(5);
        expect(tokenizeQuery('(prop: value) and (prop2: value2)').length).toEqual(11);
        expect(tokenizeQuery('tv and (prop: value)').length).toEqual(7);
        expect(tokenizeQuery('print and ((prop: value) or (prop2: value2))').length).toEqual(15);
        expect(tokenizeQuery('(content: \'something $ crazy inside &\')').length).toEqual(5);

        expect(() => { tokenizeQuery('(max-height: 10 + 20)'); }).toThrow();

        expect(() => { tokenizeQuery('(max-height: fifty < 100)'); }).toThrow();
      });
    });

    describe('Pseudo Selector Mode', () => {
      it('should validate pseudo selector identifiers with a reduced subset of valid characters',
         () => {
           function tokenizePseudo(code: string, withArgs = false): CssToken[] {
             var mode = withArgs ? CssLexerMode.PSEUDO_SELECTOR_WITH_ARGUMENTS :
                                   CssLexerMode.PSEUDO_SELECTOR;
             return tokenize(code, false, mode);
           }

           expect(tokenizePseudo('hover').length).toEqual(1);
           expect(tokenizePseudo('focus').length).toEqual(1);
           expect(tokenizePseudo('lang(en-us)', true).length).toEqual(4);

           expect(() => { tokenizePseudo('lang(something:broken)', true); }).toThrow();

           expect(() => { tokenizePseudo('not(.selector)', true); }).toThrow();
         });
    });

    describe(
        'Style Block Mode', () => {
          it('should style blocks with a reduced subset of valid characters',
             () => {
               function tokenizeStyles(code: any /** TODO #9100 */) {
                 return tokenize(code, false, CssLexerMode.STYLE_BLOCK);
               }

               expect(tokenizeStyles(`
          key: value;
          prop: 100;
          style: value3!important;
        `).length).toEqual(14);

               expect(() => tokenizeStyles(` key$: value; `)).toThrow();
               expect(() => tokenizeStyles(` key: value$; `)).toThrow();
               expect(() => tokenizeStyles(` key: value + 10; `)).toThrow();
               expect(() => tokenizeStyles(` key: &value; `)).toThrow();
             });
        });
  });
}

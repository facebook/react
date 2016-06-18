export const $EOF = 0;
export const $TAB = 9;
export const $LF = 10;
export const $VTAB = 11;
export const $FF = 12;
export const $CR = 13;
export const $SPACE = 32;
export const $BANG = 33;
export const $DQ = 34;
export const $HASH = 35;
export const $$ = 36;
export const $PERCENT = 37;
export const $AMPERSAND = 38;
export const $SQ = 39;
export const $LPAREN = 40;
export const $RPAREN = 41;
export const $STAR = 42;
export const $PLUS = 43;
export const $COMMA = 44;
export const $MINUS = 45;
export const $PERIOD = 46;
export const $SLASH = 47;
export const $COLON = 58;
export const $SEMICOLON = 59;
export const $LT = 60;
export const $EQ = 61;
export const $GT = 62;
export const $QUESTION = 63;

export const $0 = 48;
export const $9 = 57;

export const $A = 65;
export const $E = 69;
export const $F = 70;
export const $X = 88;
export const $Z = 90;

export const $LBRACKET = 91;
export const $BACKSLASH = 92;
export const $RBRACKET = 93;
export const $CARET = 94;
export const $_ = 95;

export const $a = 97;
export const $e = 101;
export const $f = 102;
export const $n = 110;
export const $r = 114;
export const $t = 116;
export const $u = 117;
export const $v = 118;
export const $x = 120;
export const $z = 122;

export const $LBRACE = 123;
export const $BAR = 124;
export const $RBRACE = 125;
export const $NBSP = 160;

export const $PIPE = 124;
export const $TILDA = 126;
export const $AT = 64;

export function isWhitespace(code: number): boolean {
  return (code >= $TAB && code <= $SPACE) || (code == $NBSP);
}

import {RegExpWrapper, StringWrapper} from '../src/facade/lang';

var _RE_SPECIAL_CHARS =
    ['-', '[', ']', '/', '{', '}', '\\', '(', ')', '*', '+', '?', '.', '^', '$', '|'];
var _ESCAPE_RE = RegExpWrapper.create(`[\\${_RE_SPECIAL_CHARS.join('\\')}]`);
export function containsRegexp(input: string): RegExp {
  return RegExpWrapper.create(StringWrapper.replaceAllMapped(
      input, _ESCAPE_RE, (match: any /** TODO #9100 */) => `\\${match[0]}`));
}

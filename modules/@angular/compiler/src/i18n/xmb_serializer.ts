import {RegExpWrapper, isBlank, isPresent} from '../facade/lang';
import {HtmlAst, HtmlElementAst} from '../html_ast';
import {HtmlParser} from '../html_parser';
import {ParseError, ParseSourceSpan} from '../parse_util';

import {Message, id} from './message';

let _PLACEHOLDER_REGEXP = RegExpWrapper.create(`\\<ph(\\s)+name=("(\\w)+")\\/\\>`);
const _ID_ATTR = 'id';
const _MSG_ELEMENT = 'msg';
const _BUNDLE_ELEMENT = 'message-bundle';

export function serializeXmb(messages: Message[]): string {
  let ms = messages.map((m) => _serializeMessage(m)).join('');
  return `<message-bundle>${ms}</message-bundle>`;
}

export class XmbDeserializationResult {
  constructor(
      public content: string, public messages: {[key: string]: HtmlAst[]},
      public errors: ParseError[]) {}
}

export class XmbDeserializationError extends ParseError {
  constructor(span: ParseSourceSpan, msg: string) { super(span, msg); }
}

export function deserializeXmb(content: string, url: string): XmbDeserializationResult {
  let parser = new HtmlParser();
  let normalizedContent = _expandPlaceholder(content.trim());
  let parsed = parser.parse(normalizedContent, url);

  if (parsed.errors.length > 0) {
    return new XmbDeserializationResult(null, {}, parsed.errors);
  }

  if (_checkRootElement(parsed.rootNodes)) {
    return new XmbDeserializationResult(
        null, {}, [new XmbDeserializationError(null, `Missing element "${_BUNDLE_ELEMENT}"`)]);
  }

  let bundleEl = <HtmlElementAst>parsed.rootNodes[0];  // test this
  let errors: ParseError[] = [];
  let messages: {[key: string]: HtmlAst[]} = {};

  _createMessages(bundleEl.children, messages, errors);

  return (errors.length == 0) ?
      new XmbDeserializationResult(normalizedContent, messages, []) :
      new XmbDeserializationResult(null, <{[key: string]: HtmlAst[]}>{}, errors);
}

function _checkRootElement(nodes: HtmlAst[]): boolean {
  return nodes.length < 1 || !(nodes[0] instanceof HtmlElementAst) ||
      (<HtmlElementAst>nodes[0]).name != _BUNDLE_ELEMENT;
}

function _createMessages(
    nodes: HtmlAst[], messages: {[key: string]: HtmlAst[]}, errors: ParseError[]): void {
  nodes.forEach((item) => {
    if (item instanceof HtmlElementAst) {
      let msg = <HtmlElementAst>item;

      if (msg.name != _MSG_ELEMENT) {
        errors.push(
            new XmbDeserializationError(item.sourceSpan, `Unexpected element "${msg.name}"`));
        return;
      }

      let id = _id(msg);
      if (isBlank(id)) {
        errors.push(
            new XmbDeserializationError(item.sourceSpan, `"${_ID_ATTR}" attribute is missing`));
        return;
      }

      messages[id] = msg.children;
    }
  });
}

function _id(el: HtmlElementAst): string {
  let ids = el.attrs.filter(a => a.name == _ID_ATTR);
  return ids.length > 0 ? ids[0].value : null;
}

function _serializeMessage(m: Message): string {
  let desc = isPresent(m.description) ? ` desc='${m.description}'` : '';
  return `<msg id='${id(m)}'${desc}>${m.content}</msg>`;
}

function _expandPlaceholder(input: string): string {
  return RegExpWrapper.replaceAll(_PLACEHOLDER_REGEXP, input, (match: string[]) => {
    let nameWithQuotes = match[2];
    return `<ph name=${nameWithQuotes}></ph>`;
  });
}

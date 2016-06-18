import {Parser} from '../expression_parser/parser';
import {StringMapWrapper} from '../facade/collection';
import {isPresent} from '../facade/lang';
import {HtmlAst, HtmlElementAst} from '../html_ast';
import {HtmlParser} from '../html_parser';
import {ParseError} from '../parse_util';

import {expandNodes} from './expander';
import {Message, id} from './message';
import {I18N_ATTR_PREFIX, I18nError, Part, messageFromAttribute, messageFromI18nAttribute, partition} from './shared';


/**
 * All messages extracted from a template.
 */
export class ExtractionResult {
  constructor(public messages: Message[], public errors: ParseError[]) {}
}

/**
 * Removes duplicate messages.
 */
export function removeDuplicates(messages: Message[]): Message[] {
  let uniq: {[key: string]: Message} = {};
  messages.forEach(m => {
    if (!StringMapWrapper.contains(uniq, id(m))) {
      uniq[id(m)] = m;
    }
  });
  return StringMapWrapper.values(uniq);
}

/**
 * Extracts all messages from a template.
 *
 * Algorithm:
 *
 * To understand the algorithm, you need to know how partitioning works.
 * Partitioning is required as we can use two i18n comments to group node siblings together.
 * That is why we cannot just use nodes.
 *
 * Partitioning transforms an array of HtmlAst into an array of Part.
 * A part can optionally contain a root element or a root text node. And it can also contain
 * children.
 * A part can contain i18n property, in which case it needs to be extracted.
 *
 * Example:
 *
 * The following array of nodes will be split into four parts:
 *
 * ```
 * <a>A</a>
 * <b i18n>B</b>
 * <!-- i18n -->
 * <c>C</c>
 * D
 * <!-- /i18n -->
 * E
 * ```
 *
 * Part 1 containing the a tag. It should not be translated.
 * Part 2 containing the b tag. It should be translated.
 * Part 3 containing the c tag and the D text node. It should be translated.
 * Part 4 containing the E text node. It should not be translated..
 *
 * It is also important to understand how we stringify nodes to create a message.
 *
 * We walk the tree and replace every element node with a placeholder. We also replace
 * all expressions in interpolation with placeholders. We also insert a placeholder element
 * to wrap a text node containing interpolation.
 *
 * Example:
 *
 * The following tree:
 *
 * ```
 * <a>A{{I}}</a><b>B</b>
 * ```
 *
 * will be stringified into:
 * ```
 * <ph name="e0"><ph name="t1">A<ph name="0"/></ph></ph><ph name="e2">B</ph>
 * ```
 *
 * This is what the algorithm does:
 *
 * 1. Use the provided html parser to get the html AST of the template.
 * 2. Partition the root nodes, and process each part separately.
 * 3. If a part does not have the i18n attribute, recurse to process children and attributes.
 * 4. If a part has the i18n attribute, stringify the nodes to create a Message.
 */
export class MessageExtractor {
  private _messages: Message[];
  private _errors: ParseError[];

  constructor(
      private _htmlParser: HtmlParser, private _parser: Parser, private _implicitTags: string[],
      private _implicitAttrs: {[k: string]: string[]}) {}

  extract(template: string, sourceUrl: string): ExtractionResult {
    this._messages = [];
    this._errors = [];

    let res = this._htmlParser.parse(template, sourceUrl, true);
    if (res.errors.length > 0) {
      return new ExtractionResult([], res.errors);
    } else {
      let expanded = expandNodes(res.rootNodes);
      this._recurse(expanded.nodes);
      return new ExtractionResult(this._messages, this._errors.concat(expanded.errors));
    }
  }

  private _extractMessagesFromPart(part: Part): void {
    if (part.hasI18n) {
      this._messages.push(part.createMessage(this._parser));
      this._recurseToExtractMessagesFromAttributes(part.children);
    } else {
      this._recurse(part.children);
    }

    if (isPresent(part.rootElement)) {
      this._extractMessagesFromAttributes(part.rootElement);
    }
  }

  private _recurse(nodes: HtmlAst[]): void {
    if (isPresent(nodes)) {
      let parts = partition(nodes, this._errors, this._implicitTags);
      parts.forEach(part => this._extractMessagesFromPart(part));
    }
  }

  private _recurseToExtractMessagesFromAttributes(nodes: HtmlAst[]): void {
    nodes.forEach(n => {
      if (n instanceof HtmlElementAst) {
        this._extractMessagesFromAttributes(n);
        this._recurseToExtractMessagesFromAttributes(n.children);
      }
    });
  }

  private _extractMessagesFromAttributes(p: HtmlElementAst): void {
    let transAttrs: string[] =
        isPresent(this._implicitAttrs[p.name]) ? this._implicitAttrs[p.name] : [];
    let explicitAttrs: string[] = [];

    p.attrs.filter(attr => attr.name.startsWith(I18N_ATTR_PREFIX)).forEach(attr => {
      try {
        explicitAttrs.push(attr.name.substring(I18N_ATTR_PREFIX.length));
        this._messages.push(messageFromI18nAttribute(this._parser, p, attr));
      } catch (e) {
        if (e instanceof I18nError) {
          this._errors.push(e);
        } else {
          throw e;
        }
      }
    });

    p.attrs.filter(attr => !attr.name.startsWith(I18N_ATTR_PREFIX))
        .filter(attr => explicitAttrs.indexOf(attr.name) == -1)
        .filter(attr => transAttrs.indexOf(attr.name) > -1)
        .forEach(attr => this._messages.push(messageFromAttribute(this._parser, attr)));
  }
}

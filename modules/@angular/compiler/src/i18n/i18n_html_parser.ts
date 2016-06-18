import {Parser} from '../expression_parser/parser';
import {ListWrapper, StringMapWrapper} from '../facade/collection';
import {BaseException} from '../facade/exceptions';
import {NumberWrapper, RegExpWrapper, isPresent} from '../facade/lang';
import {HtmlAst, HtmlAstVisitor, HtmlAttrAst, HtmlCommentAst, HtmlElementAst, HtmlExpansionAst, HtmlExpansionCaseAst, HtmlTextAst, htmlVisitAll} from '../html_ast';
import {HtmlParseTreeResult, HtmlParser} from '../html_parser';
import {ParseError, ParseSourceSpan} from '../parse_util';

import {expandNodes} from './expander';
import {Message, id} from './message';
import {I18N_ATTR, I18N_ATTR_PREFIX, I18nError, Part, dedupePhName, getPhNameFromBinding, messageFromAttribute, messageFromI18nAttribute, partition} from './shared';

const _PLACEHOLDER_ELEMENT = 'ph';
const _NAME_ATTR = 'name';
let _PLACEHOLDER_EXPANDED_REGEXP = /<ph(\s)+name=("(\w)+")><\/ph>/gi;

/**
 * Creates an i18n-ed version of the parsed template.
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
 * A part can contain i18n property, in which case it needs to be translated.
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
 * Part 4 containing the E text node. It should not be translated.
 *
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
 * 4. If a part has the i18n attribute, merge the translated i18n part with the original tree.
 *
 * This is how the merging works:
 *
 * 1. Use the stringify function to get the message id. Look up the message in the map.
 * 2. Get the translated message. At this point we have two trees: the original tree
 * and the translated tree, where all the elements are replaced with placeholders.
 * 3. Use the original tree to create a mapping Index:number -> HtmlAst.
 * 4. Walk the translated tree.
 * 5. If we encounter a placeholder element, get its name property.
 * 6. Get the type and the index of the node using the name property.
 * 7. If the type is 'e', which means element, then:
 *     - translate the attributes of the original element
 *     - recurse to merge the children
 *     - create a new element using the original element name, original position,
 *     and translated children and attributes
 * 8. If the type if 't', which means text, then:
 *     - get the list of expressions from the original node.
 *     - get the string version of the interpolation subtree
 *     - find all the placeholders in the translated message, and replace them with the
 *     corresponding original expressions
 */
export class I18nHtmlParser implements HtmlParser {
  errors: ParseError[];

  constructor(
      private _htmlParser: HtmlParser, private _parser: Parser, private _messagesContent: string,
      private _messages: {[key: string]: HtmlAst[]}, private _implicitTags: string[],
      private _implicitAttrs: {[k: string]: string[]}) {}

  parse(sourceContent: string, sourceUrl: string, parseExpansionForms: boolean = false):
      HtmlParseTreeResult {
    this.errors = [];

    let res = this._htmlParser.parse(sourceContent, sourceUrl, true);

    if (res.errors.length > 0) {
      return res;
    } else {
      let expanded = expandNodes(res.rootNodes);
      let nodes = this._recurse(expanded.nodes);
      this.errors.push(...expanded.errors);

      return this.errors.length > 0 ? new HtmlParseTreeResult([], this.errors) :
                                      new HtmlParseTreeResult(nodes, []);
    }
  }

  private _processI18nPart(part: Part): HtmlAst[] {
    try {
      return part.hasI18n ? this._mergeI18Part(part) : this._recurseIntoI18nPart(part);
    } catch (e) {
      if (e instanceof I18nError) {
        this.errors.push(e);
        return [];
      } else {
        throw e;
      }
    }
  }

  private _mergeI18Part(part: Part): HtmlAst[] {
    let message = part.createMessage(this._parser);
    let messageId = id(message);
    if (!StringMapWrapper.contains(this._messages, messageId)) {
      throw new I18nError(
          part.sourceSpan,
          `Cannot find message for id '${messageId}', content '${message.content}'.`);
    }

    let parsedMessage = this._messages[messageId];
    return this._mergeTrees(part, parsedMessage, part.children);
  }

  private _recurseIntoI18nPart(p: Part): HtmlAst[] {
    // we found an element without an i18n attribute
    // we need to recurse in cause its children may have i18n set
    // we also need to translate its attributes
    if (isPresent(p.rootElement)) {
      let root = p.rootElement;
      let children = this._recurse(p.children);
      let attrs = this._i18nAttributes(root);
      return [new HtmlElementAst(
          root.name, attrs, children, root.sourceSpan, root.startSourceSpan, root.endSourceSpan)];

      // a text node without i18n or interpolation, nothing to do
    } else if (isPresent(p.rootTextNode)) {
      return [p.rootTextNode];

    } else {
      return this._recurse(p.children);
    }
  }

  private _recurse(nodes: HtmlAst[]): HtmlAst[] {
    let parts = partition(nodes, this.errors, this._implicitTags);
    return ListWrapper.flatten(parts.map(p => this._processI18nPart(p)));
  }

  private _mergeTrees(p: Part, translated: HtmlAst[], original: HtmlAst[]): HtmlAst[] {
    let l = new _CreateNodeMapping();
    htmlVisitAll(l, original);

    // merge the translated tree with the original tree.
    // we do it by preserving the source code position of the original tree
    let merged = this._mergeTreesHelper(translated, l.mapping);

    // if the root element is present, we need to create a new root element with its attributes
    // translated
    if (isPresent(p.rootElement)) {
      let root = p.rootElement;
      let attrs = this._i18nAttributes(root);
      return [new HtmlElementAst(
          root.name, attrs, merged, root.sourceSpan, root.startSourceSpan, root.endSourceSpan)];

      // this should never happen with a part. Parts that have root text node should not be merged.
    } else if (isPresent(p.rootTextNode)) {
      throw new BaseException('should not be reached');

    } else {
      return merged;
    }
  }

  private _mergeTreesHelper(translated: HtmlAst[], mapping: HtmlAst[]): HtmlAst[] {
    return translated.map(t => {
      if (t instanceof HtmlElementAst) {
        return this._mergeElementOrInterpolation(t, translated, mapping);

      } else if (t instanceof HtmlTextAst) {
        return t;

      } else {
        throw new BaseException('should not be reached');
      }
    });
  }

  private _mergeElementOrInterpolation(
      t: HtmlElementAst, translated: HtmlAst[], mapping: HtmlAst[]): HtmlAst {
    let name = this._getName(t);
    let type = name[0];
    let index = NumberWrapper.parseInt(name.substring(1), 10);
    let originalNode = mapping[index];

    if (type == 't') {
      return this._mergeTextInterpolation(t, <HtmlTextAst>originalNode);
    } else if (type == 'e') {
      return this._mergeElement(t, <HtmlElementAst>originalNode, mapping);
    } else {
      throw new BaseException('should not be reached');
    }
  }

  private _getName(t: HtmlElementAst): string {
    if (t.name != _PLACEHOLDER_ELEMENT) {
      throw new I18nError(
          t.sourceSpan,
          `Unexpected tag "${t.name}". Only "${_PLACEHOLDER_ELEMENT}" tags are allowed.`);
    }
    let names = t.attrs.filter(a => a.name == _NAME_ATTR);
    if (names.length == 0) {
      throw new I18nError(t.sourceSpan, `Missing "${_NAME_ATTR}" attribute.`);
    }
    return names[0].value;
  }

  private _mergeTextInterpolation(t: HtmlElementAst, originalNode: HtmlTextAst): HtmlTextAst {
    let split =
        this._parser.splitInterpolation(originalNode.value, originalNode.sourceSpan.toString());
    let exps = isPresent(split) ? split.expressions : [];

    let messageSubstring =
        this._messagesContent.substring(t.startSourceSpan.end.offset, t.endSourceSpan.start.offset);
    let translated =
        this._replacePlaceholdersWithExpressions(messageSubstring, exps, originalNode.sourceSpan);

    return new HtmlTextAst(translated, originalNode.sourceSpan);
  }

  private _mergeElement(t: HtmlElementAst, originalNode: HtmlElementAst, mapping: HtmlAst[]):
      HtmlElementAst {
    let children = this._mergeTreesHelper(t.children, mapping);
    return new HtmlElementAst(
        originalNode.name, this._i18nAttributes(originalNode), children, originalNode.sourceSpan,
        originalNode.startSourceSpan, originalNode.endSourceSpan);
  }

  private _i18nAttributes(el: HtmlElementAst): HtmlAttrAst[] {
    let res: HtmlAttrAst[] = [];
    let implicitAttrs: string[] =
        isPresent(this._implicitAttrs[el.name]) ? this._implicitAttrs[el.name] : [];

    el.attrs.forEach(attr => {
      if (attr.name.startsWith(I18N_ATTR_PREFIX) || attr.name == I18N_ATTR) return;

      let message: Message;

      let i18ns = el.attrs.filter(a => a.name == `${I18N_ATTR_PREFIX}${attr.name}`);

      if (i18ns.length == 0) {
        if (implicitAttrs.indexOf(attr.name) == -1) {
          res.push(attr);
          return;
        }
        message = messageFromAttribute(this._parser, attr);
      } else {
        message = messageFromI18nAttribute(this._parser, el, i18ns[0]);
      }

      let messageId = id(message);

      if (StringMapWrapper.contains(this._messages, messageId)) {
        let updatedMessage = this._replaceInterpolationInAttr(attr, this._messages[messageId]);
        res.push(new HtmlAttrAst(attr.name, updatedMessage, attr.sourceSpan));

      } else {
        throw new I18nError(
            attr.sourceSpan,
            `Cannot find message for id '${messageId}', content '${message.content}'.`);
      }
    });
    return res;
  }

  private _replaceInterpolationInAttr(attr: HtmlAttrAst, msg: HtmlAst[]): string {
    let split = this._parser.splitInterpolation(attr.value, attr.sourceSpan.toString());
    let exps = isPresent(split) ? split.expressions : [];

    let first = msg[0];
    let last = msg[msg.length - 1];

    let start = first.sourceSpan.start.offset;
    let end =
        last instanceof HtmlElementAst ? last.endSourceSpan.end.offset : last.sourceSpan.end.offset;
    let messageSubstring = this._messagesContent.substring(start, end);

    return this._replacePlaceholdersWithExpressions(messageSubstring, exps, attr.sourceSpan);
  };

  private _replacePlaceholdersWithExpressions(
      message: string, exps: string[], sourceSpan: ParseSourceSpan): string {
    let expMap = this._buildExprMap(exps);
    return RegExpWrapper.replaceAll(_PLACEHOLDER_EXPANDED_REGEXP, message, (match: string[]) => {
      let nameWithQuotes = match[2];
      let name = nameWithQuotes.substring(1, nameWithQuotes.length - 1);
      return this._convertIntoExpression(name, expMap, sourceSpan);
    });
  }

  private _buildExprMap(exps: string[]): Map<string, string> {
    let expMap = new Map<string, string>();
    let usedNames = new Map<string, number>();

    for (var i = 0; i < exps.length; i++) {
      let phName = getPhNameFromBinding(exps[i], i);
      expMap.set(dedupePhName(usedNames, phName), exps[i]);
    }
    return expMap;
  }

  private _convertIntoExpression(
      name: string, expMap: Map<string, string>, sourceSpan: ParseSourceSpan) {
    if (expMap.has(name)) {
      return `{{${expMap.get(name)}}}`;
    } else {
      throw new I18nError(sourceSpan, `Invalid interpolation name '${name}'`);
    }
  }
}

class _CreateNodeMapping implements HtmlAstVisitor {
  mapping: HtmlAst[] = [];

  visitElement(ast: HtmlElementAst, context: any): any {
    this.mapping.push(ast);
    htmlVisitAll(this, ast.children);
    return null;
  }

  visitAttr(ast: HtmlAttrAst, context: any): any { return null; }

  visitText(ast: HtmlTextAst, context: any): any {
    this.mapping.push(ast);
    return null;
  }

  visitExpansion(ast: HtmlExpansionAst, context: any): any { return null; }

  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any { return null; }

  visitComment(ast: HtmlCommentAst, context: any): any { return ''; }
}

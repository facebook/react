import {Inject, Injectable, OpaqueToken, Optional} from '@angular/core';

import {Console, MAX_INTERPOLATION_VALUES, SecurityContext} from '../core_private';

import {ListWrapper, StringMapWrapper, SetWrapper,} from '../src/facade/collection';
import {RegExpWrapper, isPresent, StringWrapper, isBlank, isArray} from '../src/facade/lang';
import {BaseException} from '../src/facade/exceptions';
import {AST, Interpolation, ASTWithSource, TemplateBinding, RecursiveAstVisitor, BindingPipe} from './expression_parser/ast';
import {Parser} from './expression_parser/parser';
import {CompileDirectiveMetadata, CompilePipeMetadata, CompileMetadataWithType,} from './compile_metadata';
import {HtmlParser} from './html_parser';
import {splitNsName, mergeNsAndName} from './html_tags';
import {ParseSourceSpan, ParseError, ParseLocation, ParseErrorLevel} from './parse_util';

import {ElementAst, BoundElementPropertyAst, BoundEventAst, ReferenceAst, TemplateAst, TemplateAstVisitor, templateVisitAll, TextAst, BoundTextAst, EmbeddedTemplateAst, AttrAst, NgContentAst, PropertyBindingType, DirectiveAst, BoundDirectivePropertyAst, ProviderAst, ProviderAstType, VariableAst} from './template_ast';
import {CssSelector, SelectorMatcher} from './selector';

import {ElementSchemaRegistry} from './schema/element_schema_registry';
import {preparseElement, PreparsedElementType} from './template_preparser';

import {isStyleUrlResolvable} from './style_url_resolver';

import {HtmlAstVisitor, HtmlElementAst, HtmlAttrAst, HtmlTextAst, HtmlCommentAst, HtmlExpansionAst, HtmlExpansionCaseAst, htmlVisitAll} from './html_ast';

import {splitAtColon} from './util';
import {identifierToken, Identifiers} from './identifiers';

import {ProviderElementContext, ProviderViewContext} from './provider_parser';

// Group 1 = "bind-"
// Group 2 = "var-"
// Group 3 = "let-"
// Group 4 = "ref-/#"
// Group 5 = "on-"
// Group 6 = "bindon-"
// Group 7 = "animate-/@"
// Group 8 = the identifier after "bind-", "var-/#", or "on-"
// Group 9 = identifier inside [()]
// Group 10 = identifier inside []
// Group 11 = identifier inside ()
var BIND_NAME_REGEXP =
    /^(?:(?:(?:(bind-)|(var-)|(let-)|(ref-|#)|(on-)|(bindon-)|(animate-|@))(.+))|\[\(([^\)]+)\)\]|\[([^\]]+)\]|\(([^\)]+)\))$/g;

const TEMPLATE_ELEMENT = 'template';
const TEMPLATE_ATTR = 'template';
const TEMPLATE_ATTR_PREFIX = '*';
const CLASS_ATTR = 'class';

var PROPERTY_PARTS_SEPARATOR = '.';
const ATTRIBUTE_PREFIX = 'attr';
const CLASS_PREFIX = 'class';
const STYLE_PREFIX = 'style';

var TEXT_CSS_SELECTOR = CssSelector.parse('*')[0];

/**
 * Provides an array of {@link TemplateAstVisitor}s which will be used to transform
 * parsed templates before compilation is invoked, allowing custom expression syntax
 * and other advanced transformations.
 *
 * This is currently an internal-only feature and not meant for general use.
 */
export const TEMPLATE_TRANSFORMS: any = /*@ts2dart_const*/ new OpaqueToken('TemplateTransforms');

export class TemplateParseError extends ParseError {
  constructor(message: string, span: ParseSourceSpan, level: ParseErrorLevel) {
    super(span, message, level);
  }
}

export class TemplateParseResult {
  constructor(public templateAst?: TemplateAst[], public errors?: ParseError[]) {}
}

@Injectable()
export class TemplateParser {
  constructor(
      private _exprParser: Parser, private _schemaRegistry: ElementSchemaRegistry,
      private _htmlParser: HtmlParser, private _console: Console,
      @Optional() @Inject(TEMPLATE_TRANSFORMS) public transforms: TemplateAstVisitor[]) {}

  parse(
      component: CompileDirectiveMetadata, template: string, directives: CompileDirectiveMetadata[],
      pipes: CompilePipeMetadata[], templateUrl: string): TemplateAst[] {
    var result = this.tryParse(component, template, directives, pipes, templateUrl);
    var warnings = result.errors.filter(error => error.level === ParseErrorLevel.WARNING);
    var errors = result.errors.filter(error => error.level === ParseErrorLevel.FATAL);
    if (warnings.length > 0) {
      this._console.warn(`Template parse warnings:\n${warnings.join('\n')}`);
    }
    if (errors.length > 0) {
      var errorString = errors.join('\n');
      throw new BaseException(`Template parse errors:\n${errorString}`);
    }
    return result.templateAst;
  }

  tryParse(
      component: CompileDirectiveMetadata, template: string, directives: CompileDirectiveMetadata[],
      pipes: CompilePipeMetadata[], templateUrl: string): TemplateParseResult {
    var htmlAstWithErrors = this._htmlParser.parse(template, templateUrl);
    var errors: ParseError[] = htmlAstWithErrors.errors;
    var result: any /** TODO #???? */;
    if (htmlAstWithErrors.rootNodes.length > 0) {
      var uniqDirectives = <CompileDirectiveMetadata[]>removeDuplicates(directives);
      var uniqPipes = <CompilePipeMetadata[]>removeDuplicates(pipes);
      var providerViewContext =
          new ProviderViewContext(component, htmlAstWithErrors.rootNodes[0].sourceSpan);
      var parseVisitor = new TemplateParseVisitor(
          providerViewContext, uniqDirectives, uniqPipes, this._exprParser, this._schemaRegistry);

      result = htmlVisitAll(parseVisitor, htmlAstWithErrors.rootNodes, EMPTY_ELEMENT_CONTEXT);
      errors = errors.concat(parseVisitor.errors).concat(providerViewContext.errors);
    } else {
      result = [];
    }

    this._assertNoReferenceDuplicationOnTemplate(result, errors);

    if (errors.length > 0) {
      return new TemplateParseResult(result, errors);
    }
    if (isPresent(this.transforms)) {
      this.transforms.forEach(
          (transform: TemplateAstVisitor) => { result = templateVisitAll(transform, result); });
    }
    return new TemplateParseResult(result, errors);
  }

  /** @internal */
  _assertNoReferenceDuplicationOnTemplate(result: any[], errors: TemplateParseError[]): void {
    const existingReferences: any[] /** TODO #???? */ = [];
    result.filter(element => !!element.references)
        .forEach(element => element.references.forEach((reference: any /** TODO #???? */) => {
          const name = reference.name;
          if (existingReferences.indexOf(name) < 0) {
            existingReferences.push(name);
          } else {
            const error = new TemplateParseError(
                `Reference "#${name}" is defined several times`, reference.sourceSpan,
                ParseErrorLevel.FATAL);
            errors.push(error);
          }
        }));
  }
}

class TemplateParseVisitor implements HtmlAstVisitor {
  selectorMatcher: SelectorMatcher;
  errors: TemplateParseError[] = [];
  directivesIndex = new Map<CompileDirectiveMetadata, number>();
  ngContentCount: number = 0;
  pipesByName: Map<string, CompilePipeMetadata>;

  constructor(
      public providerViewContext: ProviderViewContext, directives: CompileDirectiveMetadata[],
      pipes: CompilePipeMetadata[], private _exprParser: Parser,
      private _schemaRegistry: ElementSchemaRegistry) {
    this.selectorMatcher = new SelectorMatcher();
    ListWrapper.forEachWithIndex(
        directives, (directive: CompileDirectiveMetadata, index: number) => {
          var selector = CssSelector.parse(directive.selector);
          this.selectorMatcher.addSelectables(selector, directive);
          this.directivesIndex.set(directive, index);
        });
    this.pipesByName = new Map<string, CompilePipeMetadata>();
    pipes.forEach(pipe => this.pipesByName.set(pipe.name, pipe));
  }

  private _reportError(
      message: string, sourceSpan: ParseSourceSpan,
      level: ParseErrorLevel = ParseErrorLevel.FATAL) {
    this.errors.push(new TemplateParseError(message, sourceSpan, level));
  }

  private _parseInterpolation(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    var sourceInfo = sourceSpan.start.toString();
    try {
      var ast = this._exprParser.parseInterpolation(value, sourceInfo);
      this._checkPipes(ast, sourceSpan);
      if (isPresent(ast) &&
          (<Interpolation>ast.ast).expressions.length > MAX_INTERPOLATION_VALUES) {
        throw new BaseException(
            `Only support at most ${MAX_INTERPOLATION_VALUES} interpolation values!`);
      }
      return ast;
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  private _parseAction(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    var sourceInfo = sourceSpan.start.toString();
    try {
      var ast = this._exprParser.parseAction(value, sourceInfo);
      this._checkPipes(ast, sourceSpan);
      return ast;
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  private _parseBinding(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    var sourceInfo = sourceSpan.start.toString();
    try {
      var ast = this._exprParser.parseBinding(value, sourceInfo);
      this._checkPipes(ast, sourceSpan);
      return ast;
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  private _parseTemplateBindings(value: string, sourceSpan: ParseSourceSpan): TemplateBinding[] {
    var sourceInfo = sourceSpan.start.toString();
    try {
      var bindingsResult = this._exprParser.parseTemplateBindings(value, sourceInfo);
      bindingsResult.templateBindings.forEach((binding) => {
        if (isPresent(binding.expression)) {
          this._checkPipes(binding.expression, sourceSpan);
        }
      });
      bindingsResult.warnings.forEach(
          (warning) => { this._reportError(warning, sourceSpan, ParseErrorLevel.WARNING); });
      return bindingsResult.templateBindings;
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return [];
    }
  }

  private _checkPipes(ast: ASTWithSource, sourceSpan: ParseSourceSpan) {
    if (isPresent(ast)) {
      var collector = new PipeCollector();
      ast.visit(collector);
      collector.pipes.forEach((pipeName) => {
        if (!this.pipesByName.has(pipeName)) {
          this._reportError(`The pipe '${pipeName}' could not be found`, sourceSpan);
        }
      });
    }
  }

  visitExpansion(ast: HtmlExpansionAst, context: any): any { return null; }

  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any { return null; }

  visitText(ast: HtmlTextAst, parent: ElementContext): any {
    var ngContentIndex = parent.findNgContentIndex(TEXT_CSS_SELECTOR);
    var expr = this._parseInterpolation(ast.value, ast.sourceSpan);
    if (isPresent(expr)) {
      return new BoundTextAst(expr, ngContentIndex, ast.sourceSpan);
    } else {
      return new TextAst(ast.value, ngContentIndex, ast.sourceSpan);
    }
  }

  visitAttr(ast: HtmlAttrAst, contex: any): any {
    return new AttrAst(ast.name, ast.value, ast.sourceSpan);
  }

  visitComment(ast: HtmlCommentAst, context: any): any { return null; }

  visitElement(element: HtmlElementAst, parent: ElementContext): any {
    var nodeName = element.name;
    var preparsedElement = preparseElement(element);
    if (preparsedElement.type === PreparsedElementType.SCRIPT ||
        preparsedElement.type === PreparsedElementType.STYLE) {
      // Skipping <script> for security reasons
      // Skipping <style> as we already processed them
      // in the StyleCompiler
      return null;
    }
    if (preparsedElement.type === PreparsedElementType.STYLESHEET &&
        isStyleUrlResolvable(preparsedElement.hrefAttr)) {
      // Skipping stylesheets with either relative urls or package scheme as we already processed
      // them in the StyleCompiler
      return null;
    }

    var matchableAttrs: string[][] = [];
    var elementOrDirectiveProps: BoundElementOrDirectiveProperty[] = [];
    var elementOrDirectiveRefs: ElementOrDirectiveRef[] = [];
    var elementVars: VariableAst[] = [];
    var animationProps: BoundElementPropertyAst[] = [];
    var events: BoundEventAst[] = [];

    var templateElementOrDirectiveProps: BoundElementOrDirectiveProperty[] = [];
    var templateMatchableAttrs: string[][] = [];
    var templateElementVars: VariableAst[] = [];

    var hasInlineTemplates = false;
    var attrs: any[] /** TODO #???? */ = [];
    var lcElName = splitNsName(nodeName.toLowerCase())[1];
    var isTemplateElement = lcElName == TEMPLATE_ELEMENT;

    element.attrs.forEach(attr => {
      var hasBinding = this._parseAttr(
          isTemplateElement, attr, matchableAttrs, elementOrDirectiveProps, animationProps, events,
          elementOrDirectiveRefs, elementVars);
      var hasTemplateBinding = this._parseInlineTemplateBinding(
          attr, templateMatchableAttrs, templateElementOrDirectiveProps, templateElementVars);
      if (!hasBinding && !hasTemplateBinding) {
        // don't include the bindings as attributes as well in the AST
        attrs.push(this.visitAttr(attr, null));
        matchableAttrs.push([attr.name, attr.value]);
      }
      if (hasTemplateBinding) {
        hasInlineTemplates = true;
      }
    });

    var elementCssSelector = createElementCssSelector(nodeName, matchableAttrs);
    var directiveMetas = this._parseDirectives(this.selectorMatcher, elementCssSelector);
    var references: ReferenceAst[] = [];
    var directiveAsts = this._createDirectiveAsts(
        isTemplateElement, element.name, directiveMetas, elementOrDirectiveProps,
        elementOrDirectiveRefs, element.sourceSpan, references);
    var elementProps: BoundElementPropertyAst[] =
        this._createElementPropertyAsts(element.name, elementOrDirectiveProps, directiveAsts)
            .concat(animationProps);
    var isViewRoot = parent.isTemplateElement || hasInlineTemplates;
    var providerContext = new ProviderElementContext(
        this.providerViewContext, parent.providerContext, isViewRoot, directiveAsts, attrs,
        references, element.sourceSpan);
    var children = htmlVisitAll(
        preparsedElement.nonBindable ? NON_BINDABLE_VISITOR : this, element.children,
        ElementContext.create(
            isTemplateElement, directiveAsts,
            isTemplateElement ? parent.providerContext : providerContext));
    providerContext.afterElement();
    // Override the actual selector when the `ngProjectAs` attribute is provided
    var projectionSelector = isPresent(preparsedElement.projectAs) ?
        CssSelector.parse(preparsedElement.projectAs)[0] :
        elementCssSelector;
    var ngContentIndex = parent.findNgContentIndex(projectionSelector);
    var parsedElement: any /** TODO #???? */;

    if (preparsedElement.type === PreparsedElementType.NG_CONTENT) {
      if (isPresent(element.children) && element.children.length > 0) {
        this._reportError(
            `<ng-content> element cannot have content. <ng-content> must be immediately followed by </ng-content>`,
            element.sourceSpan);
      }

      parsedElement = new NgContentAst(
          this.ngContentCount++, hasInlineTemplates ? null : ngContentIndex, element.sourceSpan);
    } else if (isTemplateElement) {
      this._assertAllEventsPublishedByDirectives(directiveAsts, events);
      this._assertNoComponentsNorElementBindingsOnTemplate(
          directiveAsts, elementProps, element.sourceSpan);

      parsedElement = new EmbeddedTemplateAst(
          attrs, events, references, elementVars, providerContext.transformedDirectiveAsts,
          providerContext.transformProviders, providerContext.transformedHasViewContainer, children,
          hasInlineTemplates ? null : ngContentIndex, element.sourceSpan);
    } else {
      this._assertOnlyOneComponent(directiveAsts, element.sourceSpan);
      let ngContentIndex =
          hasInlineTemplates ? null : parent.findNgContentIndex(projectionSelector);
      parsedElement = new ElementAst(
          nodeName, attrs, elementProps, events, references,
          providerContext.transformedDirectiveAsts, providerContext.transformProviders,
          providerContext.transformedHasViewContainer, children,
          hasInlineTemplates ? null : ngContentIndex, element.sourceSpan);
    }
    if (hasInlineTemplates) {
      var templateCssSelector = createElementCssSelector(TEMPLATE_ELEMENT, templateMatchableAttrs);
      var templateDirectiveMetas = this._parseDirectives(this.selectorMatcher, templateCssSelector);
      var templateDirectiveAsts = this._createDirectiveAsts(
          true, element.name, templateDirectiveMetas, templateElementOrDirectiveProps, [],
          element.sourceSpan, []);
      var templateElementProps: BoundElementPropertyAst[] = this._createElementPropertyAsts(
          element.name, templateElementOrDirectiveProps, templateDirectiveAsts);
      this._assertNoComponentsNorElementBindingsOnTemplate(
          templateDirectiveAsts, templateElementProps, element.sourceSpan);
      var templateProviderContext = new ProviderElementContext(
          this.providerViewContext, parent.providerContext, parent.isTemplateElement,
          templateDirectiveAsts, [], [], element.sourceSpan);
      templateProviderContext.afterElement();

      parsedElement = new EmbeddedTemplateAst(
          [], [], [], templateElementVars, templateProviderContext.transformedDirectiveAsts,
          templateProviderContext.transformProviders,
          templateProviderContext.transformedHasViewContainer, [parsedElement], ngContentIndex,
          element.sourceSpan);
    }
    return parsedElement;
  }

  private _parseInlineTemplateBinding(
      attr: HtmlAttrAst, targetMatchableAttrs: string[][],
      targetProps: BoundElementOrDirectiveProperty[], targetVars: VariableAst[]): boolean {
    var templateBindingsSource: any /** TODO #???? */ = null;
    if (attr.name == TEMPLATE_ATTR) {
      templateBindingsSource = attr.value;
    } else if (attr.name.startsWith(TEMPLATE_ATTR_PREFIX)) {
      var key = attr.name.substring(TEMPLATE_ATTR_PREFIX.length);  // remove the star
      templateBindingsSource = (attr.value.length == 0) ? key : key + ' ' + attr.value;
    }
    if (isPresent(templateBindingsSource)) {
      var bindings = this._parseTemplateBindings(templateBindingsSource, attr.sourceSpan);
      for (var i = 0; i < bindings.length; i++) {
        var binding = bindings[i];
        if (binding.keyIsVar) {
          targetVars.push(new VariableAst(binding.key, binding.name, attr.sourceSpan));
        } else if (isPresent(binding.expression)) {
          this._parsePropertyAst(
              binding.key, binding.expression, attr.sourceSpan, targetMatchableAttrs, targetProps);
        } else {
          targetMatchableAttrs.push([binding.key, '']);
          this._parseLiteralAttr(binding.key, null, attr.sourceSpan, targetProps);
        }
      }
      return true;
    }
    return false;
  }

  private _parseAttr(
      isTemplateElement: boolean, attr: HtmlAttrAst, targetMatchableAttrs: string[][],
      targetProps: BoundElementOrDirectiveProperty[],
      targetAnimationProps: BoundElementPropertyAst[], targetEvents: BoundEventAst[],
      targetRefs: ElementOrDirectiveRef[], targetVars: VariableAst[]): boolean {
    var attrName = this._normalizeAttributeName(attr.name);
    var attrValue = attr.value;
    var bindParts = RegExpWrapper.firstMatch(BIND_NAME_REGEXP, attrName);
    var hasBinding = false;
    if (isPresent(bindParts)) {
      hasBinding = true;
      if (isPresent(bindParts[1])) {  // match: bind-prop
        this._parseProperty(
            bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);

      } else if (isPresent(bindParts[2])) {  // match: var-name / var-name="iden"
        var identifier = bindParts[8];
        if (isTemplateElement) {
          this._reportError(
              `"var-" on <template> elements is deprecated. Use "let-" instead!`, attr.sourceSpan,
              ParseErrorLevel.WARNING);
          this._parseVariable(identifier, attrValue, attr.sourceSpan, targetVars);
        } else {
          this._reportError(
              `"var-" on non <template> elements is deprecated. Use "ref-" instead!`,
              attr.sourceSpan, ParseErrorLevel.WARNING);
          this._parseReference(identifier, attrValue, attr.sourceSpan, targetRefs);
        }

      } else if (isPresent(bindParts[3])) {  // match: let-name
        if (isTemplateElement) {
          var identifier = bindParts[8];
          this._parseVariable(identifier, attrValue, attr.sourceSpan, targetVars);
        } else {
          this._reportError(`"let-" is only supported on template elements.`, attr.sourceSpan);
        }

      } else if (isPresent(bindParts[4])) {  // match: ref- / #iden
        var identifier = bindParts[8];
        this._parseReference(identifier, attrValue, attr.sourceSpan, targetRefs);

      } else if (isPresent(bindParts[5])) {  // match: on-event
        this._parseEvent(
            bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);

      } else if (isPresent(bindParts[6])) {  // match: bindon-prop
        this._parseProperty(
            bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
        this._parseAssignmentEvent(
            bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);

      } else if (isPresent(bindParts[7])) {  // match: animate-name
        this._parseAnimation(
            bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetAnimationProps);
      } else if (isPresent(bindParts[9])) {  // match: [(expr)]
        this._parseProperty(
            bindParts[9], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
        this._parseAssignmentEvent(
            bindParts[9], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);

      } else if (isPresent(bindParts[10])) {  // match: [expr]
        this._parseProperty(
            bindParts[10], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);

      } else if (isPresent(bindParts[11])) {  // match: (event)
        this._parseEvent(
            bindParts[11], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
      }
    } else {
      hasBinding = this._parsePropertyInterpolation(
          attrName, attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
    }
    if (!hasBinding) {
      this._parseLiteralAttr(attrName, attrValue, attr.sourceSpan, targetProps);
    }
    return hasBinding;
  }

  private _normalizeAttributeName(attrName: string): string {
    return attrName.toLowerCase().startsWith('data-') ? attrName.substring(5) : attrName;
  }

  private _parseVariable(
      identifier: string, value: string, sourceSpan: ParseSourceSpan, targetVars: VariableAst[]) {
    if (identifier.indexOf('-') > -1) {
      this._reportError(`"-" is not allowed in variable names`, sourceSpan);
    }

    targetVars.push(new VariableAst(identifier, value, sourceSpan));
  }

  private _parseReference(
      identifier: string, value: string, sourceSpan: ParseSourceSpan,
      targetRefs: ElementOrDirectiveRef[]) {
    if (identifier.indexOf('-') > -1) {
      this._reportError(`"-" is not allowed in reference names`, sourceSpan);
    }

    targetRefs.push(new ElementOrDirectiveRef(identifier, value, sourceSpan));
  }

  private _parseProperty(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetProps: BoundElementOrDirectiveProperty[]) {
    this._parsePropertyAst(
        name, this._parseBinding(expression, sourceSpan), sourceSpan, targetMatchableAttrs,
        targetProps);
  }

  private _parseAnimation(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetAnimationProps: BoundElementPropertyAst[]) {
    var ast = this._parseBinding(expression, sourceSpan);
    targetMatchableAttrs.push([name, ast.source]);
    targetAnimationProps.push(new BoundElementPropertyAst(
        name, PropertyBindingType.Animation, SecurityContext.NONE, ast, null, sourceSpan));
  }

  private _parsePropertyInterpolation(
      name: string, value: string, sourceSpan: ParseSourceSpan, targetMatchableAttrs: string[][],
      targetProps: BoundElementOrDirectiveProperty[]): boolean {
    var expr = this._parseInterpolation(value, sourceSpan);
    if (isPresent(expr)) {
      this._parsePropertyAst(name, expr, sourceSpan, targetMatchableAttrs, targetProps);
      return true;
    }
    return false;
  }

  private _parsePropertyAst(
      name: string, ast: ASTWithSource, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetProps: BoundElementOrDirectiveProperty[]) {
    targetMatchableAttrs.push([name, ast.source]);
    targetProps.push(new BoundElementOrDirectiveProperty(name, ast, false, sourceSpan));
  }

  private _parseAssignmentEvent(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetEvents: BoundEventAst[]) {
    this._parseEvent(
        `${name}Change`, `${expression}=$event`, sourceSpan, targetMatchableAttrs, targetEvents);
  }

  private _parseEvent(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetEvents: BoundEventAst[]) {
    // long format: 'target: eventName'
    var parts = splitAtColon(name, [null, name]);
    var target = parts[0];
    var eventName = parts[1];
    var ast = this._parseAction(expression, sourceSpan);
    targetMatchableAttrs.push([name, ast.source]);
    targetEvents.push(new BoundEventAst(eventName, target, ast, sourceSpan));
    // Don't detect directives for event names for now,
    // so don't add the event name to the matchableAttrs
  }

  private _parseLiteralAttr(
      name: string, value: string, sourceSpan: ParseSourceSpan,
      targetProps: BoundElementOrDirectiveProperty[]) {
    targetProps.push(new BoundElementOrDirectiveProperty(
        name, this._exprParser.wrapLiteralPrimitive(value, ''), true, sourceSpan));
  }

  private _parseDirectives(selectorMatcher: SelectorMatcher, elementCssSelector: CssSelector):
      CompileDirectiveMetadata[] {
    // Need to sort the directives so that we get consistent results throughout,
    // as selectorMatcher uses Maps inside.
    // Also dedupe directives as they might match more than one time!
    var directives = ListWrapper.createFixedSize(this.directivesIndex.size);
    selectorMatcher.match(elementCssSelector, (selector, directive) => {
      directives[this.directivesIndex.get(directive)] = directive;
    });
    return directives.filter(dir => isPresent(dir));
  }

  private _createDirectiveAsts(
      isTemplateElement: boolean, elementName: string, directives: CompileDirectiveMetadata[],
      props: BoundElementOrDirectiveProperty[], elementOrDirectiveRefs: ElementOrDirectiveRef[],
      sourceSpan: ParseSourceSpan, targetReferences: ReferenceAst[]): DirectiveAst[] {
    var matchedReferences = new Set<string>();
    var component: CompileDirectiveMetadata = null;
    var directiveAsts = directives.map((directive: CompileDirectiveMetadata) => {
      if (directive.isComponent) {
        component = directive;
      }
      var hostProperties: BoundElementPropertyAst[] = [];
      var hostEvents: BoundEventAst[] = [];
      var directiveProperties: BoundDirectivePropertyAst[] = [];
      this._createDirectiveHostPropertyAsts(
          elementName, directive.hostProperties, sourceSpan, hostProperties);
      this._createDirectiveHostEventAsts(directive.hostListeners, sourceSpan, hostEvents);
      this._createDirectivePropertyAsts(directive.inputs, props, directiveProperties);
      elementOrDirectiveRefs.forEach((elOrDirRef) => {
        if ((elOrDirRef.value.length === 0 && directive.isComponent) ||
            (directive.exportAs == elOrDirRef.value)) {
          targetReferences.push(new ReferenceAst(
              elOrDirRef.name, identifierToken(directive.type), elOrDirRef.sourceSpan));
          matchedReferences.add(elOrDirRef.name);
        }
      });
      return new DirectiveAst(
          directive, directiveProperties, hostProperties, hostEvents, sourceSpan);
    });
    elementOrDirectiveRefs.forEach((elOrDirRef) => {
      if (elOrDirRef.value.length > 0) {
        if (!SetWrapper.has(matchedReferences, elOrDirRef.name)) {
          this._reportError(
              `There is no directive with "exportAs" set to "${elOrDirRef.value}"`,
              elOrDirRef.sourceSpan);
        };
      } else if (isBlank(component)) {
        var refToken: any /** TODO #???? */ = null;
        if (isTemplateElement) {
          refToken = identifierToken(Identifiers.TemplateRef);
        }
        targetReferences.push(new ReferenceAst(elOrDirRef.name, refToken, elOrDirRef.sourceSpan));
      }
    });  // fix syntax highlighting issue: `
    return directiveAsts;
  }

  private _createDirectiveHostPropertyAsts(
      elementName: string, hostProps: {[key: string]: string}, sourceSpan: ParseSourceSpan,
      targetPropertyAsts: BoundElementPropertyAst[]) {
    if (isPresent(hostProps)) {
      StringMapWrapper.forEach(hostProps, (expression: string, propName: string) => {
        var exprAst = this._parseBinding(expression, sourceSpan);
        targetPropertyAsts.push(
            this._createElementPropertyAst(elementName, propName, exprAst, sourceSpan));
      });
    }
  }

  private _createDirectiveHostEventAsts(
      hostListeners: {[key: string]: string}, sourceSpan: ParseSourceSpan,
      targetEventAsts: BoundEventAst[]) {
    if (isPresent(hostListeners)) {
      StringMapWrapper.forEach(hostListeners, (expression: string, propName: string) => {
        this._parseEvent(propName, expression, sourceSpan, [], targetEventAsts);
      });
    }
  }

  private _createDirectivePropertyAsts(
      directiveProperties: {[key: string]: string}, boundProps: BoundElementOrDirectiveProperty[],
      targetBoundDirectiveProps: BoundDirectivePropertyAst[]) {
    if (isPresent(directiveProperties)) {
      var boundPropsByName = new Map<string, BoundElementOrDirectiveProperty>();
      boundProps.forEach(boundProp => {
        var prevValue = boundPropsByName.get(boundProp.name);
        if (isBlank(prevValue) || prevValue.isLiteral) {
          // give [a]="b" a higher precedence than a="b" on the same element
          boundPropsByName.set(boundProp.name, boundProp);
        }
      });

      StringMapWrapper.forEach(directiveProperties, (elProp: string, dirProp: string) => {
        var boundProp = boundPropsByName.get(elProp);

        // Bindings are optional, so this binding only needs to be set up if an expression is given.
        if (isPresent(boundProp)) {
          targetBoundDirectiveProps.push(new BoundDirectivePropertyAst(
              dirProp, boundProp.name, boundProp.expression, boundProp.sourceSpan));
        }
      });
    }
  }

  private _createElementPropertyAsts(
      elementName: string, props: BoundElementOrDirectiveProperty[],
      directives: DirectiveAst[]): BoundElementPropertyAst[] {
    var boundElementProps: BoundElementPropertyAst[] = [];
    var boundDirectivePropsIndex = new Map<string, BoundDirectivePropertyAst>();
    directives.forEach((directive: DirectiveAst) => {
      directive.inputs.forEach((prop: BoundDirectivePropertyAst) => {
        boundDirectivePropsIndex.set(prop.templateName, prop);
      });
    });
    props.forEach((prop: BoundElementOrDirectiveProperty) => {
      if (!prop.isLiteral && isBlank(boundDirectivePropsIndex.get(prop.name))) {
        boundElementProps.push(this._createElementPropertyAst(
            elementName, prop.name, prop.expression, prop.sourceSpan));
      }
    });
    return boundElementProps;
  }

  private _createElementPropertyAst(
      elementName: string, name: string, ast: AST,
      sourceSpan: ParseSourceSpan): BoundElementPropertyAst {
    var unit: any /** TODO #???? */ = null;
    var bindingType: any /** TODO #???? */;
    var boundPropertyName: string;
    var parts = name.split(PROPERTY_PARTS_SEPARATOR);
    let securityContext: SecurityContext;
    if (parts.length === 1) {
      boundPropertyName = this._schemaRegistry.getMappedPropName(parts[0]);
      securityContext = this._schemaRegistry.securityContext(elementName, boundPropertyName);
      bindingType = PropertyBindingType.Property;
      if (!this._schemaRegistry.hasProperty(elementName, boundPropertyName)) {
        this._reportError(
            `Can't bind to '${boundPropertyName}' since it isn't a known native property`,
            sourceSpan);
      }
    } else {
      if (parts[0] == ATTRIBUTE_PREFIX) {
        boundPropertyName = parts[1];
        if (boundPropertyName.toLowerCase().startsWith('on')) {
          this._reportError(
              `Binding to event attribute '${boundPropertyName}' is disallowed ` +
                  `for security reasons, please use (${boundPropertyName.slice(2)})=...`,
              sourceSpan);
        }
        // NB: For security purposes, use the mapped property name, not the attribute name.
        securityContext = this._schemaRegistry.securityContext(
            elementName, this._schemaRegistry.getMappedPropName(boundPropertyName));
        let nsSeparatorIdx = boundPropertyName.indexOf(':');
        if (nsSeparatorIdx > -1) {
          let ns = boundPropertyName.substring(0, nsSeparatorIdx);
          let name = boundPropertyName.substring(nsSeparatorIdx + 1);
          boundPropertyName = mergeNsAndName(ns, name);
        }

        bindingType = PropertyBindingType.Attribute;
      } else if (parts[0] == CLASS_PREFIX) {
        boundPropertyName = parts[1];
        bindingType = PropertyBindingType.Class;
        securityContext = SecurityContext.NONE;
      } else if (parts[0] == STYLE_PREFIX) {
        unit = parts.length > 2 ? parts[2] : null;
        boundPropertyName = parts[1];
        bindingType = PropertyBindingType.Style;
        securityContext = SecurityContext.STYLE;
      } else {
        this._reportError(`Invalid property name '${name}'`, sourceSpan);
        bindingType = null;
        securityContext = null;
      }
    }

    return new BoundElementPropertyAst(
        boundPropertyName, bindingType, securityContext, ast, unit, sourceSpan);
  }


  private _findComponentDirectiveNames(directives: DirectiveAst[]): string[] {
    var componentTypeNames: string[] = [];
    directives.forEach(directive => {
      var typeName = directive.directive.type.name;
      if (directive.directive.isComponent) {
        componentTypeNames.push(typeName);
      }
    });
    return componentTypeNames;
  }

  private _assertOnlyOneComponent(directives: DirectiveAst[], sourceSpan: ParseSourceSpan) {
    var componentTypeNames = this._findComponentDirectiveNames(directives);
    if (componentTypeNames.length > 1) {
      this._reportError(`More than one component: ${componentTypeNames.join(',')}`, sourceSpan);
    }
  }

  private _assertNoComponentsNorElementBindingsOnTemplate(
      directives: DirectiveAst[], elementProps: BoundElementPropertyAst[],
      sourceSpan: ParseSourceSpan) {
    var componentTypeNames: string[] = this._findComponentDirectiveNames(directives);
    if (componentTypeNames.length > 0) {
      this._reportError(
          `Components on an embedded template: ${componentTypeNames.join(',')}`, sourceSpan);
    }
    elementProps.forEach(prop => {
      this._reportError(
          `Property binding ${prop.name} not used by any directive on an embedded template`,
          sourceSpan);
    });
  }

  private _assertAllEventsPublishedByDirectives(
      directives: DirectiveAst[], events: BoundEventAst[]) {
    var allDirectiveEvents = new Set<string>();
    directives.forEach(directive => {
      StringMapWrapper.forEach(
          directive.directive.outputs,
          (eventName: string, _: any /** TODO #???? */) => { allDirectiveEvents.add(eventName); });
    });
    events.forEach(event => {
      if (isPresent(event.target) || !SetWrapper.has(allDirectiveEvents, event.name)) {
        this._reportError(
            `Event binding ${event.fullName} not emitted by any directive on an embedded template`,
            event.sourceSpan);
      }
    });
  }
}

class NonBindableVisitor implements HtmlAstVisitor {
  visitElement(ast: HtmlElementAst, parent: ElementContext): ElementAst {
    var preparsedElement = preparseElement(ast);
    if (preparsedElement.type === PreparsedElementType.SCRIPT ||
        preparsedElement.type === PreparsedElementType.STYLE ||
        preparsedElement.type === PreparsedElementType.STYLESHEET) {
      // Skipping <script> for security reasons
      // Skipping <style> and stylesheets as we already processed them
      // in the StyleCompiler
      return null;
    }

    var attrNameAndValues = ast.attrs.map(attrAst => [attrAst.name, attrAst.value]);
    var selector = createElementCssSelector(ast.name, attrNameAndValues);
    var ngContentIndex = parent.findNgContentIndex(selector);
    var children = htmlVisitAll(this, ast.children, EMPTY_ELEMENT_CONTEXT);
    return new ElementAst(
        ast.name, htmlVisitAll(this, ast.attrs), [], [], [], [], [], false, children,
        ngContentIndex, ast.sourceSpan);
  }
  visitComment(ast: HtmlCommentAst, context: any): any { return null; }
  visitAttr(ast: HtmlAttrAst, context: any): AttrAst {
    return new AttrAst(ast.name, ast.value, ast.sourceSpan);
  }
  visitText(ast: HtmlTextAst, parent: ElementContext): TextAst {
    var ngContentIndex = parent.findNgContentIndex(TEXT_CSS_SELECTOR);
    return new TextAst(ast.value, ngContentIndex, ast.sourceSpan);
  }
  visitExpansion(ast: HtmlExpansionAst, context: any): any { return ast; }
  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any { return ast; }
}

class BoundElementOrDirectiveProperty {
  constructor(
      public name: string, public expression: AST, public isLiteral: boolean,
      public sourceSpan: ParseSourceSpan) {}
}

class ElementOrDirectiveRef {
  constructor(public name: string, public value: string, public sourceSpan: ParseSourceSpan) {}
}

export function splitClasses(classAttrValue: string): string[] {
  return StringWrapper.split(classAttrValue.trim(), /\s+/g);
}

class ElementContext {
  static create(
      isTemplateElement: boolean, directives: DirectiveAst[],
      providerContext: ProviderElementContext): ElementContext {
    var matcher = new SelectorMatcher();
    var wildcardNgContentIndex: any /** TODO #???? */ = null;
    var component = directives.find(directive => directive.directive.isComponent);
    if (isPresent(component)) {
      var ngContentSelectors = component.directive.template.ngContentSelectors;
      for (var i = 0; i < ngContentSelectors.length; i++) {
        var selector = ngContentSelectors[i];
        if (StringWrapper.equals(selector, '*')) {
          wildcardNgContentIndex = i;
        } else {
          matcher.addSelectables(CssSelector.parse(ngContentSelectors[i]), i);
        }
      }
    }
    return new ElementContext(isTemplateElement, matcher, wildcardNgContentIndex, providerContext);
  }
  constructor(
      public isTemplateElement: boolean, private _ngContentIndexMatcher: SelectorMatcher,
      private _wildcardNgContentIndex: number, public providerContext: ProviderElementContext) {}

  findNgContentIndex(selector: CssSelector): number {
    var ngContentIndices: any[] /** TODO #???? */ = [];
    this._ngContentIndexMatcher.match(
        selector, (selector, ngContentIndex) => { ngContentIndices.push(ngContentIndex); });
    ListWrapper.sort(ngContentIndices);
    if (isPresent(this._wildcardNgContentIndex)) {
      ngContentIndices.push(this._wildcardNgContentIndex);
    }
    return ngContentIndices.length > 0 ? ngContentIndices[0] : null;
  }
}

function createElementCssSelector(elementName: string, matchableAttrs: string[][]): CssSelector {
  var cssSelector = new CssSelector();
  let elNameNoNs = splitNsName(elementName)[1];

  cssSelector.setElement(elNameNoNs);

  for (var i = 0; i < matchableAttrs.length; i++) {
    let attrName = matchableAttrs[i][0];
    let attrNameNoNs = splitNsName(attrName)[1];
    let attrValue = matchableAttrs[i][1];

    cssSelector.addAttribute(attrNameNoNs, attrValue);
    if (attrName.toLowerCase() == CLASS_ATTR) {
      var classes = splitClasses(attrValue);
      classes.forEach(className => cssSelector.addClassName(className));
    }
  }
  return cssSelector;
}

var EMPTY_ELEMENT_CONTEXT = new ElementContext(true, new SelectorMatcher(), null, null);
var NON_BINDABLE_VISITOR = new NonBindableVisitor();


export class PipeCollector extends RecursiveAstVisitor {
  pipes: Set<string> = new Set<string>();
  visitPipe(ast: BindingPipe, context: any): any {
    this.pipes.add(ast.name);
    ast.exp.visit(this);
    this.visitAll(ast.args, context);
    return null;
  }
}

function removeDuplicates(items: CompileMetadataWithType[]): CompileMetadataWithType[] {
  let res: any[] /** TODO #???? */ = [];
  items.forEach(item => {
    let hasMatch =
        res.filter(
               r => r.type.name == item.type.name && r.type.moduleUrl == item.type.moduleUrl &&
                   r.type.runtime == item.type.runtime)
            .length > 0;
    if (!hasMatch) {
      res.push(item);
    }
  });
  return res;
}

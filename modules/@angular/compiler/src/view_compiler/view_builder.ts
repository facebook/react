import {ChangeDetectionStrategy, ViewEncapsulation} from '@angular/core';

import {ViewType, isDefaultChangeDetectionStrategy} from '../../core_private';
import {ListWrapper, SetWrapper, StringMapWrapper} from '../facade/collection';
import {StringWrapper, isPresent} from '../facade/lang';
import {Identifiers, identifierToken} from '../identifiers';
import * as o from '../output/output_ast';

import {CompileElement, CompileNode} from './compile_element';
import {CompileView} from './compile_view';
import {ChangeDetectionStrategyEnum, DetectChangesVars, InjectMethodVars, ViewConstructorVars, ViewEncapsulationEnum, ViewProperties, ViewTypeEnum} from './constants';

import {TemplateAst, TemplateAstVisitor, NgContentAst, EmbeddedTemplateAst, ElementAst, ReferenceAst, VariableAst, BoundEventAst, BoundElementPropertyAst, AttrAst, BoundTextAst, TextAst, DirectiveAst, BoundDirectivePropertyAst, templateVisitAll,} from '../template_ast';

import {getViewFactoryName, createFlatArray, createDiTokenExpression} from './util';

import {CompileIdentifierMetadata, CompileDirectiveMetadata, CompileTokenMetadata} from '../compile_metadata';

import {AnimationCompiler} from '../animation/animation_compiler';

const IMPLICIT_TEMPLATE_VAR = '\$implicit';
const CLASS_ATTR = 'class';
const STYLE_ATTR = 'style';
const NG_CONTAINER_TAG = 'ng-container';

var parentRenderNodeVar = o.variable('parentRenderNode');
var rootSelectorVar = o.variable('rootSelector');

export class ViewCompileDependency {
  constructor(
      public comp: CompileDirectiveMetadata, public factoryPlaceholder: CompileIdentifierMetadata) {
  }
}

export function buildView(
    view: CompileView, template: TemplateAst[],
    targetDependencies: ViewCompileDependency[]): number {
  var builderVisitor = new ViewBuilderVisitor(view, targetDependencies);
  templateVisitAll(
      builderVisitor, template,
      view.declarationElement.isNull() ? view.declarationElement : view.declarationElement.parent);
  return builderVisitor.nestedViewCount;
}

export function finishView(view: CompileView, targetStatements: o.Statement[]) {
  view.afterNodes();
  createViewTopLevelStmts(view, targetStatements);
  view.nodes.forEach((node) => {
    if (node instanceof CompileElement && node.hasEmbeddedView) {
      finishView(node.embeddedView, targetStatements);
    }
  });
}

class ViewBuilderVisitor implements TemplateAstVisitor {
  nestedViewCount: number = 0;

  private _animationCompiler = new AnimationCompiler();

  constructor(public view: CompileView, public targetDependencies: ViewCompileDependency[]) {}

  private _isRootNode(parent: CompileElement): boolean { return parent.view !== this.view; }

  private _addRootNodeAndProject(node: CompileNode) {
    var projectedNode = _getOuterContainerOrSelf(node);
    var parent = projectedNode.parent;
    var ngContentIndex = (<any>projectedNode.sourceAst).ngContentIndex;
    var vcAppEl =
        (node instanceof CompileElement && node.hasViewContainer) ? node.appElement : null;
    if (this._isRootNode(parent)) {
      // store appElement as root node only for ViewContainers
      if (this.view.viewType !== ViewType.COMPONENT) {
        this.view.rootNodesOrAppElements.push(isPresent(vcAppEl) ? vcAppEl : node.renderNode);
      }
    } else if (isPresent(parent.component) && isPresent(ngContentIndex)) {
      parent.addContentNode(ngContentIndex, isPresent(vcAppEl) ? vcAppEl : node.renderNode);
    }
  }

  private _getParentRenderNode(parent: CompileElement): o.Expression {
    parent = _getOuterContainerParentOrSelf(parent);
    if (this._isRootNode(parent)) {
      if (this.view.viewType === ViewType.COMPONENT) {
        return parentRenderNodeVar;
      } else {
        // root node of an embedded/host view
        return o.NULL_EXPR;
      }
    } else {
      return isPresent(parent.component) &&
              parent.component.template.encapsulation !== ViewEncapsulation.Native ?
          o.NULL_EXPR :
          parent.renderNode;
    }
  }

  visitBoundText(ast: BoundTextAst, parent: CompileElement): any {
    return this._visitText(ast, '', parent);
  }
  visitText(ast: TextAst, parent: CompileElement): any {
    return this._visitText(ast, ast.value, parent);
  }
  private _visitText(ast: TemplateAst, value: string, parent: CompileElement): o.Expression {
    var fieldName = `_text_${this.view.nodes.length}`;
    this.view.fields.push(
        new o.ClassField(fieldName, o.importType(this.view.genConfig.renderTypes.renderText)));
    var renderNode = o.THIS_EXPR.prop(fieldName);
    var compileNode = new CompileNode(parent, this.view, this.view.nodes.length, renderNode, ast);
    var createRenderNode =
        o.THIS_EXPR.prop(fieldName)
            .set(ViewProperties.renderer.callMethod(
                'createText',
                [
                  this._getParentRenderNode(parent), o.literal(value),
                  this.view.createMethod.resetDebugInfoExpr(this.view.nodes.length, ast)
                ]))
            .toStmt();
    this.view.nodes.push(compileNode);
    this.view.createMethod.addStmt(createRenderNode);
    this._addRootNodeAndProject(compileNode);
    return renderNode;
  }

  visitNgContent(ast: NgContentAst, parent: CompileElement): any {
    // the projected nodes originate from a different view, so we don't
    // have debug information for them...
    this.view.createMethod.resetDebugInfo(null, ast);
    var parentRenderNode = this._getParentRenderNode(parent);
    var nodesExpression = ViewProperties.projectableNodes.key(
        o.literal(ast.index),
        new o.ArrayType(o.importType(this.view.genConfig.renderTypes.renderNode)));
    if (parentRenderNode !== o.NULL_EXPR) {
      this.view.createMethod.addStmt(
          ViewProperties.renderer
              .callMethod(
                  'projectNodes',
                  [
                    parentRenderNode,
                    o.importExpr(Identifiers.flattenNestedViewRenderNodes).callFn([nodesExpression])
                  ])
              .toStmt());
    } else if (this._isRootNode(parent)) {
      if (this.view.viewType !== ViewType.COMPONENT) {
        // store root nodes only for embedded/host views
        this.view.rootNodesOrAppElements.push(nodesExpression);
      }
    } else {
      if (isPresent(parent.component) && isPresent(ast.ngContentIndex)) {
        parent.addContentNode(ast.ngContentIndex, nodesExpression);
      }
    }
    return null;
  }

  visitElement(ast: ElementAst, parent: CompileElement): any {
    var nodeIndex = this.view.nodes.length;
    var createRenderNodeExpr: o.InvokeMethodExpr;
    var debugContextExpr = this.view.createMethod.resetDebugInfoExpr(nodeIndex, ast);
    if (nodeIndex === 0 && this.view.viewType === ViewType.HOST) {
      createRenderNodeExpr = o.THIS_EXPR.callMethod(
          'selectOrCreateHostElement', [o.literal(ast.name), rootSelectorVar, debugContextExpr]);
    } else {
      if (ast.name === NG_CONTAINER_TAG) {
        createRenderNodeExpr = ViewProperties.renderer.callMethod(
            'createTemplateAnchor', [this._getParentRenderNode(parent), debugContextExpr]);
      } else {
        createRenderNodeExpr = ViewProperties.renderer.callMethod(
            'createElement',
            [this._getParentRenderNode(parent), o.literal(ast.name), debugContextExpr]);
      }
    }
    var fieldName = `_el_${nodeIndex}`;
    this.view.fields.push(
        new o.ClassField(fieldName, o.importType(this.view.genConfig.renderTypes.renderElement)));
    this.view.createMethod.addStmt(o.THIS_EXPR.prop(fieldName).set(createRenderNodeExpr).toStmt());

    var renderNode = o.THIS_EXPR.prop(fieldName);

    var directives = ast.directives.map(directiveAst => directiveAst.directive);
    var component = directives.find(directive => directive.isComponent);
    var htmlAttrs = _readHtmlAttrs(ast.attrs);
    var attrNameAndValues = _mergeHtmlAndDirectiveAttrs(htmlAttrs, directives);
    for (var i = 0; i < attrNameAndValues.length; i++) {
      var attrName = attrNameAndValues[i][0];
      var attrValue = attrNameAndValues[i][1];
      this.view.createMethod.addStmt(
          ViewProperties.renderer
              .callMethod(
                  'setElementAttribute', [renderNode, o.literal(attrName), o.literal(attrValue)])
              .toStmt());
    }
    var compileElement = new CompileElement(
        parent, this.view, nodeIndex, renderNode, ast, component, directives, ast.providers,
        ast.hasViewContainer, false, ast.references);
    this.view.nodes.push(compileElement);
    var compViewExpr: o.ReadVarExpr = null;
    if (isPresent(component)) {
      var nestedComponentIdentifier =
          new CompileIdentifierMetadata({name: getViewFactoryName(component, 0)});
      this.targetDependencies.push(new ViewCompileDependency(component, nestedComponentIdentifier));
      compViewExpr = o.variable(`compView_${nodeIndex}`);  // fix highlighting: `
      compileElement.setComponentView(compViewExpr);
      this.view.createMethod.addStmt(
          compViewExpr
              .set(o.importExpr(nestedComponentIdentifier).callFn([
                ViewProperties.viewUtils, compileElement.injector, compileElement.appElement
              ]))
              .toDeclStmt());
    }
    compileElement.beforeChildren();
    this._addRootNodeAndProject(compileElement);
    templateVisitAll(this, ast.children, compileElement);
    compileElement.afterChildren(this.view.nodes.length - nodeIndex - 1);

    if (isPresent(compViewExpr)) {
      var codeGenContentNodes: o.Expression;
      if (this.view.component.type.isHost) {
        codeGenContentNodes = ViewProperties.projectableNodes;
      } else {
        codeGenContentNodes = o.literalArr(
            compileElement.contentNodesByNgContentIndex.map(nodes => createFlatArray(nodes)));
      }
      this.view.createMethod.addStmt(
          compViewExpr
              .callMethod(
                  'create', [compileElement.getComponent(), codeGenContentNodes, o.NULL_EXPR])
              .toStmt());
    }
    return null;
  }

  visitEmbeddedTemplate(ast: EmbeddedTemplateAst, parent: CompileElement): any {
    var nodeIndex = this.view.nodes.length;
    var fieldName = `_anchor_${nodeIndex}`;
    this.view.fields.push(
        new o.ClassField(fieldName, o.importType(this.view.genConfig.renderTypes.renderComment)));
    this.view.createMethod.addStmt(
        o.THIS_EXPR.prop(fieldName)
            .set(ViewProperties.renderer.callMethod(
                'createTemplateAnchor',
                [
                  this._getParentRenderNode(parent),
                  this.view.createMethod.resetDebugInfoExpr(nodeIndex, ast)
                ]))
            .toStmt());
    var renderNode = o.THIS_EXPR.prop(fieldName);

    var templateVariableBindings = ast.variables.map(
        varAst => [varAst.value.length > 0 ? varAst.value : IMPLICIT_TEMPLATE_VAR, varAst.name]);

    var directives = ast.directives.map(directiveAst => directiveAst.directive);
    var compileElement = new CompileElement(
        parent, this.view, nodeIndex, renderNode, ast, null, directives, ast.providers,
        ast.hasViewContainer, true, ast.references);
    this.view.nodes.push(compileElement);

    var compiledAnimations = this._animationCompiler.compileComponent(this.view.component);

    this.nestedViewCount++;
    var embeddedView = new CompileView(
        this.view.component, this.view.genConfig, this.view.pipeMetas, o.NULL_EXPR,
        compiledAnimations, this.view.viewIndex + this.nestedViewCount, compileElement,
        templateVariableBindings);
    this.nestedViewCount += buildView(embeddedView, ast.children, this.targetDependencies);

    compileElement.beforeChildren();
    this._addRootNodeAndProject(compileElement);
    compileElement.afterChildren(0);

    return null;
  }

  visitAttr(ast: AttrAst, ctx: any): any { return null; }
  visitDirective(ast: DirectiveAst, ctx: any): any { return null; }
  visitEvent(ast: BoundEventAst, eventTargetAndNames: Map<string, BoundEventAst>): any {
    return null;
  }

  visitReference(ast: ReferenceAst, ctx: any): any { return null; }
  visitVariable(ast: VariableAst, ctx: any): any { return null; }
  visitDirectiveProperty(ast: BoundDirectivePropertyAst, context: any): any { return null; }
  visitElementProperty(ast: BoundElementPropertyAst, context: any): any { return null; }
}

/**
 * Walks up the nodes while the direct parent is a container.
 *
 * Returns the outer container or the node itself when it is not a direct child of a container.
 *
 * @internal
 */
function _getOuterContainerOrSelf(node: CompileNode): CompileNode {
  const view = node.view;

  while (_isNgContainer(node.parent, view)) {
    node = node.parent;
  }

  return node;
}

/**
 * Walks up the nodes while they are container and returns the first parent which is not.
 *
 * Returns the parent of the outer container or the node itself when it is not a container.
 *
 * @internal
 */
function _getOuterContainerParentOrSelf(el: CompileElement): CompileElement {
  const view = el.view;

  while (_isNgContainer(el, view)) {
    el = el.parent;
  }

  return el;
}

function _isNgContainer(node: CompileNode, view: CompileView): boolean {
  return !node.isNull() && (<ElementAst>node.sourceAst).name === NG_CONTAINER_TAG &&
      node.view === view;
}


function _mergeHtmlAndDirectiveAttrs(
    declaredHtmlAttrs: {[key: string]: string},
    directives: CompileDirectiveMetadata[]): string[][] {
  var result: {[key: string]: string} = {};
  StringMapWrapper.forEach(
      declaredHtmlAttrs, (value: string, key: string) => { result[key] = value; });
  directives.forEach(directiveMeta => {
    StringMapWrapper.forEach(directiveMeta.hostAttributes, (value: string, name: string) => {
      var prevValue = result[name];
      result[name] = isPresent(prevValue) ? mergeAttributeValue(name, prevValue, value) : value;
    });
  });
  return mapToKeyValueArray(result);
}

function _readHtmlAttrs(attrs: AttrAst[]): {[key: string]: string} {
  var htmlAttrs: {[key: string]: string} = {};
  attrs.forEach((ast) => { htmlAttrs[ast.name] = ast.value; });
  return htmlAttrs;
}

function mergeAttributeValue(attrName: string, attrValue1: string, attrValue2: string): string {
  if (attrName == CLASS_ATTR || attrName == STYLE_ATTR) {
    return `${attrValue1} ${attrValue2}`;
  } else {
    return attrValue2;
  }
}

function mapToKeyValueArray(data: {[key: string]: string}): string[][] {
  var entryArray: string[][] = [];
  StringMapWrapper.forEach(data, (value: string, name: string) => {
    entryArray.push([name, value]);
  });
  // We need to sort to get a defined output order
  // for tests and for caching generated artifacts...
  ListWrapper.sort(entryArray, (entry1, entry2) => StringWrapper.compare(entry1[0], entry2[0]));
  return entryArray;
}

function createViewTopLevelStmts(view: CompileView, targetStatements: o.Statement[]) {
  var nodeDebugInfosVar: o.Expression = o.NULL_EXPR;
  if (view.genConfig.genDebugInfo) {
    nodeDebugInfosVar = o.variable(
        `nodeDebugInfos_${view.component.type.name}${view.viewIndex}`);  // fix highlighting: `
    targetStatements.push(
        (<o.ReadVarExpr>nodeDebugInfosVar)
            .set(o.literalArr(
                view.nodes.map(createStaticNodeDebugInfo),
                new o.ArrayType(
                    new o.ExternalType(Identifiers.StaticNodeDebugInfo), [o.TypeModifier.Const])))
            .toDeclStmt(null, [o.StmtModifier.Final]));
  }


  var renderCompTypeVar: o.ReadVarExpr =
      o.variable(`renderType_${view.component.type.name}`);  // fix highlighting: `
  if (view.viewIndex === 0) {
    targetStatements.push(renderCompTypeVar.set(o.NULL_EXPR)
                              .toDeclStmt(o.importType(Identifiers.RenderComponentType)));
  }

  var viewClass = createViewClass(view, renderCompTypeVar, nodeDebugInfosVar);
  targetStatements.push(viewClass);
  targetStatements.push(createViewFactory(view, viewClass, renderCompTypeVar));
}

function createStaticNodeDebugInfo(node: CompileNode): o.Expression {
  var compileElement = node instanceof CompileElement ? node : null;
  var providerTokens: o.Expression[] = [];
  var componentToken: o.Expression = o.NULL_EXPR;
  var varTokenEntries: any[] = [];
  if (isPresent(compileElement)) {
    providerTokens = compileElement.getProviderTokens();
    if (isPresent(compileElement.component)) {
      componentToken = createDiTokenExpression(identifierToken(compileElement.component.type));
    }
    StringMapWrapper.forEach(
        compileElement.referenceTokens, (token: CompileTokenMetadata, varName: string) => {
          varTokenEntries.push(
              [varName, isPresent(token) ? createDiTokenExpression(token) : o.NULL_EXPR]);
        });
  }
  return o.importExpr(Identifiers.StaticNodeDebugInfo)
      .instantiate(
          [
            o.literalArr(providerTokens, new o.ArrayType(o.DYNAMIC_TYPE, [o.TypeModifier.Const])),
            componentToken,
            o.literalMap(varTokenEntries, new o.MapType(o.DYNAMIC_TYPE, [o.TypeModifier.Const]))
          ],
          o.importType(Identifiers.StaticNodeDebugInfo, null, [o.TypeModifier.Const]));
}

function createViewClass(
    view: CompileView, renderCompTypeVar: o.ReadVarExpr,
    nodeDebugInfosVar: o.Expression): o.ClassStmt {
  var viewConstructorArgs = [
    new o.FnParam(ViewConstructorVars.viewUtils.name, o.importType(Identifiers.ViewUtils)),
    new o.FnParam(ViewConstructorVars.parentInjector.name, o.importType(Identifiers.Injector)),
    new o.FnParam(ViewConstructorVars.declarationEl.name, o.importType(Identifiers.AppElement))
  ];
  var superConstructorArgs = [
    o.variable(view.className), renderCompTypeVar, ViewTypeEnum.fromValue(view.viewType),
    ViewConstructorVars.viewUtils, ViewConstructorVars.parentInjector,
    ViewConstructorVars.declarationEl,
    ChangeDetectionStrategyEnum.fromValue(getChangeDetectionMode(view))
  ];
  if (view.genConfig.genDebugInfo) {
    superConstructorArgs.push(nodeDebugInfosVar);
  }
  var viewConstructor = new o.ClassMethod(
      null, viewConstructorArgs, [o.SUPER_EXPR.callFn(superConstructorArgs).toStmt()]);

  var viewMethods = [
    new o.ClassMethod(
        'createInternal', [new o.FnParam(rootSelectorVar.name, o.STRING_TYPE)],
        generateCreateMethod(view), o.importType(Identifiers.AppElement)),
    new o.ClassMethod(
        'injectorGetInternal',
        [
          new o.FnParam(InjectMethodVars.token.name, o.DYNAMIC_TYPE),
          // Note: Can't use o.INT_TYPE here as the method in AppView uses number
          new o.FnParam(InjectMethodVars.requestNodeIndex.name, o.NUMBER_TYPE),
          new o.FnParam(InjectMethodVars.notFoundResult.name, o.DYNAMIC_TYPE)
        ],
        addReturnValuefNotEmpty(view.injectorGetMethod.finish(), InjectMethodVars.notFoundResult),
        o.DYNAMIC_TYPE),
    new o.ClassMethod(
        'detectChangesInternal', [new o.FnParam(DetectChangesVars.throwOnChange.name, o.BOOL_TYPE)],
        generateDetectChangesMethod(view)),
    new o.ClassMethod('dirtyParentQueriesInternal', [], view.dirtyParentQueriesMethod.finish()),
    new o.ClassMethod('destroyInternal', [], view.destroyMethod.finish()),
    new o.ClassMethod('detachInternal', [], view.detachMethod.finish())
  ].concat(view.eventHandlerMethods);
  var superClass = view.genConfig.genDebugInfo ? Identifiers.DebugAppView : Identifiers.AppView;
  var viewClass = new o.ClassStmt(
      view.className, o.importExpr(superClass, [getContextType(view)]), view.fields, view.getters,
      viewConstructor, viewMethods.filter((method) => method.body.length > 0));
  return viewClass;
}

function createViewFactory(
    view: CompileView, viewClass: o.ClassStmt, renderCompTypeVar: o.ReadVarExpr): o.Statement {
  var viewFactoryArgs = [
    new o.FnParam(ViewConstructorVars.viewUtils.name, o.importType(Identifiers.ViewUtils)),
    new o.FnParam(ViewConstructorVars.parentInjector.name, o.importType(Identifiers.Injector)),
    new o.FnParam(ViewConstructorVars.declarationEl.name, o.importType(Identifiers.AppElement))
  ];
  var initRenderCompTypeStmts: any[] = [];
  var templateUrlInfo: string;
  if (view.component.template.templateUrl == view.component.type.moduleUrl) {
    templateUrlInfo =
        `${view.component.type.moduleUrl} class ${view.component.type.name} - inline template`;
  } else {
    templateUrlInfo = view.component.template.templateUrl;
  }
  if (view.viewIndex === 0) {
    initRenderCompTypeStmts = [new o.IfStmt(renderCompTypeVar.identical(o.NULL_EXPR), [
      renderCompTypeVar
          .set(ViewConstructorVars.viewUtils.callMethod(
              'createRenderComponentType',
              [
                o.literal(templateUrlInfo),
                o.literal(view.component.template.ngContentSelectors.length),
                ViewEncapsulationEnum.fromValue(view.component.template.encapsulation), view.styles
              ]))
          .toStmt()
    ])];
  }
  return o
      .fn(viewFactoryArgs, initRenderCompTypeStmts.concat([new o.ReturnStatement(
                               o.variable(viewClass.name)
                                   .instantiate(viewClass.constructorMethod.params.map(
                                       (param) => o.variable(param.name))))]),
          o.importType(Identifiers.AppView, [getContextType(view)]))
      .toDeclStmt(view.viewFactory.name, [o.StmtModifier.Final]);
}

function generateCreateMethod(view: CompileView): o.Statement[] {
  var parentRenderNodeExpr: o.Expression = o.NULL_EXPR;
  var parentRenderNodeStmts: any[] = [];
  if (view.viewType === ViewType.COMPONENT) {
    parentRenderNodeExpr = ViewProperties.renderer.callMethod(
        'createViewRoot', [o.THIS_EXPR.prop('declarationAppElement').prop('nativeElement')]);
    parentRenderNodeStmts =
        [parentRenderNodeVar.set(parentRenderNodeExpr)
             .toDeclStmt(
                 o.importType(view.genConfig.renderTypes.renderNode), [o.StmtModifier.Final])];
  }
  var resultExpr: o.Expression;
  if (view.viewType === ViewType.HOST) {
    resultExpr = (<CompileElement>view.nodes[0]).appElement;
  } else {
    resultExpr = o.NULL_EXPR;
  }
  return parentRenderNodeStmts.concat(view.createMethod.finish(), [
    o.THIS_EXPR
        .callMethod(
            'init',
            [
              createFlatArray(view.rootNodesOrAppElements),
              o.literalArr(view.nodes.map(node => node.renderNode)), o.literalArr(view.disposables),
              o.literalArr(view.subscriptions)
            ])
        .toStmt(),
    new o.ReturnStatement(resultExpr)
  ]);
}

function generateDetectChangesMethod(view: CompileView): o.Statement[] {
  var stmts: any[] = [];
  if (view.detectChangesInInputsMethod.isEmpty() && view.updateContentQueriesMethod.isEmpty() &&
      view.afterContentLifecycleCallbacksMethod.isEmpty() &&
      view.detectChangesRenderPropertiesMethod.isEmpty() &&
      view.updateViewQueriesMethod.isEmpty() && view.afterViewLifecycleCallbacksMethod.isEmpty()) {
    return stmts;
  }
  ListWrapper.addAll(stmts, view.detectChangesInInputsMethod.finish());
  stmts.push(
      o.THIS_EXPR.callMethod('detectContentChildrenChanges', [DetectChangesVars.throwOnChange])
          .toStmt());
  var afterContentStmts = view.updateContentQueriesMethod.finish().concat(
      view.afterContentLifecycleCallbacksMethod.finish());
  if (afterContentStmts.length > 0) {
    stmts.push(new o.IfStmt(o.not(DetectChangesVars.throwOnChange), afterContentStmts));
  }
  ListWrapper.addAll(stmts, view.detectChangesRenderPropertiesMethod.finish());
  stmts.push(o.THIS_EXPR.callMethod('detectViewChildrenChanges', [DetectChangesVars.throwOnChange])
                 .toStmt());
  var afterViewStmts =
      view.updateViewQueriesMethod.finish().concat(view.afterViewLifecycleCallbacksMethod.finish());
  if (afterViewStmts.length > 0) {
    stmts.push(new o.IfStmt(o.not(DetectChangesVars.throwOnChange), afterViewStmts));
  }

  var varStmts: any[] = [];
  var readVars = o.findReadVarNames(stmts);
  if (SetWrapper.has(readVars, DetectChangesVars.changed.name)) {
    varStmts.push(DetectChangesVars.changed.set(o.literal(true)).toDeclStmt(o.BOOL_TYPE));
  }
  if (SetWrapper.has(readVars, DetectChangesVars.changes.name)) {
    varStmts.push(DetectChangesVars.changes.set(o.NULL_EXPR)
                      .toDeclStmt(new o.MapType(o.importType(Identifiers.SimpleChange))));
  }
  if (SetWrapper.has(readVars, DetectChangesVars.valUnwrapper.name)) {
    varStmts.push(
        DetectChangesVars.valUnwrapper.set(o.importExpr(Identifiers.ValueUnwrapper).instantiate([]))
            .toDeclStmt(null, [o.StmtModifier.Final]));
  }
  return varStmts.concat(stmts);
}

function addReturnValuefNotEmpty(statements: o.Statement[], value: o.Expression): o.Statement[] {
  if (statements.length > 0) {
    return statements.concat([new o.ReturnStatement(value)]);
  } else {
    return statements;
  }
}

function getContextType(view: CompileView): o.Type {
  if (view.viewType === ViewType.COMPONENT) {
    return o.importType(view.component.type);
  }
  return o.DYNAMIC_TYPE;
}

function getChangeDetectionMode(view: CompileView): ChangeDetectionStrategy {
  var mode: ChangeDetectionStrategy;
  if (view.viewType === ViewType.COMPONENT) {
    mode = isDefaultChangeDetectionStrategy(view.component.changeDetection) ?
        ChangeDetectionStrategy.CheckAlways :
        ChangeDetectionStrategy.CheckOnce;
  } else {
    mode = ChangeDetectionStrategy.CheckAlways;
  }
  return mode;
}

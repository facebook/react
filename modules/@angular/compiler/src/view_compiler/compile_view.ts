import {ViewType} from '../../core_private';
import {CompiledAnimation} from '../animation/animation_compiler';
import {CompileDirectiveMetadata, CompileIdentifierMetadata, CompilePipeMetadata, CompileTokenMap} from '../compile_metadata';
import {CompilerConfig} from '../config';
import {ListWrapper} from '../facade/collection';
import {isBlank, isPresent} from '../facade/lang';
import {Identifiers} from '../identifiers';
import * as o from '../output/output_ast';

import {CompileBinding} from './compile_binding';
import {CompileElement, CompileNode} from './compile_element';
import {CompileMethod} from './compile_method';
import {CompilePipe} from './compile_pipe';
import {CompileQuery, addQueryToTokenMap, createQueryList} from './compile_query';
import {EventHandlerVars} from './constants';
import {NameResolver} from './expression_converter';
import {createDiTokenExpression, createPureProxy, getPropertyInView, getViewFactoryName, injectFromViewParentInjector} from './util';

export class CompileView implements NameResolver {
  public viewType: ViewType;
  public viewQueries: CompileTokenMap<CompileQuery[]>;

  public nodes: CompileNode[] = [];
  // root nodes or AppElements for ViewContainers
  public rootNodesOrAppElements: o.Expression[] = [];

  public bindings: CompileBinding[] = [];

  public classStatements: o.Statement[] = [];
  public createMethod: CompileMethod;
  public injectorGetMethod: CompileMethod;
  public updateContentQueriesMethod: CompileMethod;
  public dirtyParentQueriesMethod: CompileMethod;
  public updateViewQueriesMethod: CompileMethod;
  public detectChangesInInputsMethod: CompileMethod;
  public detectChangesRenderPropertiesMethod: CompileMethod;
  public afterContentLifecycleCallbacksMethod: CompileMethod;
  public afterViewLifecycleCallbacksMethod: CompileMethod;
  public destroyMethod: CompileMethod;
  public detachMethod: CompileMethod;
  public eventHandlerMethods: o.ClassMethod[] = [];

  public fields: o.ClassField[] = [];
  public getters: o.ClassGetter[] = [];
  public disposables: o.Expression[] = [];
  public subscriptions: o.Expression[] = [];

  public componentView: CompileView;
  public purePipes = new Map<string, CompilePipe>();
  public pipes: CompilePipe[] = [];
  public locals = new Map<string, o.Expression>();
  public className: string;
  public classType: o.Type;
  public viewFactory: o.ReadVarExpr;

  public literalArrayCount = 0;
  public literalMapCount = 0;
  public pipeCount = 0;
  public animations = new Map<string, CompiledAnimation>();

  public componentContext: o.Expression;

  constructor(
      public component: CompileDirectiveMetadata, public genConfig: CompilerConfig,
      public pipeMetas: CompilePipeMetadata[], public styles: o.Expression,
      animations: CompiledAnimation[], public viewIndex: number,
      public declarationElement: CompileElement, public templateVariableBindings: string[][]) {
    animations.forEach(entry => this.animations.set(entry.name, entry));
    this.createMethod = new CompileMethod(this);
    this.injectorGetMethod = new CompileMethod(this);
    this.updateContentQueriesMethod = new CompileMethod(this);
    this.dirtyParentQueriesMethod = new CompileMethod(this);
    this.updateViewQueriesMethod = new CompileMethod(this);
    this.detectChangesInInputsMethod = new CompileMethod(this);
    this.detectChangesRenderPropertiesMethod = new CompileMethod(this);

    this.afterContentLifecycleCallbacksMethod = new CompileMethod(this);
    this.afterViewLifecycleCallbacksMethod = new CompileMethod(this);
    this.destroyMethod = new CompileMethod(this);
    this.detachMethod = new CompileMethod(this);

    this.viewType = getViewType(component, viewIndex);
    this.className = `_View_${component.type.name}${viewIndex}`;
    this.classType = o.importType(new CompileIdentifierMetadata({name: this.className}));
    this.viewFactory = o.variable(getViewFactoryName(component, viewIndex));
    if (this.viewType === ViewType.COMPONENT || this.viewType === ViewType.HOST) {
      this.componentView = this;
    } else {
      this.componentView = this.declarationElement.view.componentView;
    }
    this.componentContext =
        getPropertyInView(o.THIS_EXPR.prop('context'), this, this.componentView);

    var viewQueries = new CompileTokenMap<CompileQuery[]>();
    if (this.viewType === ViewType.COMPONENT) {
      var directiveInstance = o.THIS_EXPR.prop('context');
      ListWrapper.forEachWithIndex(this.component.viewQueries, (queryMeta, queryIndex) => {
        var propName = `_viewQuery_${queryMeta.selectors[0].name}_${queryIndex}`;
        var queryList = createQueryList(queryMeta, directiveInstance, propName, this);
        var query = new CompileQuery(queryMeta, queryList, directiveInstance, this);
        addQueryToTokenMap(viewQueries, query);
      });
      var constructorViewQueryCount = 0;
      this.component.type.diDeps.forEach((dep) => {
        if (isPresent(dep.viewQuery)) {
          var queryList = o.THIS_EXPR.prop('declarationAppElement')
                              .prop('componentConstructorViewQueries')
                              .key(o.literal(constructorViewQueryCount++));
          var query = new CompileQuery(dep.viewQuery, queryList, null, this);
          addQueryToTokenMap(viewQueries, query);
        }
      });
    }
    this.viewQueries = viewQueries;
    templateVariableBindings.forEach(
        (entry) => { this.locals.set(entry[1], o.THIS_EXPR.prop('context').prop(entry[0])); });

    if (!this.declarationElement.isNull()) {
      this.declarationElement.setEmbeddedView(this);
    }
  }

  callPipe(name: string, input: o.Expression, args: o.Expression[]): o.Expression {
    return CompilePipe.call(this, name, [input].concat(args));
  }

  getLocal(name: string): o.Expression {
    if (name == EventHandlerVars.event.name) {
      return EventHandlerVars.event;
    }
    var currView: CompileView = this;
    var result = currView.locals.get(name);
    while (isBlank(result) && isPresent(currView.declarationElement.view)) {
      currView = currView.declarationElement.view;
      result = currView.locals.get(name);
    }
    if (isPresent(result)) {
      return getPropertyInView(result, this, currView);
    } else {
      return null;
    }
  }

  createLiteralArray(values: o.Expression[]): o.Expression {
    if (values.length === 0) {
      return o.importExpr(Identifiers.EMPTY_ARRAY);
    }
    var proxyExpr = o.THIS_EXPR.prop(`_arr_${this.literalArrayCount++}`);
    var proxyParams: o.FnParam[] = [];
    var proxyReturnEntries: o.Expression[] = [];
    for (var i = 0; i < values.length; i++) {
      var paramName = `p${i}`;
      proxyParams.push(new o.FnParam(paramName));
      proxyReturnEntries.push(o.variable(paramName));
    }
    createPureProxy(
        o.fn(
            proxyParams, [new o.ReturnStatement(o.literalArr(proxyReturnEntries))],
            new o.ArrayType(o.DYNAMIC_TYPE)),
        values.length, proxyExpr, this);
    return proxyExpr.callFn(values);
  }

  createLiteralMap(entries: Array<Array<string|o.Expression>>): o.Expression {
    if (entries.length === 0) {
      return o.importExpr(Identifiers.EMPTY_MAP);
    }
    var proxyExpr = o.THIS_EXPR.prop(`_map_${this.literalMapCount++}`);
    var proxyParams: o.FnParam[] = [];
    var proxyReturnEntries: Array<Array<string|o.Expression>> = [];
    var values: o.Expression[] = [];
    for (var i = 0; i < entries.length; i++) {
      var paramName = `p${i}`;
      proxyParams.push(new o.FnParam(paramName));
      proxyReturnEntries.push([entries[i][0], o.variable(paramName)]);
      values.push(<o.Expression>entries[i][1]);
    }
    createPureProxy(
        o.fn(
            proxyParams, [new o.ReturnStatement(o.literalMap(proxyReturnEntries))],
            new o.MapType(o.DYNAMIC_TYPE)),
        entries.length, proxyExpr, this);
    return proxyExpr.callFn(values);
  }

  afterNodes() {
    this.pipes.forEach((pipe) => pipe.create());
    this.viewQueries.values().forEach(
        (queries) => queries.forEach(
            (query) => query.afterChildren(this.createMethod, this.updateViewQueriesMethod)));
  }
}

function getViewType(component: CompileDirectiveMetadata, embeddedTemplateIndex: number): ViewType {
  if (embeddedTemplateIndex > 0) {
    return ViewType.EMBEDDED;
  } else if (component.type.isHost) {
    return ViewType.HOST;
  } else {
    return ViewType.COMPONENT;
  }
}

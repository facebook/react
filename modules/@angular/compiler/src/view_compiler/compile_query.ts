import {CompileQueryMetadata, CompileTokenMap} from '../compile_metadata';
import {ListWrapper} from '../facade/collection';
import {isBlank, isPresent} from '../facade/lang';
import {Identifiers} from '../identifiers';
import * as o from '../output/output_ast';

import {CompileElement} from './compile_element';
import {CompileMethod} from './compile_method';
import {CompileView} from './compile_view';
import {getPropertyInView} from './util';

class ViewQueryValues {
  constructor(public view: CompileView, public values: Array<o.Expression|ViewQueryValues>) {}
}

export class CompileQuery {
  private _values: ViewQueryValues;

  constructor(
      public meta: CompileQueryMetadata, public queryList: o.Expression,
      public ownerDirectiveExpression: o.Expression, public view: CompileView) {
    this._values = new ViewQueryValues(view, []);
  }

  addValue(value: o.Expression, view: CompileView) {
    var currentView = view;
    var elPath: CompileElement[] = [];
    while (isPresent(currentView) && currentView !== this.view) {
      var parentEl = currentView.declarationElement;
      elPath.unshift(parentEl);
      currentView = parentEl.view;
    }
    var queryListForDirtyExpr = getPropertyInView(this.queryList, view, this.view);

    var viewValues = this._values;
    elPath.forEach((el) => {
      var last =
          viewValues.values.length > 0 ? viewValues.values[viewValues.values.length - 1] : null;
      if (last instanceof ViewQueryValues && last.view === el.embeddedView) {
        viewValues = last;
      } else {
        var newViewValues = new ViewQueryValues(el.embeddedView, []);
        viewValues.values.push(newViewValues);
        viewValues = newViewValues;
      }
    });
    viewValues.values.push(value);

    if (elPath.length > 0) {
      view.dirtyParentQueriesMethod.addStmt(
          queryListForDirtyExpr.callMethod('setDirty', []).toStmt());
    }
  }

  private _isStatic(): boolean {
    return !this._values.values.some(value => value instanceof ViewQueryValues);
  }

  afterChildren(targetStaticMethod: any /** TODO #9100 */, targetDynamicMethod: CompileMethod) {
    var values = createQueryValues(this._values);
    var updateStmts = [this.queryList.callMethod('reset', [o.literalArr(values)]).toStmt()];
    if (isPresent(this.ownerDirectiveExpression)) {
      var valueExpr = this.meta.first ? this.queryList.prop('first') : this.queryList;
      updateStmts.push(
          this.ownerDirectiveExpression.prop(this.meta.propertyName).set(valueExpr).toStmt());
    }
    if (!this.meta.first) {
      updateStmts.push(this.queryList.callMethod('notifyOnChanges', []).toStmt());
    }
    if (this.meta.first && this._isStatic()) {
      // for queries that don't change and the user asked for a single element,
      // set it immediately. That is e.g. needed for querying for ViewContainerRefs, ...
      // we don't do this for QueryLists for now as this would break the timing when
      // we call QueryList listeners...
      targetStaticMethod.addStmts(updateStmts);
    } else {
      targetDynamicMethod.addStmt(new o.IfStmt(this.queryList.prop('dirty'), updateStmts));
    }
  }
}

function createQueryValues(viewValues: ViewQueryValues): o.Expression[] {
  return ListWrapper.flatten(viewValues.values.map((entry) => {
    if (entry instanceof ViewQueryValues) {
      return mapNestedViews(
          entry.view.declarationElement.appElement, entry.view, createQueryValues(entry));
    } else {
      return <o.Expression>entry;
    }
  }));
}

function mapNestedViews(
    declarationAppElement: o.Expression, view: CompileView,
    expressions: o.Expression[]): o.Expression {
  var adjustedExpressions: o.Expression[] = expressions.map((expr) => {
    return o.replaceVarInExpression(o.THIS_EXPR.name, o.variable('nestedView'), expr);
  });
  return declarationAppElement.callMethod('mapNestedViews', [
    o.variable(view.className), o.fn(
                                    [new o.FnParam('nestedView', view.classType)],
                                    [new o.ReturnStatement(o.literalArr(adjustedExpressions))])
  ]);
}

export function createQueryList(
    query: CompileQueryMetadata, directiveInstance: o.Expression, propertyName: string,
    compileView: CompileView): o.Expression {
  compileView.fields.push(new o.ClassField(propertyName, o.importType(Identifiers.QueryList)));
  var expr = o.THIS_EXPR.prop(propertyName);
  compileView.createMethod.addStmt(o.THIS_EXPR.prop(propertyName)
                                       .set(o.importExpr(Identifiers.QueryList).instantiate([]))
                                       .toStmt());
  return expr;
}

export function addQueryToTokenMap(map: CompileTokenMap<CompileQuery[]>, query: CompileQuery) {
  query.meta.selectors.forEach((selector) => {
    var entry = map.get(selector);
    if (isBlank(entry)) {
      entry = [];
      map.add(selector, entry);
    }
    entry.push(query);
  });
}

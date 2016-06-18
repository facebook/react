import {EMPTY_STATE as EMPTY_ANIMATION_STATE, LifecycleHooks, SecurityContext, isDefaultChangeDetectionStrategy} from '../../core_private';
import * as cdAst from '../expression_parser/ast';
import {isBlank, isPresent} from '../facade/lang';
import {Identifiers} from '../identifiers';
import * as o from '../output/output_ast';

import {DetectChangesVars, ViewProperties} from './constants';

import {BoundTextAst, BoundElementPropertyAst, DirectiveAst, PropertyBindingType,} from '../template_ast';

import {CompileView} from './compile_view';
import {CompileElement, CompileNode} from './compile_element';
import {CompileMethod} from './compile_method';

import {camelCaseToDashCase} from '../util';

import {convertCdExpressionToIr} from './expression_converter';

import {CompileBinding} from './compile_binding';
import {BaseException} from '@angular/core';


function createBindFieldExpr(exprIndex: number): o.ReadPropExpr {
  return o.THIS_EXPR.prop(`_expr_${exprIndex}`);
}

function createCurrValueExpr(exprIndex: number): o.ReadVarExpr {
  return o.variable(`currVal_${exprIndex}`);  // fix syntax highlighting: `
}

function bind(
    view: CompileView, currValExpr: o.ReadVarExpr, fieldExpr: o.ReadPropExpr,
    parsedExpression: cdAst.AST, context: o.Expression, actions: o.Statement[],
    method: CompileMethod) {
  var checkExpression =
      convertCdExpressionToIr(view, context, parsedExpression, DetectChangesVars.valUnwrapper);
  if (isBlank(checkExpression.expression)) {
    // e.g. an empty expression was given
    return;
  }

  // private is fine here as no child view will reference the cached value...
  view.fields.push(new o.ClassField(fieldExpr.name, null, [o.StmtModifier.Private]));
  view.createMethod.addStmt(
      o.THIS_EXPR.prop(fieldExpr.name).set(o.importExpr(Identifiers.uninitialized)).toStmt());

  if (checkExpression.needsValueUnwrapper) {
    var initValueUnwrapperStmt = DetectChangesVars.valUnwrapper.callMethod('reset', []).toStmt();
    method.addStmt(initValueUnwrapperStmt);
  }
  method.addStmt(
      currValExpr.set(checkExpression.expression).toDeclStmt(null, [o.StmtModifier.Final]));

  var condition: o.Expression = o.importExpr(Identifiers.checkBinding).callFn([
    DetectChangesVars.throwOnChange, fieldExpr, currValExpr
  ]);
  if (checkExpression.needsValueUnwrapper) {
    condition = DetectChangesVars.valUnwrapper.prop('hasWrappedValue').or(condition);
  }
  method.addStmt(new o.IfStmt(
      condition,
      actions.concat([<o.Statement>o.THIS_EXPR.prop(fieldExpr.name).set(currValExpr).toStmt()])));
}

export function bindRenderText(
    boundText: BoundTextAst, compileNode: CompileNode, view: CompileView) {
  var bindingIndex = view.bindings.length;
  view.bindings.push(new CompileBinding(compileNode, boundText));
  var currValExpr = createCurrValueExpr(bindingIndex);
  var valueField = createBindFieldExpr(bindingIndex);
  view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileNode.nodeIndex, boundText);

  bind(
      view, currValExpr, valueField, boundText.value, view.componentContext,
      [o.THIS_EXPR.prop('renderer')
           .callMethod('setText', [compileNode.renderNode, currValExpr])
           .toStmt()],
      view.detectChangesRenderPropertiesMethod);
}

function bindAndWriteToRenderer(
    boundProps: BoundElementPropertyAst[], context: o.Expression, compileElement: CompileElement) {
  var view = compileElement.view;
  var renderNode = compileElement.renderNode;
  boundProps.forEach((boundProp) => {
    var bindingIndex = view.bindings.length;
    view.bindings.push(new CompileBinding(compileElement, boundProp));
    view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileElement.nodeIndex, boundProp);
    var fieldExpr = createBindFieldExpr(bindingIndex);
    var currValExpr = createCurrValueExpr(bindingIndex);
    var renderMethod: string;
    var oldRenderValue: o.Expression = sanitizedValue(boundProp, fieldExpr);
    var renderValue: o.Expression = sanitizedValue(boundProp, currValExpr);
    var updateStmts: any[] /** TODO #9100 */ = [];
    switch (boundProp.type) {
      case PropertyBindingType.Property:
        if (view.genConfig.logBindingUpdate) {
          updateStmts.push(logBindingUpdateStmt(renderNode, boundProp.name, renderValue));
        }
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod(
                    'setElementProperty', [renderNode, o.literal(boundProp.name), renderValue])
                .toStmt());
        break;
      case PropertyBindingType.Attribute:
        renderValue =
            renderValue.isBlank().conditional(o.NULL_EXPR, renderValue.callMethod('toString', []));
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod(
                    'setElementAttribute', [renderNode, o.literal(boundProp.name), renderValue])
                .toStmt());
        break;
      case PropertyBindingType.Class:
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod('setElementClass', [renderNode, o.literal(boundProp.name), renderValue])
                .toStmt());
        break;
      case PropertyBindingType.Style:
        var strValue: o.Expression = renderValue.callMethod('toString', []);
        if (isPresent(boundProp.unit)) {
          strValue = strValue.plus(o.literal(boundProp.unit));
        }
        renderValue = renderValue.isBlank().conditional(o.NULL_EXPR, strValue);
        updateStmts.push(
            o.THIS_EXPR.prop('renderer')
                .callMethod('setElementStyle', [renderNode, o.literal(boundProp.name), renderValue])
                .toStmt());
        break;
      case PropertyBindingType.Animation:
        var animationName = boundProp.name;
        var animation = view.componentView.animations.get(animationName);
        if (!isPresent(animation)) {
          throw new BaseException(
              `Internal Error: couldn't find an animation entry for ${boundProp.name}`);
        }

        // it's important to normalize the void value as `void` explicitly
        // so that the styles data can be obtained from the stringmap
        var emptyStateValue = o.literal(EMPTY_ANIMATION_STATE);

        // void => ...
        var oldRenderVar = o.variable('oldRenderVar');
        updateStmts.push(oldRenderVar.set(oldRenderValue).toDeclStmt());
        updateStmts.push(new o.IfStmt(
            oldRenderVar.equals(o.importExpr(Identifiers.uninitialized)),
            [oldRenderVar.set(emptyStateValue).toStmt()]));

        // ... => void
        var newRenderVar = o.variable('newRenderVar');
        updateStmts.push(newRenderVar.set(renderValue).toDeclStmt());
        updateStmts.push(new o.IfStmt(
            newRenderVar.equals(o.importExpr(Identifiers.uninitialized)),
            [newRenderVar.set(emptyStateValue).toStmt()]));

        updateStmts.push(
            animation.fnVariable.callFn([o.THIS_EXPR, renderNode, oldRenderVar, newRenderVar])
                .toStmt());

        view.detachMethod.addStmt(
            animation.fnVariable.callFn([o.THIS_EXPR, renderNode, oldRenderValue, emptyStateValue])
                .toStmt());

        break;
    }

    bind(
        view, currValExpr, fieldExpr, boundProp.value, context, updateStmts,
        view.detectChangesRenderPropertiesMethod);
  });
}

function sanitizedValue(
    boundProp: BoundElementPropertyAst, renderValue: o.Expression): o.Expression {
  let enumValue: string;
  switch (boundProp.securityContext) {
    case SecurityContext.NONE:
      return renderValue;  // No sanitization needed.
    case SecurityContext.HTML:
      enumValue = 'HTML';
      break;
    case SecurityContext.STYLE:
      enumValue = 'STYLE';
      break;
    case SecurityContext.SCRIPT:
      enumValue = 'SCRIPT';
      break;
    case SecurityContext.URL:
      enumValue = 'URL';
      break;
    case SecurityContext.RESOURCE_URL:
      enumValue = 'RESOURCE_URL';
      break;
    default:
      throw new Error(`internal error, unexpected SecurityContext ${boundProp.securityContext}.`);
  }
  let ctx = ViewProperties.viewUtils.prop('sanitizer');
  let args = [o.importExpr(Identifiers.SecurityContext).prop(enumValue), renderValue];
  return ctx.callMethod('sanitize', args);
}

export function bindRenderInputs(
    boundProps: BoundElementPropertyAst[], compileElement: CompileElement): void {
  bindAndWriteToRenderer(boundProps, compileElement.view.componentContext, compileElement);
}

export function bindDirectiveHostProps(
    directiveAst: DirectiveAst, directiveInstance: o.Expression,
    compileElement: CompileElement): void {
  bindAndWriteToRenderer(directiveAst.hostProperties, directiveInstance, compileElement);
}

export function bindDirectiveInputs(
    directiveAst: DirectiveAst, directiveInstance: o.Expression, compileElement: CompileElement) {
  if (directiveAst.inputs.length === 0) {
    return;
  }
  var view = compileElement.view;
  var detectChangesInInputsMethod = view.detectChangesInInputsMethod;
  detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);

  var lifecycleHooks = directiveAst.directive.lifecycleHooks;
  var calcChangesMap = lifecycleHooks.indexOf(LifecycleHooks.OnChanges) !== -1;
  var isOnPushComp = directiveAst.directive.isComponent &&
      !isDefaultChangeDetectionStrategy(directiveAst.directive.changeDetection);
  if (calcChangesMap) {
    detectChangesInInputsMethod.addStmt(DetectChangesVars.changes.set(o.NULL_EXPR).toStmt());
  }
  if (isOnPushComp) {
    detectChangesInInputsMethod.addStmt(DetectChangesVars.changed.set(o.literal(false)).toStmt());
  }
  directiveAst.inputs.forEach((input) => {
    var bindingIndex = view.bindings.length;
    view.bindings.push(new CompileBinding(compileElement, input));
    detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, input);
    var fieldExpr = createBindFieldExpr(bindingIndex);
    var currValExpr = createCurrValueExpr(bindingIndex);
    var statements: o.Statement[] =
        [directiveInstance.prop(input.directiveName).set(currValExpr).toStmt()];
    if (calcChangesMap) {
      statements.push(new o.IfStmt(
          DetectChangesVars.changes.identical(o.NULL_EXPR),
          [DetectChangesVars.changes
               .set(o.literalMap([], new o.MapType(o.importType(Identifiers.SimpleChange))))
               .toStmt()]));
      statements.push(
          DetectChangesVars.changes.key(o.literal(input.directiveName))
              .set(o.importExpr(Identifiers.SimpleChange).instantiate([fieldExpr, currValExpr]))
              .toStmt());
    }
    if (isOnPushComp) {
      statements.push(DetectChangesVars.changed.set(o.literal(true)).toStmt());
    }
    if (view.genConfig.logBindingUpdate) {
      statements.push(
          logBindingUpdateStmt(compileElement.renderNode, input.directiveName, currValExpr));
    }
    bind(
        view, currValExpr, fieldExpr, input.value, view.componentContext, statements,
        detectChangesInInputsMethod);
  });
  if (isOnPushComp) {
    detectChangesInInputsMethod.addStmt(new o.IfStmt(DetectChangesVars.changed, [
      compileElement.appElement.prop('componentView').callMethod('markAsCheckOnce', []).toStmt()
    ]));
  }
}

function logBindingUpdateStmt(
    renderNode: o.Expression, propName: string, value: o.Expression): o.Statement {
  return o.THIS_EXPR.prop('renderer')
      .callMethod(
          'setBindingDebugInfo',
          [
            renderNode, o.literal(`ng-reflect-${camelCaseToDashCase(propName)}`),
            value.isBlank().conditional(o.NULL_EXPR, value.callMethod('toString', []))
          ])
      .toStmt();
}

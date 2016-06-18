import {LifecycleHooks} from '../../core_private';
import {CompileDirectiveMetadata, CompilePipeMetadata} from '../compile_metadata';
import * as o from '../output/output_ast';
import {DirectiveAst} from '../template_ast';

import {CompileElement} from './compile_element';
import {CompileView} from './compile_view';
import {ChangeDetectorStateEnum, DetectChangesVars} from './constants';



var STATE_IS_NEVER_CHECKED =
    o.THIS_EXPR.prop('cdState').identical(ChangeDetectorStateEnum.NeverChecked);
var NOT_THROW_ON_CHANGES = o.not(DetectChangesVars.throwOnChange);

export function bindDirectiveDetectChangesLifecycleCallbacks(
    directiveAst: DirectiveAst, directiveInstance: o.Expression, compileElement: CompileElement) {
  var view = compileElement.view;
  var detectChangesInInputsMethod = view.detectChangesInInputsMethod;
  var lifecycleHooks = directiveAst.directive.lifecycleHooks;
  if (lifecycleHooks.indexOf(LifecycleHooks.OnChanges) !== -1 && directiveAst.inputs.length > 0) {
    detectChangesInInputsMethod.addStmt(new o.IfStmt(
        DetectChangesVars.changes.notIdentical(o.NULL_EXPR),
        [directiveInstance.callMethod('ngOnChanges', [DetectChangesVars.changes]).toStmt()]));
  }
  if (lifecycleHooks.indexOf(LifecycleHooks.OnInit) !== -1) {
    detectChangesInInputsMethod.addStmt(new o.IfStmt(
        STATE_IS_NEVER_CHECKED.and(NOT_THROW_ON_CHANGES),
        [directiveInstance.callMethod('ngOnInit', []).toStmt()]));
  }
  if (lifecycleHooks.indexOf(LifecycleHooks.DoCheck) !== -1) {
    detectChangesInInputsMethod.addStmt(new o.IfStmt(
        NOT_THROW_ON_CHANGES, [directiveInstance.callMethod('ngDoCheck', []).toStmt()]));
  }
}

export function bindDirectiveAfterContentLifecycleCallbacks(
    directiveMeta: CompileDirectiveMetadata, directiveInstance: o.Expression,
    compileElement: CompileElement) {
  var view = compileElement.view;
  var lifecycleHooks = directiveMeta.lifecycleHooks;
  var afterContentLifecycleCallbacksMethod = view.afterContentLifecycleCallbacksMethod;
  afterContentLifecycleCallbacksMethod.resetDebugInfo(
      compileElement.nodeIndex, compileElement.sourceAst);
  if (lifecycleHooks.indexOf(LifecycleHooks.AfterContentInit) !== -1) {
    afterContentLifecycleCallbacksMethod.addStmt(new o.IfStmt(
        STATE_IS_NEVER_CHECKED, [directiveInstance.callMethod('ngAfterContentInit', []).toStmt()]));
  }
  if (lifecycleHooks.indexOf(LifecycleHooks.AfterContentChecked) !== -1) {
    afterContentLifecycleCallbacksMethod.addStmt(
        directiveInstance.callMethod('ngAfterContentChecked', []).toStmt());
  }
}

export function bindDirectiveAfterViewLifecycleCallbacks(
    directiveMeta: CompileDirectiveMetadata, directiveInstance: o.Expression,
    compileElement: CompileElement) {
  var view = compileElement.view;
  var lifecycleHooks = directiveMeta.lifecycleHooks;
  var afterViewLifecycleCallbacksMethod = view.afterViewLifecycleCallbacksMethod;
  afterViewLifecycleCallbacksMethod.resetDebugInfo(
      compileElement.nodeIndex, compileElement.sourceAst);
  if (lifecycleHooks.indexOf(LifecycleHooks.AfterViewInit) !== -1) {
    afterViewLifecycleCallbacksMethod.addStmt(new o.IfStmt(
        STATE_IS_NEVER_CHECKED, [directiveInstance.callMethod('ngAfterViewInit', []).toStmt()]));
  }
  if (lifecycleHooks.indexOf(LifecycleHooks.AfterViewChecked) !== -1) {
    afterViewLifecycleCallbacksMethod.addStmt(
        directiveInstance.callMethod('ngAfterViewChecked', []).toStmt());
  }
}

export function bindDirectiveDestroyLifecycleCallbacks(
    directiveMeta: CompileDirectiveMetadata, directiveInstance: o.Expression,
    compileElement: CompileElement) {
  var onDestroyMethod = compileElement.view.destroyMethod;
  onDestroyMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);
  if (directiveMeta.lifecycleHooks.indexOf(LifecycleHooks.OnDestroy) !== -1) {
    onDestroyMethod.addStmt(directiveInstance.callMethod('ngOnDestroy', []).toStmt());
  }
}

export function bindPipeDestroyLifecycleCallbacks(
    pipeMeta: CompilePipeMetadata, pipeInstance: o.Expression, view: CompileView) {
  var onDestroyMethod = view.destroyMethod;
  if (pipeMeta.lifecycleHooks.indexOf(LifecycleHooks.OnDestroy) !== -1) {
    onDestroyMethod.addStmt(pipeInstance.callMethod('ngOnDestroy', []).toStmt());
  }
}

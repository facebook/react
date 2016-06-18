import {ListWrapper,} from '../facade/collection';
import {TemplateAst, TemplateAstVisitor, NgContentAst, EmbeddedTemplateAst, ElementAst, ReferenceAst, VariableAst, BoundEventAst, BoundElementPropertyAst, AttrAst, BoundTextAst, TextAst, DirectiveAst, BoundDirectivePropertyAst, templateVisitAll,} from '../template_ast';
import {bindRenderText, bindRenderInputs, bindDirectiveInputs, bindDirectiveHostProps} from './property_binder';
import {bindRenderOutputs, collectEventListeners, bindDirectiveOutputs} from './event_binder';
import {bindDirectiveAfterContentLifecycleCallbacks, bindDirectiveAfterViewLifecycleCallbacks, bindDirectiveDestroyLifecycleCallbacks, bindPipeDestroyLifecycleCallbacks, bindDirectiveDetectChangesLifecycleCallbacks} from './lifecycle_binder';
import {CompileView} from './compile_view';
import {CompileElement, CompileNode} from './compile_element';

export function bindView(view: CompileView, parsedTemplate: TemplateAst[]): void {
  var visitor = new ViewBinderVisitor(view);
  templateVisitAll(visitor, parsedTemplate);
  view.pipes.forEach(
      (pipe) => { bindPipeDestroyLifecycleCallbacks(pipe.meta, pipe.instance, pipe.view); });
}

class ViewBinderVisitor implements TemplateAstVisitor {
  private _nodeIndex: number = 0;

  constructor(public view: CompileView) {}

  visitBoundText(ast: BoundTextAst, parent: CompileElement): any {
    var node = this.view.nodes[this._nodeIndex++];
    bindRenderText(ast, node, this.view);
    return null;
  }
  visitText(ast: TextAst, parent: CompileElement): any {
    this._nodeIndex++;
    return null;
  }

  visitNgContent(ast: NgContentAst, parent: CompileElement): any { return null; }

  visitElement(ast: ElementAst, parent: CompileElement): any {
    var compileElement = <CompileElement>this.view.nodes[this._nodeIndex++];
    var eventListeners = collectEventListeners(ast.outputs, ast.directives, compileElement);
    bindRenderInputs(ast.inputs, compileElement);
    bindRenderOutputs(eventListeners);
    ListWrapper.forEachWithIndex(ast.directives, (directiveAst, index) => {
      var directiveInstance = compileElement.directiveInstances[index];
      bindDirectiveInputs(directiveAst, directiveInstance, compileElement);
      bindDirectiveDetectChangesLifecycleCallbacks(directiveAst, directiveInstance, compileElement);

      bindDirectiveHostProps(directiveAst, directiveInstance, compileElement);
      bindDirectiveOutputs(directiveAst, directiveInstance, eventListeners);
    });
    templateVisitAll(this, ast.children, compileElement);
    // afterContent and afterView lifecycles need to be called bottom up
    // so that children are notified before parents
    ListWrapper.forEachWithIndex(ast.directives, (directiveAst, index) => {
      var directiveInstance = compileElement.directiveInstances[index];
      bindDirectiveAfterContentLifecycleCallbacks(
          directiveAst.directive, directiveInstance, compileElement);
      bindDirectiveAfterViewLifecycleCallbacks(
          directiveAst.directive, directiveInstance, compileElement);
      bindDirectiveDestroyLifecycleCallbacks(
          directiveAst.directive, directiveInstance, compileElement);
    });
    return null;
  }

  visitEmbeddedTemplate(ast: EmbeddedTemplateAst, parent: CompileElement): any {
    var compileElement = <CompileElement>this.view.nodes[this._nodeIndex++];
    var eventListeners = collectEventListeners(ast.outputs, ast.directives, compileElement);
    ListWrapper.forEachWithIndex(ast.directives, (directiveAst, index) => {
      var directiveInstance = compileElement.directiveInstances[index];
      bindDirectiveInputs(directiveAst, directiveInstance, compileElement);
      bindDirectiveDetectChangesLifecycleCallbacks(directiveAst, directiveInstance, compileElement);
      bindDirectiveOutputs(directiveAst, directiveInstance, eventListeners);
      bindDirectiveAfterContentLifecycleCallbacks(
          directiveAst.directive, directiveInstance, compileElement);
      bindDirectiveAfterViewLifecycleCallbacks(
          directiveAst.directive, directiveInstance, compileElement);
      bindDirectiveDestroyLifecycleCallbacks(
          directiveAst.directive, directiveInstance, compileElement);
    });
    bindView(compileElement.embeddedView, ast.children);
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

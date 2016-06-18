import {Injectable} from '@angular/core';

import {AnimationCompiler} from '../animation/animation_compiler';
import {CompileDirectiveMetadata, CompilePipeMetadata} from '../compile_metadata';
import {CompilerConfig} from '../config';
import * as o from '../output/output_ast';
import {TemplateAst} from '../template_ast';

import {CompileElement} from './compile_element';
import {CompileView} from './compile_view';
import {bindView} from './view_binder';
import {ViewCompileDependency, buildView, finishView} from './view_builder';

export class ViewCompileResult {
  constructor(
      public statements: o.Statement[], public viewFactoryVar: string,
      public dependencies: ViewCompileDependency[]) {}
}

@Injectable()
export class ViewCompiler {
  private _animationCompiler = new AnimationCompiler();
  constructor(private _genConfig: CompilerConfig) {}

  compileComponent(
      component: CompileDirectiveMetadata, template: TemplateAst[], styles: o.Expression,
      pipes: CompilePipeMetadata[]): ViewCompileResult {
    var dependencies: any[] /** TODO #9100 */ = [];
    var compiledAnimations = this._animationCompiler.compileComponent(component);
    var statements: any[] /** TODO #9100 */ = [];
    compiledAnimations.map(entry => {
      statements.push(entry.statesMapStatement);
      statements.push(entry.fnStatement);
    });
    var view = new CompileView(
        component, this._genConfig, pipes, styles, compiledAnimations, 0,
        CompileElement.createNull(), []);
    buildView(view, template, dependencies);
    // Need to separate binding from creation to be able to refer to
    // variables that have been declared after usage.
    bindView(view, template);
    finishView(view, statements);

    return new ViewCompileResult(statements, view.viewFactory.name, dependencies);
  }
}

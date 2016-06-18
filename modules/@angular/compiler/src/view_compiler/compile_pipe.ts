import {CompilePipeMetadata} from '../compile_metadata';
import {BaseException} from '../facade/exceptions';
import {isBlank, isPresent} from '../facade/lang';
import {Identifiers, identifierToken} from '../identifiers';
import * as o from '../output/output_ast';

import {CompileView} from './compile_view';
import {createPureProxy, getPropertyInView, injectFromViewParentInjector} from './util';

class _PurePipeProxy {
  constructor(public view: CompileView, public instance: o.ReadPropExpr, public argCount: number) {}
}

export class CompilePipe {
  static call(view: CompileView, name: string, args: o.Expression[]): o.Expression {
    var compView = view.componentView;
    var meta = _findPipeMeta(compView, name);
    var pipe: CompilePipe;
    if (meta.pure) {
      // pure pipes live on the component view
      pipe = compView.purePipes.get(name);
      if (isBlank(pipe)) {
        pipe = new CompilePipe(compView, meta);
        compView.purePipes.set(name, pipe);
        compView.pipes.push(pipe);
      }
    } else {
      // Non pure pipes live on the view that called it
      pipe = new CompilePipe(view, meta);
      view.pipes.push(pipe);
    }
    return pipe._call(view, args);
  }

  instance: o.ReadPropExpr;
  private _purePipeProxies: _PurePipeProxy[] = [];

  constructor(public view: CompileView, public meta: CompilePipeMetadata) {
    this.instance = o.THIS_EXPR.prop(`_pipe_${meta.name}_${view.pipeCount++}`);
  }

  get pure(): boolean { return this.meta.pure; }

  create(): void {
    var deps = this.meta.type.diDeps.map((diDep) => {
      if (diDep.token.equalsTo(identifierToken(Identifiers.ChangeDetectorRef))) {
        return getPropertyInView(o.THIS_EXPR.prop('ref'), this.view, this.view.componentView);
      }
      return injectFromViewParentInjector(diDep.token, false);
    });
    this.view.fields.push(new o.ClassField(this.instance.name, o.importType(this.meta.type)));
    this.view.createMethod.resetDebugInfo(null, null);
    this.view.createMethod.addStmt(o.THIS_EXPR.prop(this.instance.name)
                                       .set(o.importExpr(this.meta.type).instantiate(deps))
                                       .toStmt());
    this._purePipeProxies.forEach((purePipeProxy) => {
      var pipeInstanceSeenFromPureProxy =
          getPropertyInView(this.instance, purePipeProxy.view, this.view);
      createPureProxy(
          pipeInstanceSeenFromPureProxy.prop('transform')
              .callMethod(o.BuiltinMethod.bind, [pipeInstanceSeenFromPureProxy]),
          purePipeProxy.argCount, purePipeProxy.instance, purePipeProxy.view);
    });
  }

  private _call(callingView: CompileView, args: o.Expression[]): o.Expression {
    if (this.meta.pure) {
      // PurePipeProxies live on the view that called them.
      var purePipeProxy = new _PurePipeProxy(
          callingView, o.THIS_EXPR.prop(`${this.instance.name}_${this._purePipeProxies.length}`),
          args.length);
      this._purePipeProxies.push(purePipeProxy);
      return o.importExpr(Identifiers.castByValue)
          .callFn([
            purePipeProxy.instance,
            getPropertyInView(this.instance.prop('transform'), callingView, this.view)
          ])
          .callFn(args);
    } else {
      return getPropertyInView(this.instance, callingView, this.view).callMethod('transform', args);
    }
  }
}

function _findPipeMeta(view: CompileView, name: string): CompilePipeMetadata {
  var pipeMeta: CompilePipeMetadata = null;
  for (var i = view.pipeMetas.length - 1; i >= 0; i--) {
    var localPipeMeta = view.pipeMetas[i];
    if (localPipeMeta.name == name) {
      pipeMeta = localPipeMeta;
      break;
    }
  }
  if (isBlank(pipeMeta)) {
    throw new BaseException(
        `Illegal state: Could not find pipe ${name} although the parser should have detected this error!`);
  }
  return pipeMeta;
}

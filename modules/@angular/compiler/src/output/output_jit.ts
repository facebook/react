import {isPresent, evalExpression,} from '../facade/lang';
import * as o from './output_ast';
import {EmitterVisitorContext} from './abstract_emitter';
import {AbstractJsEmitterVisitor} from './abstract_js_emitter';
import {sanitizeIdentifier} from '../util';

export function jitStatements(
    sourceUrl: string, statements: o.Statement[], resultVar: string): any {
  var converter = new JitEmitterVisitor();
  var ctx = EmitterVisitorContext.createRoot([resultVar]);
  converter.visitAllStatements(statements, ctx);
  return evalExpression(sourceUrl, resultVar, ctx.toSource(), converter.getArgs());
}

class JitEmitterVisitor extends AbstractJsEmitterVisitor {
  private _evalArgNames: string[] = [];
  private _evalArgValues: any[] = [];

  getArgs(): {[key: string]: any} {
    var result = {};
    for (var i = 0; i < this._evalArgNames.length; i++) {
      (result as any /** TODO #9100 */)[this._evalArgNames[i]] = this._evalArgValues[i];
    }
    return result;
  }

  visitExternalExpr(ast: o.ExternalExpr, ctx: EmitterVisitorContext): any {
    var value = ast.value.runtime;
    var id = this._evalArgValues.indexOf(value);
    if (id === -1) {
      id = this._evalArgValues.length;
      this._evalArgValues.push(value);
      var name = isPresent(ast.value.name) ? sanitizeIdentifier(ast.value.name) : 'val';
      this._evalArgNames.push(sanitizeIdentifier(`jit_${name}${id}`));
    }
    ctx.print(this._evalArgNames[id]);
    return null;
  }
}

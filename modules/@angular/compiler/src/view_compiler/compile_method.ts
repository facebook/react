import {ListWrapper} from '../facade/collection';
import {isPresent} from '../facade/lang';
import * as o from '../output/output_ast';
import {TemplateAst} from '../template_ast';

import {CompileView} from './compile_view';

class _DebugState {
  constructor(public nodeIndex: number, public sourceAst: TemplateAst) {}
}

var NULL_DEBUG_STATE = new _DebugState(null, null);

export class CompileMethod {
  private _newState: _DebugState = NULL_DEBUG_STATE;
  private _currState: _DebugState = NULL_DEBUG_STATE;

  private _debugEnabled: boolean;

  private _bodyStatements: o.Statement[] = [];

  constructor(private _view: CompileView) {
    this._debugEnabled = this._view.genConfig.genDebugInfo;
  }

  private _updateDebugContextIfNeeded() {
    if (this._newState.nodeIndex !== this._currState.nodeIndex ||
        this._newState.sourceAst !== this._currState.sourceAst) {
      var expr = this._updateDebugContext(this._newState);
      if (isPresent(expr)) {
        this._bodyStatements.push(expr.toStmt());
      }
    }
  }

  private _updateDebugContext(newState: _DebugState): o.Expression {
    this._currState = this._newState = newState;
    if (this._debugEnabled) {
      var sourceLocation =
          isPresent(newState.sourceAst) ? newState.sourceAst.sourceSpan.start : null;

      return o.THIS_EXPR.callMethod('debug', [
        o.literal(newState.nodeIndex),
        isPresent(sourceLocation) ? o.literal(sourceLocation.line) : o.NULL_EXPR,
        isPresent(sourceLocation) ? o.literal(sourceLocation.col) : o.NULL_EXPR
      ]);
    } else {
      return null;
    }
  }

  resetDebugInfoExpr(nodeIndex: number, templateAst: TemplateAst): o.Expression {
    var res = this._updateDebugContext(new _DebugState(nodeIndex, templateAst));
    return isPresent(res) ? res : o.NULL_EXPR;
  }

  resetDebugInfo(nodeIndex: number, templateAst: TemplateAst) {
    this._newState = new _DebugState(nodeIndex, templateAst);
  }

  addStmt(stmt: o.Statement) {
    this._updateDebugContextIfNeeded();
    this._bodyStatements.push(stmt);
  }

  addStmts(stmts: o.Statement[]) {
    this._updateDebugContextIfNeeded();
    ListWrapper.addAll(this._bodyStatements, stmts);
  }

  finish(): o.Statement[] { return this._bodyStatements; }

  isEmpty(): boolean { return this._bodyStatements.length === 0; }
}

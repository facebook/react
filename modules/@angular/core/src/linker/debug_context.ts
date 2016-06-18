import {Injector} from '../di';
import {ListWrapper, StringMapWrapper} from '../facade/collection';
import {isBlank, isPresent} from '../facade/lang';
import {RenderDebugInfo} from '../render/api';

import {DebugAppView} from './view';
import {ViewType} from './view_type';


/* @ts2dart_const */
export class StaticNodeDebugInfo {
  constructor(
      public providerTokens: any[], public componentToken: any,
      public refTokens: {[key: string]: any}) {}
}

export class DebugContext implements RenderDebugInfo {
  constructor(
      private _view: DebugAppView<any>, private _nodeIndex: number, private _tplRow: number,
      private _tplCol: number) {}

  private get _staticNodeInfo(): StaticNodeDebugInfo {
    return isPresent(this._nodeIndex) ? this._view.staticNodeDebugInfos[this._nodeIndex] : null;
  }

  get context() { return this._view.context; }
  get component() {
    var staticNodeInfo = this._staticNodeInfo;
    if (isPresent(staticNodeInfo) && isPresent(staticNodeInfo.componentToken)) {
      return this.injector.get(staticNodeInfo.componentToken);
    }
    return null;
  }
  get componentRenderElement() {
    var componentView = this._view;
    while (isPresent(componentView.declarationAppElement) &&
           componentView.type !== ViewType.COMPONENT) {
      componentView = <DebugAppView<any>>componentView.declarationAppElement.parentView;
    }
    return isPresent(componentView.declarationAppElement) ?
        componentView.declarationAppElement.nativeElement :
        null;
  }
  get injector(): Injector { return this._view.injector(this._nodeIndex); }
  get renderNode(): any {
    if (isPresent(this._nodeIndex) && isPresent(this._view.allNodes)) {
      return this._view.allNodes[this._nodeIndex];
    } else {
      return null;
    }
  }
  get providerTokens(): any[] {
    var staticNodeInfo = this._staticNodeInfo;
    return isPresent(staticNodeInfo) ? staticNodeInfo.providerTokens : null;
  }
  get source(): string {
    return `${this._view.componentType.templateUrl}:${this._tplRow}:${this._tplCol}`;
  }
  get references(): {[key: string]: any} {
    var varValues: {[key: string]: string} = {};
    var staticNodeInfo = this._staticNodeInfo;
    if (isPresent(staticNodeInfo)) {
      var refs = staticNodeInfo.refTokens;
      StringMapWrapper.forEach(
          refs, (refToken: any /** TODO #9100 */, refName: any /** TODO #9100 */) => {
            var varValue: any /** TODO #9100 */;
            if (isBlank(refToken)) {
              varValue =
                  isPresent(this._view.allNodes) ? this._view.allNodes[this._nodeIndex] : null;
            } else {
              varValue = this._view.injectorGet(refToken, this._nodeIndex, null);
            }
            varValues[refName] = varValue;
          });
    }
    return varValues;
  }
}

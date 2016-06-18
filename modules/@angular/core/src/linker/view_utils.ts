import {APP_ID} from '../application_tokens';
import {devModeEqual} from '../change_detection/change_detection';
import {uninitialized} from '../change_detection/change_detection_util';
import {Inject, Injectable} from '../di/decorators';
import {ListWrapper, StringMapWrapper} from '../facade/collection';
import {BaseException} from '../facade/exceptions';
import {isBlank, isPresent, looseIdentical} from '../facade/lang';
import {ViewEncapsulation} from '../metadata/view';
import {RenderComponentType, Renderer, RootRenderer} from '../render/api';
import {SanitizationService} from '../security';

import {AppElement} from './element';
import {ExpressionChangedAfterItHasBeenCheckedException} from './exceptions';

@Injectable()
export class ViewUtils {
  sanitizer: SanitizationService;
  private _nextCompTypeId: number = 0;

  constructor(
      private _renderer: RootRenderer, @Inject(APP_ID) private _appId: string,
      sanitizer: SanitizationService) {
    this.sanitizer = sanitizer;
  }

  /**
   * Used by the generated code
   */
  createRenderComponentType(
      templateUrl: string, slotCount: number, encapsulation: ViewEncapsulation,
      styles: Array<string|any[]>): RenderComponentType {
    return new RenderComponentType(
        `${this._appId}-${this._nextCompTypeId++}`, templateUrl, slotCount, encapsulation, styles);
  }

  /** @internal */
  renderComponent(renderComponentType: RenderComponentType): Renderer {
    return this._renderer.renderComponent(renderComponentType);
  }
}

export function flattenNestedViewRenderNodes(nodes: any[]): any[] {
  return _flattenNestedViewRenderNodes(nodes, []);
}

function _flattenNestedViewRenderNodes(nodes: any[], renderNodes: any[]): any[] {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node instanceof AppElement) {
      var appEl = <AppElement>node;
      renderNodes.push(appEl.nativeElement);
      if (isPresent(appEl.nestedViews)) {
        for (var k = 0; k < appEl.nestedViews.length; k++) {
          _flattenNestedViewRenderNodes(appEl.nestedViews[k].rootNodesOrAppElements, renderNodes);
        }
      }
    } else {
      renderNodes.push(node);
    }
  }
  return renderNodes;
}

const EMPTY_ARR: any[] /** TODO #9100 */ = /*@ts2dart_const*/[];

export function ensureSlotCount(projectableNodes: any[][], expectedSlotCount: number): any[][] {
  var res: any /** TODO #9100 */;
  if (isBlank(projectableNodes)) {
    res = EMPTY_ARR;
  } else if (projectableNodes.length < expectedSlotCount) {
    var givenSlotCount = projectableNodes.length;
    res = ListWrapper.createFixedSize(expectedSlotCount);
    for (var i = 0; i < expectedSlotCount; i++) {
      res[i] = (i < givenSlotCount) ? projectableNodes[i] : EMPTY_ARR;
    }
  } else {
    res = projectableNodes;
  }
  return res;
}

export const MAX_INTERPOLATION_VALUES = 9;

export function interpolate(
    valueCount: number, c0: string, a1: any, c1: string, a2?: any, c2?: string, a3?: any,
    c3?: string, a4?: any, c4?: string, a5?: any, c5?: string, a6?: any, c6?: string, a7?: any,
    c7?: string, a8?: any, c8?: string, a9?: any, c9?: string): string {
  switch (valueCount) {
    case 1:
      return c0 + _toStringWithNull(a1) + c1;
    case 2:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2;
    case 3:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3;
    case 4:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4;
    case 5:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5;
    case 6:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6;
    case 7:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
          c6 + _toStringWithNull(a7) + c7;
    case 8:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
          c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8;
    case 9:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
          c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8 + _toStringWithNull(a9) + c9;
    default:
      throw new BaseException(`Does not support more than 9 expressions`);
  }
}

function _toStringWithNull(v: any): string {
  return v != null ? v.toString() : '';
}

export function checkBinding(throwOnChange: boolean, oldValue: any, newValue: any): boolean {
  if (throwOnChange) {
    if (!devModeEqual(oldValue, newValue)) {
      throw new ExpressionChangedAfterItHasBeenCheckedException(oldValue, newValue, null);
    }
    return false;
  } else {
    return !looseIdentical(oldValue, newValue);
  }
}

export function arrayLooseIdentical(a: any[], b: any[]): boolean {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (!looseIdentical(a[i], b[i])) return false;
  }
  return true;
}

export function mapLooseIdentical<V>(m1: {[key: string]: V}, m2: {[key: string]: V}): boolean {
  var k1 = StringMapWrapper.keys(m1);
  var k2 = StringMapWrapper.keys(m2);
  if (k1.length != k2.length) {
    return false;
  }
  var key: any /** TODO #9100 */;
  for (var i = 0; i < k1.length; i++) {
    key = k1[i];
    if (!looseIdentical(m1[key], m2[key])) {
      return false;
    }
  }
  return true;
}

export function castByValue<T>(input: any, value: T): T {
  return <T>input;
}

export const EMPTY_ARRAY: any[] /** TODO #9100 */ = /*@ts2dart_const*/[];
export const EMPTY_MAP = /*@ts2dart_const*/ {};

export function pureProxy1<P0, R>(fn: (p0: P0) => R): (p0: P0) => R {
  var result: R;
  var v0: any /** TODO #9100 */;
  v0 = uninitialized;
  return (p0) => {
    if (!looseIdentical(v0, p0)) {
      v0 = p0;
      result = fn(p0);
    }
    return result;
  };
}

export function pureProxy2<P0, P1, R>(fn: (p0: P0, p1: P1) => R): (p0: P0, p1: P1) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */;
  v0 = v1 = uninitialized;
  return (p0, p1) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1)) {
      v0 = p0;
      v1 = p1;
      result = fn(p0, p1);
    }
    return result;
  };
}

export function pureProxy3<P0, P1, P2, R>(fn: (p0: P0, p1: P1, p2: P2) => R): (
    p0: P0, p1: P1, p2: P2) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */;
  v0 = v1 = v2 = uninitialized;
  return (p0, p1, p2) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      result = fn(p0, p1, p2);
    }
    return result;
  };
}

export function pureProxy4<P0, P1, P2, P3, R>(fn: (p0: P0, p1: P1, p2: P2, p3: P3) => R): (
    p0: P0, p1: P1, p2: P2, p3: P3) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */,
      v3: any /** TODO #9100 */;
  v0 = v1 = v2 = v3 = uninitialized;
  return (p0, p1, p2, p3) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      result = fn(p0, p1, p2, p3);
    }
    return result;
  };
}

export function pureProxy5<P0, P1, P2, P3, P4, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) =>
    R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */,
      v3: any /** TODO #9100 */, v4: any /** TODO #9100 */;
  v0 = v1 = v2 = v3 = v4 = uninitialized;
  return (p0, p1, p2, p3, p4) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      result = fn(p0, p1, p2, p3, p4);
    }
    return result;
  };
}


export function pureProxy6<P0, P1, P2, P3, P4, P5, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */,
      v3: any /** TODO #9100 */, v4: any /** TODO #9100 */, v5: any /** TODO #9100 */;
  v0 = v1 = v2 = v3 = v4 = v5 = uninitialized;
  return (p0, p1, p2, p3, p4, p5) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      result = fn(p0, p1, p2, p3, p4, p5);
    }
    return result;
  };
}

export function pureProxy7<P0, P1, P2, P3, P4, P5, P6, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */,
      v3: any /** TODO #9100 */, v4: any /** TODO #9100 */, v5: any /** TODO #9100 */,
      v6: any /** TODO #9100 */;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = uninitialized;
  return (p0, p1, p2, p3, p4, p5, p6) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      result = fn(p0, p1, p2, p3, p4, p5, p6);
    }
    return result;
  };
}

export function pureProxy8<P0, P1, P2, P3, P4, P5, P6, P7, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */,
      v3: any /** TODO #9100 */, v4: any /** TODO #9100 */, v5: any /** TODO #9100 */,
      v6: any /** TODO #9100 */, v7: any /** TODO #9100 */;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = uninitialized;
  return (p0, p1, p2, p3, p4, p5, p6, p7) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6) || !looseIdentical(v7, p7)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      v7 = p7;
      result = fn(p0, p1, p2, p3, p4, p5, p6, p7);
    }
    return result;
  };
}

export function pureProxy9<P0, P1, P2, P3, P4, P5, P6, P7, P8, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */,
      v3: any /** TODO #9100 */, v4: any /** TODO #9100 */, v5: any /** TODO #9100 */,
      v6: any /** TODO #9100 */, v7: any /** TODO #9100 */, v8: any /** TODO #9100 */;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = uninitialized;
  return (p0, p1, p2, p3, p4, p5, p6, p7, p8) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6) || !looseIdentical(v7, p7) || !looseIdentical(v8, p8)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      v7 = p7;
      v8 = p8;
      result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8);
    }
    return result;
  };
}

export function pureProxy10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8, p9: P9) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8, p9: P9) => R {
  var result: R;
  var v0: any /** TODO #9100 */, v1: any /** TODO #9100 */, v2: any /** TODO #9100 */,
      v3: any /** TODO #9100 */, v4: any /** TODO #9100 */, v5: any /** TODO #9100 */,
      v6: any /** TODO #9100 */, v7: any /** TODO #9100 */, v8: any /** TODO #9100 */,
      v9: any /** TODO #9100 */;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = v9 = uninitialized;
  return (p0, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6) || !looseIdentical(v7, p7) || !looseIdentical(v8, p8) ||
        !looseIdentical(v9, p9)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      v7 = p7;
      v8 = p8;
      v9 = p9;
      result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9);
    }
    return result;
  };
}

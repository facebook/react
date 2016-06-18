import {PromiseWrapper} from '../../facade/async';
import {Type, isPresent} from '../../facade/lang';
import {BLANK_ROUTE_DATA, RouteData} from '../../instruction';

import {RouteHandler} from './route_handler';


export class SyncRouteHandler implements RouteHandler {
  public data: RouteData;

  /** @internal */
  _resolvedComponent: Promise<any> = null;

  constructor(public componentType: Type, data?: {[key: string]: any}) {
    this._resolvedComponent = PromiseWrapper.resolve(componentType);
    this.data = isPresent(data) ? new RouteData(data) : BLANK_ROUTE_DATA;
  }

  resolveComponentType(): Promise<any> { return this._resolvedComponent; }
}

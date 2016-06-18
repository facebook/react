import {Type, isPresent} from '../../facade/lang';
import {BLANK_ROUTE_DATA, RouteData} from '../../instruction';

import {RouteHandler} from './route_handler';


export class AsyncRouteHandler implements RouteHandler {
  /** @internal */
  _resolvedComponent: Promise<Type> = null;
  componentType: Type;
  public data: RouteData;

  constructor(private _loader: () => Promise<Type>, data: {[key: string]: any} = null) {
    this.data = isPresent(data) ? new RouteData(data) : BLANK_ROUTE_DATA;
  }

  resolveComponentType(): Promise<Type> {
    if (isPresent(this._resolvedComponent)) {
      return this._resolvedComponent;
    }

    return this._resolvedComponent = this._loader().then((componentType) => {
      this.componentType = componentType;
      return componentType;
    });
  }
}

import {Type} from '../../facade/lang';
import {RouteData} from '../../instruction';

export interface RouteHandler {
  componentType: Type;
  resolveComponentType(): Promise<any>;
  data: RouteData;
}

/**
 * @module
 * @description
 * Maps application URLs into application states, to support deep-linking and navigation.
 */

export {ROUTER_DIRECTIVES} from './src/directives/router_directives';
export {RouterLink} from './src/directives/router_link';
export {RouterOutlet} from './src/directives/router_outlet';
export {CanDeactivate, OnActivate} from './src/interfaces';
export {Routes} from './src/metadata/decorators';
export {Route} from './src/metadata/metadata';
export {Router, RouterOutletMap} from './src/router';
export {ROUTER_PROVIDERS} from './src/router_providers';
export {DefaultRouterUrlSerializer, RouterUrlSerializer} from './src/router_url_serializer';
export {RouteSegment, RouteTree, Tree, UrlSegment, UrlTree} from './src/segments';

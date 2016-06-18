import * as dom_adapter from './src/dom/dom_adapter';
import * as dom_renderer from './src/dom/dom_renderer';
import * as shared_styles_host from './src/dom/shared_styles_host';

export declare namespace __platform_browser_private_types__ {
  export type DomAdapter = dom_adapter.DomAdapter;
  export var DomAdapter: typeof dom_adapter.DomAdapter;
  export var getDOM: typeof dom_adapter.getDOM;
  export var setRootDomAdapter: typeof dom_adapter.setRootDomAdapter;
  export type DomRootRenderer = dom_renderer.DomRootRenderer;
  export var DomRootRenderer: typeof dom_renderer.DomRootRenderer;
  export type DomRootRenderer_ = dom_renderer.DomRootRenderer_;
  export var DomRootRenderer_: typeof dom_renderer.DomRootRenderer_;
  export type DomSharedStylesHost = shared_styles_host.DomSharedStylesHost;
  export var DomSharedStylesHost: typeof shared_styles_host.DomSharedStylesHost;
  export type SharedStylesHost = shared_styles_host.SharedStylesHost;
  export var SharedStylesHost: typeof shared_styles_host.SharedStylesHost;
}

export var __platform_browser_private__ = {
  DomAdapter: dom_adapter.DomAdapter,
  getDOM: dom_adapter.getDOM,
  setRootDomAdapter: dom_adapter.setRootDomAdapter,
  DomRootRenderer: dom_renderer.DomRootRenderer,
  DomRootRenderer_: dom_renderer.DomRootRenderer_,
  DomSharedStylesHost: shared_styles_host.DomSharedStylesHost,
  SharedStylesHost: shared_styles_host.SharedStylesHost
};

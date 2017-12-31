declare type ComponentWithCacheContext = {
  type: 'ComponentWithCache';
  bufferIndex: number;
  buffer: Array<string>;
  key: string;
};

declare type ElementContext = {
  type: 'Element';
  children: Array<VNode>;
  rendered: number;
  endTag: string;
  total: number;
};

declare type ComponentContext = {
  type: 'Component';
  prevActive: Component;
};

declare type RenderState = ComponentContext | ComponentWithCacheContext | ElementContext;

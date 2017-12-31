declare module 'he' {
  declare function escape(html: string): string;
  declare function decode(html: string): string;
}

declare module 'source-map' {
  declare class SourceMapGenerator {
    setSourceContent(filename: string, content: string): void;
    addMapping(mapping: Object): void;
    toString(): string;
  }
  declare class SourceMapConsumer {
    constructor (map: Object): void;
    originalPositionFor(position: { line: number; column: number; }): {
      source: ?string;
      line: ?number;
      column: ?number;
    };
  }
}

declare module 'lru-cache' {
  declare var exports: {
    (): any
  }
}

declare module 'de-indent' {
  declare var exports: {
    (input: string): string
  }
}

declare module 'serialize-javascript' {
  declare var exports: {
    (input: string, options: { isJSON: boolean }): string
  }
}

declare module 'lodash.template' {
  declare var exports: {
    (input: string, options: { interpolate: RegExp, escape: RegExp }): Function
  }
}

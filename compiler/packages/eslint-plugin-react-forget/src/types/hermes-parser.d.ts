// v0.12.1
declare module "hermes-parser" {
  type HermesParserOptions = {
    babel: boolean;
    allowReturnOutsideFunction: boolean;
    flow: "all" | "detect";
    sourceFilename: string | null;
    sourceType: "module" | "script" | "unambiguous";
    tokens: boolean;
  };
  export function parse(code: string, options: Partial<HermesParserOptions>);
}

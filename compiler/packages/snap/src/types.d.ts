// v0.17.1
declare module "hermes-parser" {
  type HermesParserOptions = {
    allowReturnOutsideFunction?: boolean;
    babel?: boolean;
    flow?: "all" | "detect";
    enableExperimentalComponentSyntax?: boolean;
    sourceFilename?: string;
    sourceType?: "module" | "script" | "unambiguous";
    tokens?: boolean;
  };
  export function parse(code: string, options: Partial<HermesParserOptions>);
}

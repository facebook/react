import {compile, type PrintedCompilerPipelineValue} from '../compiler';
import {
  CompilerPipelineValue,
  printReactiveFunctionWithOutlined,
  printFunctionWithOutlined,
  PluginOptions,
  SourceLocation,
} from 'babel-plugin-react-compiler/src';
import assertExhaustive from '../utils/assertExhaustive';

export type PassNameType =
  | 'HIR'
  | 'ReactiveFunction'
  | 'All'
  | '@DEBUG'
  | undefined;

type CompilerToolOutput =
  | {
      kind: 'success';
      content: Array<string>;
    }
  | {
      kind: 'bailout';
      content: Array<string>;
    }
  | {
      kind: 'compile-error';
      text: string;
    }
  | {
      kind: 'error';
      text: string;
    };

export async function compileTool(
  text: string,
  passName: PassNameType,
): Promise<CompilerToolOutput> {
  const pipelinePasses = new Map<string, Array<PrintedCompilerPipelineValue>>();
  const recordPass: (result: PrintedCompilerPipelineValue) => void = result => {
    const entry = pipelinePasses.get(result.name);
    if (Array.isArray(entry)) {
      entry.push(result);
    } else {
      pipelinePasses.set(result.name, [result]);
    }
  };
  const logIR = (result: CompilerPipelineValue): void => {
    switch (result.kind) {
      case 'ast': {
        break;
      }
      case 'hir': {
        recordPass({
          kind: 'hir',
          fnName: result.value.id,
          name: result.name,
          value: printFunctionWithOutlined(result.value),
        });
        break;
      }
      case 'reactive': {
        recordPass({
          kind: 'reactive',
          fnName: result.value.id,
          name: result.name,
          value: printReactiveFunctionWithOutlined(result.value),
        });
        break;
      }
      case 'debug': {
        recordPass({
          kind: 'debug',
          fnName: null,
          name: result.name,
          value: result.value,
        });
        break;
      }
      default: {
        assertExhaustive(result, `Unhandled result ${result}`);
      }
    }
  };
  const errors: Array<{message: string; loc: SourceLocation | null}> = [];
  const compilerOptions: Partial<PluginOptions> = {
    panicThreshold: 'none',
    logger: {
      debugLogIRs: logIR,
      logEvent: (_filename, event): void => {
        if (event.kind === 'CompileError') {
          const detail = event.detail;
          const loc =
            detail.loc == null || typeof detail.loc == 'symbol'
              ? event.fnLoc
              : detail.loc;
          errors.push({
            message: detail.reason,
            loc,
          });
        }
      },
    },
  };
  try {
    const result = await compile({
      text,
      file: 'anonymous.tsx',
      options: compilerOptions,
    });
    if (result.code == null) {
      return {
        kind: 'compile-error',
        text: 'Error: Could not compile',
      };
    }
    const requestedPasses: Array<string> = [];
    if (passName != null) {
      switch (passName) {
        case 'All': {
          const hir = pipelinePasses.get('PropagateScopeDependenciesHIR');
          if (hir !== undefined) {
            for (const pipelineValue of hir) {
              requestedPasses.push(pipelineValue.value);
            }
          }
          const reactiveFunc = pipelinePasses.get('PruneHoistedContexts');
          if (reactiveFunc !== undefined) {
            for (const pipelineValue of reactiveFunc) {
              requestedPasses.push(pipelineValue.value);
            }
          }
          break;
        }
        case 'HIR': {
          // Last pass before HIR -> ReactiveFunction
          const requestedPass = pipelinePasses.get(
            'PropagateScopeDependenciesHIR',
          );
          if (requestedPass !== undefined) {
            for (const pipelineValue of requestedPass) {
              requestedPasses.push(pipelineValue.value);
            }
          } else {
            console.error(`Could not find requested pass ${passName}`);
          }
          break;
        }
        case 'ReactiveFunction': {
          // Last pass
          const requestedPass = pipelinePasses.get('PruneHoistedContexts');
          if (requestedPass !== undefined) {
            for (const pipelineValue of requestedPass) {
              requestedPasses.push(pipelineValue.value);
            }
          } else {
            console.error(`Could not find requested pass ${passName}`);
          }
          break;
        }
        case '@DEBUG': {
          for (const [, pipelinePass] of pipelinePasses) {
            for (const pass of pipelinePass) {
              requestedPasses.push(`${pass.name}\n\n${pass.value}`);
            }
          }
          break;
        }
        default: {
          assertExhaustive(passName, `Unhandled passName option: ${passName}`);
        }
      }
      const requestedPass = pipelinePasses.get(passName);
      if (requestedPass !== undefined) {
        for (const pipelineValue of requestedPass) {
          if (pipelineValue.name === passName) {
            requestedPasses.push(pipelineValue.value);
          }
        }
      }
    }
    if (errors.length > 0) {
      return {
        kind: 'bailout',
        content: errors.map(err => {
          return err.loc === null || typeof err.loc === 'symbol'
            ? `React Compiler bailed out:\n\n${err.message}`
            : `React Compiler bailed out:\n\n${err.message}@${err.loc.start.line}:${err.loc.end.line}`;
        }),
      };
    }
    return {
      kind: 'success',
      content: [result.code, ...requestedPasses],
    };
  } catch (err) {
    return {
      kind: 'error',
      text: `Error: ${err.stack}`,
    };
  }
}

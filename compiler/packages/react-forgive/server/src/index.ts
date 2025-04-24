/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TextDocument} from 'vscode-languageserver-textdocument';
import {
  CodeLens,
  createConnection,
  type InitializeParams,
  type InitializeResult,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import {compile, lastResult} from './compiler';
import {type PluginOptions} from 'babel-plugin-react-compiler/src';
import {resolveReactConfig} from './compiler/options';
import {
  type CompileSuccessEvent,
  type LoggerEvent,
  defaultOptions,
} from 'babel-plugin-react-compiler/src/Entrypoint/Options';
import {babelLocationToRange, getRangeFirstCharacter} from './compiler/compat';
import {
  type AutoDepsDecorationsLSPEvent,
  AutoDepsDecorationsRequest,
  mapCompilerEventToLSPEvent,
} from './requests/autodepsdecorations';
import {isPositionWithinRange} from './utils/range';

const SUPPORTED_LANGUAGE_IDS = new Set([
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
]);

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let compilerOptions: PluginOptions | null = null;
let compiledFns: Set<CompileSuccessEvent> = new Set();
let autoDepsDecorations: Array<AutoDepsDecorationsLSPEvent> = [];

connection.onInitialize((_params: InitializeParams) => {
  // TODO(@poteto) get config fr
  compilerOptions = resolveReactConfig('.') ?? defaultOptions;
  compilerOptions = {
    ...compilerOptions,
    environment: {
      ...compilerOptions.environment,
      inferEffectDependencies: [
        {
          function: {
            importSpecifierName: 'useEffect',
            source: 'react',
          },
          numRequiredArgs: 1,
        },
        {
          function: {
            importSpecifierName: 'useSpecialEffect',
            source: 'shared-runtime',
          },
          numRequiredArgs: 2,
        },
        {
          function: {
            importSpecifierName: 'default',
            source: 'useEffectWrapper',
          },
          numRequiredArgs: 1,
        },
      ],
    },
    logger: {
      logEvent(_filename: string | null, event: LoggerEvent) {
        connection.console.info(`Received event: ${event.kind}`);
        if (event.kind === 'CompileSuccess') {
          compiledFns.add(event);
        }
        if (event.kind === 'AutoDepsDecorations') {
          autoDepsDecorations.push(mapCompilerEventToLSPEvent(event));
        }
      },
    },
  };
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      codeLensProvider: {resolveProvider: true},
    },
  };
  return result;
});

connection.onInitialized(() => {
  connection.console.log('initialized');
});

documents.onDidChangeContent(async event => {
  connection.console.info(`Changed: ${event.document.uri}`);
  compiledFns.clear();
  autoDepsDecorations = [];
  if (SUPPORTED_LANGUAGE_IDS.has(event.document.languageId)) {
    const text = event.document.getText();
    await compile({
      text,
      file: event.document.uri,
      options: compilerOptions,
    });
  }
});

connection.onDidChangeWatchedFiles(change => {
  compiledFns.clear();
  autoDepsDecorations = [];
  connection.console.log(
    change.changes.map(c => `File changed: ${c.uri}`).join('\n'),
  );
});

connection.onCodeLens(params => {
  connection.console.info(`Handling codelens for: ${params.textDocument.uri}`);
  if (compiledFns.size === 0) {
    return;
  }
  const lenses: Array<CodeLens> = [];
  for (const compiled of compiledFns) {
    if (compiled.fnLoc != null) {
      const fnLoc = babelLocationToRange(compiled.fnLoc);
      if (fnLoc === null) continue;
      const lens = CodeLens.create(
        getRangeFirstCharacter(fnLoc),
        compiled.fnLoc,
      );
      if (lastResult?.code != null) {
        lens.command = {
          title: 'Optimized by React Compiler',
          command: 'todo',
        };
      }
      lenses.push(lens);
    }
  }
  return lenses;
});

connection.onCodeLensResolve(lens => {
  connection.console.info(`Resolving codelens for: ${JSON.stringify(lens)}`);
  if (lastResult?.code != null) {
    connection.console.log(lastResult.code);
  }
  return lens;
});

connection.onRequest(AutoDepsDecorationsRequest.type, async params => {
  const position = params.position;
  connection.console.debug('Client hovering on: ' + JSON.stringify(position));
  for (const dec of autoDepsDecorations) {
    if (isPositionWithinRange(position, dec.useEffectCallExpr)) {
      return dec.decorations;
    }
  }
  return null;
});

documents.listen(connection);
connection.listen();
connection.console.info(`React Analyzer running in node ${process.version}`);

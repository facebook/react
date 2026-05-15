/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TextDocument} from 'vscode-languageserver-textdocument';
import {
  CodeAction,
  CodeActionKind,
  CodeLens,
  Command,
  createConnection,
  type InitializeParams,
  type InitializeResult,
  Position,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import {compile, lastResult} from './compiler';
import {
  type CompileSuccessEvent,
  type LoggerEvent,
  type PluginOptions,
  defaultOptions,
} from 'babel-plugin-react-compiler';
import {babelLocationToRange, getRangeFirstCharacter} from './compiler/compat';
import {
  type AutoDepsDecorationsLSPEvent,
  AutoDepsDecorationsRequest,
  mapCompilerEventToLSPEvent,
} from './requests/autodepsdecorations';
import {
  isPositionWithinRange,
  isRangeWithinRange,
  Range,
  sourceLocationToRange,
} from './utils/range';

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
let codeActionEvents: Array<CodeActionLSPEvent> = [];

type CodeActionLSPEvent = {
  title: string;
  kind: CodeActionKind;
  newText: string;
  anchorRange: Range;
  editRange: {start: Position; end: Position};
};

connection.onInitialize((_params: InitializeParams) => {
  compilerOptions = defaultOptions;
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
          autodepsIndex: 1,
        },
        {
          function: {
            importSpecifierName: 'useSpecialEffect',
            source: 'shared-runtime',
          },
          autodepsIndex: 2,
        },
        {
          function: {
            importSpecifierName: 'default',
            source: 'useEffectWrapper',
          },
          autodepsIndex: 1,
        },
      ],
    },
    logger: {
      logEvent(_filename: string | null, event: LoggerEvent) {
        connection.console.info(`Received event: ${event.kind}`);
        connection.console.debug(JSON.stringify(event, null, 2));
        if (event.kind === 'CompileSuccess') {
          compiledFns.add(event);
        }
        if (event.kind === 'AutoDepsDecorations') {
          autoDepsDecorations.push(mapCompilerEventToLSPEvent(event));
        }
        if (event.kind === 'AutoDepsEligible') {
          const depArrayLoc = sourceLocationToRange(event.depArrayLoc);
          codeActionEvents.push({
            title: 'Use React Compiler inferred dependency array',
            kind: CodeActionKind.QuickFix,
            newText: '',
            anchorRange: sourceLocationToRange(event.fnLoc),
            editRange: {start: depArrayLoc[0], end: depArrayLoc[1]},
          });
        }
      },
    },
  };
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      codeLensProvider: {resolveProvider: true},
      codeActionProvider: {resolveProvider: true},
    },
  };
  return result;
});

connection.onInitialized(() => {
  connection.console.log('initialized');
});

documents.onDidChangeContent(async event => {
  connection.console.info(`Compiling: ${event.document.uri}`);
  resetState();
  if (SUPPORTED_LANGUAGE_IDS.has(event.document.languageId)) {
    const text = event.document.getText();
    try {
      await compile({
        text,
        file: event.document.uri,
        options: compilerOptions,
      });
    } catch (err) {
      connection.console.error('Failed to compile');
      if (err instanceof Error) {
        connection.console.error(err.stack ?? err.message);
      } else {
        connection.console.error(JSON.stringify(err, null, 2));
      }
    }
  }
});

connection.onDidChangeWatchedFiles(change => {
  resetState();
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

connection.onCodeAction(params => {
  const codeActions: Array<CodeAction> = [];
  for (const codeActionEvent of codeActionEvents) {
    if (
      isRangeWithinRange(
        [params.range.start, params.range.end],
        codeActionEvent.anchorRange,
      )
    ) {
      const codeAction = CodeAction.create(
        codeActionEvent.title,
        {
          changes: {
            [params.textDocument.uri]: [
              {
                newText: codeActionEvent.newText,
                range: codeActionEvent.editRange,
              },
            ],
          },
        },
        codeActionEvent.kind,
      );
      // After executing a codeaction, we want to draw autodep decorations again
      codeAction.command = Command.create(
        'Request autodeps decorations',
        'react.requestAutoDepsDecorations',
        codeActionEvent.anchorRange[0],
      );
      codeActions.push(codeAction);
    }
  }
  return codeActions;
});

/**
 * The client can request the server to compute autodeps decorations based on a currently selected
 * position if the selected position is within an autodep eligible function call.
 */
connection.onRequest(AutoDepsDecorationsRequest.type, async params => {
  const position = params.position;
  for (const decoration of autoDepsDecorations) {
    if (isPositionWithinRange(position, decoration.useEffectCallExpr)) {
      return decoration;
    }
  }
  return null;
});

function resetState() {
  connection.console.debug('Clearing state');
  compiledFns.clear();
  autoDepsDecorations = [];
  codeActionEvents = [];
}

documents.listen(connection);
connection.listen();
connection.console.info(`React Analyzer running in node ${process.version}`);

import * as path from 'path';
import * as vscode from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  type Position,
  RequestType,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';
import {WHITE} from './colors';

let client: LanguageClient;
const inferredEffectDepDecoration =
  vscode.window.createTextEditorDecorationType({
    backgroundColor: WHITE.toAlphaString(0.3),
  });

type Range = [Position, Position];
interface AutoDepsDecorationsParams {
  position: Position;
}
namespace AutoDepsDecorationsRequest {
  export const type = new RequestType<
    AutoDepsDecorationsParams,
    Array<Range> | null,
    void
  >('react/autodeps_decorations');
}

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));
  const documentSelector = [
    {scheme: 'file', language: 'javascriptreact'},
    {scheme: 'file', language: 'typescriptreact'},
  ];

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector,
    progressOnInitialization: true,
  };

  // Create the language client and start the client.
  try {
    client = new LanguageClient(
      'react-forgive',
      'React Analyzer',
      serverOptions,
      clientOptions,
    );
  } catch {
    vscode.window.showErrorMessage(
      `React Analyzer couldn't be started. See the output channel for details.`,
    );
    return;
  }

  vscode.languages.registerHoverProvider(documentSelector, {
    provideHover(_document, position, _token) {
      client
        .sendRequest(AutoDepsDecorationsRequest.type, {position})
        .then(decorations => {
          if (Array.isArray(decorations)) {
            const decorationOptions = decorations.map(([start, end]) => {
              return {
                range: new vscode.Range(
                  new vscode.Position(start.line, start.character),
                  new vscode.Position(end.line, end.character),
                ),
                hoverMessage: 'Inferred as an effect dependency',
              };
            });
            vscode.window.activeTextEditor?.setDecorations(
              inferredEffectDepDecoration,
              decorationOptions,
            );
          } else {
            clearDecorations(inferredEffectDepDecoration);
          }
        });
      return null;
    },
  });

  client.registerProposedFeatures();
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (client !== undefined) {
    return client.stop();
  }
  return;
}

export function clearDecorations(
  decorationType: vscode.TextEditorDecorationType,
) {
  vscode.window.activeTextEditor?.setDecorations(decorationType, []);
}

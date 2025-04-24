import * as path from 'path';
import * as vscode from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  Position,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

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
        .sendRequest('react/autodepsdecorations', position)
        .then((decorations: Array<[Position, Position]>) => {
          for (const [start, end] of decorations) {
            const range = new vscode.Range(
              new vscode.Position(start.line, start.character),
              new vscode.Position(end.line, end.character),
            );
            const vscodeDecoration =
              vscode.window.createTextEditorDecorationType({
                backgroundColor: 'red',
              });
            vscode.window.activeTextEditor?.setDecorations(vscodeDecoration, [
              {
                range,
                hoverMessage: 'hehe',
              },
            ]);
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
}

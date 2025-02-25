import * as path from 'path';
import {ExtensionContext, window as Window} from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));

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
    documentSelector: [
      {scheme: 'file', language: 'javascriptreact'},
      {scheme: 'file', language: 'typescriptreact'},
    ],
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
    Window.showErrorMessage(
      `React Analyzer couldn't be started. See the output channel for details.`,
    );
    return;
  }

  client.registerProposedFeatures();
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (client !== undefined) {
    return client.stop();
  }
}

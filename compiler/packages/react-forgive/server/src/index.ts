/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TextDocument} from 'vscode-languageserver-textdocument';
import {
  createConnection,
  type InitializeParams,
  type InitializeResult,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import {compile} from './compiler';
import {type PluginOptions} from 'babel-plugin-react-compiler/src';
import {resolveReactConfig} from './compiler/options';

const SUPPORTED_LANGUAGE_IDS = new Set([
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
]);

const connection = createConnection(ProposedFeatures.all);
connection.console.info(`React Analyzer running in node ${process.version}`);

const compiledCache = new WeakMap<TextDocument, string>();

const documents = new TextDocuments(TextDocument);
documents.listen(connection);

let compilerOptions: PluginOptions | null = null;

connection.onInitialize((_params: InitializeParams) => {
  // TODO(@poteto) get config fr
  compilerOptions = resolveReactConfig('.');
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

documents.onDidOpen(async event => {
  if (SUPPORTED_LANGUAGE_IDS.has(event.document.languageId)) {
    const result = await compile({
      text: event.document.getText(),
      file: event.document.uri,
      options: compilerOptions,
    });
    if (result.code != null) {
      compiledCache.set(event.document, result.code);
      connection.console.log(result.code);
    }
  }
});

documents.onDidChangeContent(async event => {
  if (SUPPORTED_LANGUAGE_IDS.has(event.document.languageId)) {
    const result = await compile({
      text: event.document.getText(),
      file: event.document.uri,
      options: compilerOptions,
    });
    if (result.code != null) {
      compiledCache.set(event.document, result.code);
      connection.console.log(result.code);
    }
  }
});

connection.onDidChangeWatchedFiles(change => {
  connection.console.log(
    change.changes.map(c => `File changed: ${c.uri}`).join('\n'),
  );
});

connection.onCodeLens(params => {
  connection.console.log(JSON.stringify(params, null, 2));
  return [];
});

connection.listen();

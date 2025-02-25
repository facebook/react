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
import {type BabelFileResult} from '@babel/core';

const SUPPORTED_LANGUAGE_IDS = new Set([
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
]);

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let compilerOptions: PluginOptions | null = null;
let lastResult: BabelFileResult | null = null;

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
    const text = event.document.getText();
    const result = await compile({
      text,
      file: event.document.uri,
      options: compilerOptions,
    });
    if (result.code != null) {
      lastResult = result;
    }
  }
});

documents.onDidChangeContent(async event => {
  if (SUPPORTED_LANGUAGE_IDS.has(event.document.languageId)) {
    const text = event.document.getText();
    const result = await compile({
      text,
      file: event.document.uri,
      options: compilerOptions,
    });
    if (result.code != null) {
      lastResult = result;
    }
  }
});

connection.onDidChangeWatchedFiles(change => {
  connection.console.log(
    change.changes.map(c => `File changed: ${c.uri}`).join('\n'),
  );
});

connection.onCodeLens(params => {
  connection.console.log('lastResult: ' + JSON.stringify(lastResult, null, 2));
  connection.console.log('params: ' + JSON.stringify(params, null, 2));
  return [];
});

documents.listen(connection);
connection.listen();
connection.console.info(`React Analyzer running in node ${process.version}`);

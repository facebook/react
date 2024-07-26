/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MonacoEditor, {loader, type Monaco} from '@monaco-editor/react';
import {CompilerErrorDetail} from 'babel-plugin-react-compiler/src';
import invariant from 'invariant';
import type {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import {Resizable} from 're-resizable';
import {useEffect, useState} from 'react';
import {renderReactCompilerMarkers} from '../../lib/reactCompilerMonacoDiagnostics';
import {useStore, useStoreDispatch} from '../StoreContext';
import {monacoOptions} from './monacoOptions';
// TODO: Make TS recognize .d.ts files, in addition to loading them with webpack.
// @ts-ignore
import React$Types from '../../node_modules/@types/react/index.d.ts';

loader.config({monaco});

type Props = {
  errors: CompilerErrorDetail[];
  language: 'flow' | 'typescript';
};

export default function Input({errors, language}: Props) {
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const store = useStore();
  const dispatchStore = useStoreDispatch();

  // Set tab width to 2 spaces for the selected input file.
  useEffect(() => {
    if (!monaco) return;
    const uri = monaco.Uri.parse(`file:///index.js`);
    const model = monaco.editor.getModel(uri);
    invariant(model, 'Model must exist for the selected input file.');
    renderReactCompilerMarkers({monaco, model, details: errors});
    // N.B. that `tabSize` is a model property, not an editor property.
    // So, the tab size has to be set per model.
    model.updateOptions({tabSize: 2});
  }, [monaco, errors]);

  const flowDiagnosticDisable = [
    7028 /* unused label */, 6133 /* var declared but not read */,
  ];
  useEffect(() => {
    // Ignore "can only be used in TypeScript files." errors, since
    // we want to support syntax highlighting for Flow (*.js) files
    // and Flow is not a built-in language.
    if (!monaco) return;
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [
        8002,
        8003,
        8004,
        8005,
        8006,
        8008,
        8009,
        8010,
        8011,
        8012,
        8013,
        ...(language === 'flow' ? flowDiagnosticDisable : []),
      ],
      noSemanticValidation: true,
      // Monaco can't validate Flow component syntax
      noSyntaxValidation: language === 'flow',
    });
  }, [monaco, language]);

  const handleChange = (value: string | undefined) => {
    if (!value) return;

    dispatchStore({
      type: 'updateFile',
      payload: {
        source: value,
      },
    });
  };

  const handleMount = (_: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    setMonaco(monaco);

    const tscOptions = {
      allowNonTsExtensions: true,
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      jsx: monaco.languages.typescript.JsxEmit.Preserve,
      typeRoots: ['node_modules/@types'],
      allowSyntheticDefaultImports: true,
    };
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
      tscOptions,
    );
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...tscOptions,
      checkJs: true,
      allowJs: true,
    });

    // Add React type declarations to Monaco
    const reactLib = [
      React$Types,
      'file:///node_modules/@types/react/index.d.ts',
    ] as [any, string];
    monaco.languages.typescript.javascriptDefaults.addExtraLib(...reactLib);
    monaco.languages.typescript.typescriptDefaults.addExtraLib(...reactLib);

    // Remeasure the font in case the custom font is loaded only after
    // Monaco Editor is mounted.
    // N.B. that this applies also to the output editor as it seems
    // Monaco Editor instances share the same font config.
    document.fonts.ready.then(() => {
      monaco.editor.remeasureFonts();
    });
  };

  return (
    <div className="relative flex flex-col flex-none border-r border-gray-200">
      <Resizable
        minWidth={650}
        enable={{right: true}}
        // Restrict MonacoEditor's height, since the config autoLayout:true
        // will grow the editor to fit within parent element
        className="!h-[calc(100vh_-_3.5rem)]">
        <MonacoEditor
          path={'index.js'}
          // .js and .jsx files are specified to be TS so that Monaco can actually
          // check their syntax using its TS language service. They are still JS files
          // due to their extensions, so TS language features don't work.
          language={'javascript'}
          value={store.source}
          onMount={handleMount}
          onChange={handleChange}
          options={monacoOptions}
        />
      </Resizable>
    </div>
  );
}

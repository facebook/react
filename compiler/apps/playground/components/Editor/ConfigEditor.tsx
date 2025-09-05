/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MonacoEditor, {loader, type Monaco} from '@monaco-editor/react';
import type {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import React, {useState, useCallback} from 'react';
import {Resizable} from 're-resizable';
import {useSnackbar} from 'notistack';
import {useStore, useStoreDispatch} from '../StoreContext';
import {monacoOptions} from './monacoOptions';
import {
  ConfigError,
  generateOverridePragmaFromConfig,
  updateSourceWithOverridePragma,
} from '../../lib/configUtils';

// @ts-expect-error - webpack asset/source loader handles .d.ts files as strings
import compilerTypeDefs from 'babel-plugin-react-compiler/dist/index.d.ts';

loader.config({monaco});

export default function ConfigEditor(): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const store = useStore();
  const dispatchStore = useStoreDispatch();
  const {enqueueSnackbar} = useSnackbar();

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleApplyConfig: () => Promise<void> = async () => {
    try {
      const config = store.config || '';

      if (!config.trim()) {
        enqueueSnackbar(
          'Config is empty. Please add configuration options first.',
          {
            variant: 'warning',
          },
        );
        return;
      }
      const newPragma = await generateOverridePragmaFromConfig(config);
      const updatedSource = updateSourceWithOverridePragma(
        store.source,
        newPragma,
      );

      dispatchStore({
        type: 'updateFile',
        payload: {
          source: updatedSource,
          config: config,
        },
      });
    } catch (error) {
      console.error('Failed to apply config:', error);

      if (error instanceof ConfigError && error.message.trim()) {
        enqueueSnackbar(error.message, {
          variant: 'error',
        });
      } else {
        enqueueSnackbar('Unexpected error: failed to apply config.', {
          variant: 'error',
        });
      }
    }
  };

  const handleChange: (value: string | undefined) => void = value => {
    if (value === undefined) return;

    // Only update the config
    dispatchStore({
      type: 'updateFile',
      payload: {
        source: store.source,
        config: value,
      },
    });
  };

  const handleMount: (
    _: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => void = (_, monaco) => {
    // Add the babel-plugin-react-compiler type definitions to Monaco
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      //@ts-expect-error - compilerTypeDefs is a string
      compilerTypeDefs,
      'file:///node_modules/babel-plugin-react-compiler/dist/index.d.ts',
    );
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      strict: false,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
    });

    const uri = monaco.Uri.parse(`file:///config.ts`);
    const model = monaco.editor.getModel(uri);
    if (model) {
      model.updateOptions({tabSize: 2});
    }
  };

  return (
    <div className="flex flex-row relative">
      {isExpanded ? (
        <>
          <Resizable
            className="border-r"
            minWidth={300}
            maxWidth={600}
            defaultSize={{width: 350, height: 'auto'}}
            enable={{right: true}}>
            <h2
              title="Minimize config editor"
              aria-label="Minimize config editor"
              onClick={toggleExpanded}
              className="p-4 duration-150 ease-in border-b cursor-pointer border-grey-200 font-light text-secondary hover:text-link">
              - Config Overrides
            </h2>
            <div className="h-[calc(100vh_-_3.5rem_-_4rem)]">
              <MonacoEditor
                path={'config.ts'}
                language={'typescript'}
                value={store.config}
                onMount={handleMount}
                onChange={handleChange}
                options={{
                  ...monacoOptions,
                  lineNumbers: 'off',
                  folding: false,
                  renderLineHighlight: 'none',
                  scrollBeyondLastLine: false,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  overviewRulerLanes: 0,
                  fontSize: 12,
                }}
              />
            </div>
          </Resizable>
          <button
            onClick={handleApplyConfig}
            title="Apply config overrides to input"
            aria-label="Apply config overrides to input"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm font-medium transition-colors duration-150">
            →
          </button>
        </>
      ) : (
        <div className="relative items-center h-full px-1 py-6 align-middle border-r border-grey-200">
          <button
            title="Expand config editor"
            aria-label="Expand config editor"
            style={{
              transform: 'rotate(90deg) translate(-50%)',
              whiteSpace: 'nowrap',
            }}
            onClick={toggleExpanded}
            className="flex-grow-0 w-5 transition-colors duration-150 ease-in font-light text-secondary hover:text-link">
            Config Overrides
          </button>
        </div>
      )}
    </div>
  );
}

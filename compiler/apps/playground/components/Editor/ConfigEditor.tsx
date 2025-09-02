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
import {useStore, useStoreDispatch} from '../StoreContext';
import {monacoOptions} from './monacoOptions';
import {
  generateOverridePragmaFromConfig,
  updateSourceWithOverridePragma,
} from '../../lib/configUtils';

loader.config({monaco});

export default function ConfigEditor(): React.ReactElement {
  const [, setMonaco] = useState<Monaco | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const store = useStore();
  const dispatchStore = useStoreDispatch();

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleChange: (value: string | undefined) => void = async value => {
    if (value === undefined) return;

    try {
      const newPragma = await generateOverridePragmaFromConfig(value);
      const updatedSource = updateSourceWithOverridePragma(
        store.source,
        newPragma,
      );

      // Update the store with both the new config and updated source
      dispatchStore({
        type: 'updateFile',
        payload: {
          source: updatedSource,
          config: value,
        },
      });
    } catch (_) {
      dispatchStore({
        type: 'updateFile',
        payload: {
          source: store.source,
          config: value,
        },
      });
    }
  };

  const handleMount: (
    _: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => void = (_, monaco) => {
    setMonaco(monaco);

    const uri = monaco.Uri.parse(`file:///config.js`);
    const model = monaco.editor.getModel(uri);
    if (model) {
      model.updateOptions({tabSize: 2});
    }
  };

  return (
    <div className="flex flex-row">
      {isExpanded ? (
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
              path={'config.js'}
              language={'javascript'}
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

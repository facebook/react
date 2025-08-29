/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MonacoEditor, {loader, type Monaco} from '@monaco-editor/react';
import type {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import {useState} from 'react';
import {Resizable} from 're-resizable';
import {useStore, useStoreDispatch} from '../StoreContext';
import {monacoOptions} from './monacoOptions';
import {
  generateOverridePragmaFromConfig,
  updateSourceWithOverridePragma,
} from '../../lib/configUtils';

loader.config({monaco});

export default function ConfigEditor(): JSX.Element {
  const [, setMonaco] = useState<Monaco | null>(null);
  const store = useStore();
  const dispatchStore = useStoreDispatch();

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
    <div className="relative flex flex-col flex-none border-r border-gray-200">
      <h2 className="p-4 duration-150 ease-in border-b cursor-default border-grey-200 font-light text-secondary">
        Config Overrides
      </h2>
      <Resizable
        minWidth={300}
        maxWidth={600}
        defaultSize={{width: 350, height: 'auto'}}
        enable={{right: true}}
        className="!h-[calc(100vh_-_3.5rem_-_4rem)]">
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
      </Resizable>
    </div>
  );
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MonacoEditor, {loader, type Monaco} from '@monaco-editor/react';
import {parseConfigPragmaAsString} from 'babel-plugin-react-compiler';
import type {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import parserBabel from 'prettier/plugins/babel';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as prettier from 'prettier/standalone';
import {useState, useEffect} from 'react';
import {Resizable} from 're-resizable';
import {useStore} from '../StoreContext';
import {monacoOptions} from './monacoOptions';

loader.config({monaco});

export default function ConfigEditor(): JSX.Element {
  const [, setMonaco] = useState<Monaco | null>(null);
  const store = useStore();

  // Parse string-based override config from pragma comment and format it
  const [configJavaScript, setConfigJavaScript] = useState('');

  useEffect(() => {
    const pragma = store.source.substring(0, store.source.indexOf('\n'));
    const configString = `(${parseConfigPragmaAsString(pragma)})`;

    prettier
      .format(configString, {
        semi: true,
        parser: 'babel-ts',
        plugins: [parserBabel, prettierPluginEstree],
      })
      .then(formatted => {
        setConfigJavaScript(formatted);
      })
      .catch(error => {
        console.error('Error formatting config:', error);
        setConfigJavaScript('({})'); // Return empty object if not valid for now
        //TODO: Add validation and error handling for config
      });
    console.log('Config:', configString);
  }, [store.source]);

  const handleChange: (value: string | undefined) => void = value => {
    if (!value) return;

    // TODO: Implement sync logic to update pragma comments in the source
    console.log('Config changed:', value);
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
          value={configJavaScript}
          onMount={handleMount}
          onChange={handleChange}
          options={{
            ...monacoOptions,
            readOnly: true,
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

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MonacoEditor, {loader, type Monaco} from '@monaco-editor/react';
import {parseConfigPragmaForTests, parsePluginOptions} from 'babel-plugin-react-compiler';
import type {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import {useEffect, useState, useMemo} from 'react';
import {Resizable} from 're-resizable';
import {useStore} from '../StoreContext';
import {monacoOptions} from './monacoOptions';

loader.config({monaco});

function formatConfigAsJavaScript(config: any): string {
  // Format the config object as readable JavaScript, assigned to a const
  const formatValue = (value: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);

    if (value === null) {
      return 'null';
    } else if (typeof value === 'string') {
      return `'${value}'`;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }
      const items = value.map(item => `${spaces}  ${formatValue(item, indent + 1)}`).join(',\n');
      return `[\n${items}\n${spaces}]`;
    } else if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return '{}';
      }
      const items = keys.map(key => {
        const formattedValue = formatValue(value[key], indent + 1);
        return `${spaces}  ${key}: ${formattedValue}`;
      }).join(',\n');
      return `{\n${items}\n${spaces}}`;
    } else {
      return String(value);
    }
  };

  // Assign the config object to a const
  return `const config = ${formatValue(config)};`;
}

export default function ConfigEditor(): JSX.Element {
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const store = useStore();

  // Parse current config from source pragma
  const currentConfig = useMemo(() => {
    try {
      const pragma = store.source.substring(0, store.source.indexOf('\n'));
      const parsedConfig = parseConfigPragmaForTests(pragma, {
        compilationMode: 'infer',
      });
      return parsedConfig;
    } catch (error) {
      // If parsing fails, return default config structure with all PluginOptions fields
      return parsePluginOptions({});
    }
  }, [store.source]);

  const configJavaScript = useMemo(() => {
    return formatConfigAsJavaScript(currentConfig);
  }, [currentConfig]);

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
        Compiler Config
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

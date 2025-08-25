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
import {useState, useMemo} from 'react';
import {Resizable} from 're-resizable';
import {useStore} from '../StoreContext';
import {monacoOptions} from './monacoOptions';

loader.config({monaco});

// Calculate default config
const DEFAULT_CONFIG = parsePluginOptions({});

/**
 * Deep equality check for various types
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'function') {
    return a.toString() === b.toString();
  }
  else if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !isEqual(value, b.get(key))) return false;
    }
    return true;
  }
  else if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  else if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => keysB.includes(key) && isEqual(a[key], b[key]));
  }

  return false;
}

/**
 * Recursive function to extract overridden values
 */
function getOverriddenValues(current: any, defaults: any): Record<string, any> {
  if (!isEqual(current, defaults)) {
    if (current && defaults &&
        typeof current === 'object' && typeof defaults === 'object' &&
        !Array.isArray(current) && !Array.isArray(defaults)) {

      const overrides: Record<string, any> = {};

      for (const key in current) {
        const nested = getOverriddenValues(current[key], defaults[key]);
        if (Object.keys(nested).length > 0 || !isEqual(current[key], defaults[key])) {
          overrides[key] = Object.keys(nested).length > 0 ? nested : current[key];
        }
      }
      return overrides;
    }
    return current;
  }

  return {};
}

/**
 * Format the config object as readable JavaScript, assigned to a const
 */
function formatConfigAsJavaScript(config: any): string {
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

export default function ConfigEditor(): React.JSX.Element {
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const store = useStore();

  // Parse current config from source pragma and show only overridden values
  const currentConfig = useMemo(() => {
    try {
      const pragma = store.source.substring(0, store.source.indexOf('\n'));
      const parsedConfig = parseConfigPragmaForTests(pragma, {
        compilationMode: 'infer',
      });

      // Extract overridden values
      const overrides = getOverriddenValues(parsedConfig, DEFAULT_CONFIG);

      return overrides;
    } catch (error) {
      // If parsing fails, return empty object (no overrides)
      return {};
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

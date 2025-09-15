/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MonacoEditor, {loader, type Monaco} from '@monaco-editor/react';
import {PluginOptions} from 'babel-plugin-react-compiler';
import type {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import React, {useState, Activity} from 'react';
import {Resizable} from 're-resizable';
import {useStore, useStoreDispatch} from '../StoreContext';
import {monacoOptions} from './monacoOptions';
import {IconChevron} from '../Icons/IconChevron';
import prettyFormat from 'pretty-format';

// @ts-expect-error - webpack asset/source loader handles .d.ts files as strings
import compilerTypeDefs from 'babel-plugin-react-compiler/dist/index.d.ts';

loader.config({monaco});

export default function ConfigEditor({
  appliedOptions,
}: {
  appliedOptions: PluginOptions | null;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Activity mode={isExpanded ? 'visible' : 'hidden'}>
        <ExpandedEditor
          onToggle={setIsExpanded}
          appliedOptions={appliedOptions}
        />
      </Activity>
      <Activity mode={!isExpanded ? 'visible' : 'hidden'}>
        <CollapsedEditor onToggle={setIsExpanded} />
      </Activity>
    </>
  );
}

function ExpandedEditor({
  onToggle,
  appliedOptions,
}: {
  onToggle: (expanded: boolean) => void;
  appliedOptions: PluginOptions | null;
}): React.ReactElement {
  const store = useStore();
  const dispatchStore = useStoreDispatch();

  const handleChange: (value: string | undefined) => void = value => {
    if (value === undefined) return;

    dispatchStore({
      type: 'updateConfig',
      payload: {
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

  const formattedAppliedOptions = appliedOptions
    ? prettyFormat(appliedOptions, {
        printFunctionName: false,
        printBasicPrototype: false,
      })
    : 'Invalid configs';

  return (
    <Resizable
      minWidth={300}
      maxWidth={600}
      defaultSize={{width: 350}}
      enable={{right: true, bottom: false}}
      style={{position: 'relative'}}>
      <div className="bg-gray-700 p-2 h-full flex flex-col !h-[calc(100vh_-_3.5rem)]">
        <div
          className="absolute w-10 h-16 bg-gray-700 hover:translate-x-2 transition-transform rounded-r-full flex items-center justify-center z-[5] cursor-pointer"
          title="Minimize config editor"
          onClick={() => onToggle(false)}
          style={{
            top: '50%',
            marginTop: '-32px',
            right: '-32px',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}>
          <IconChevron
            displayDirection="left"
            className="text-secondary-dark"
          />
        </div>

        <div className="flex-1 flex flex-col mb-2">
          <div className="pb-2">
            <h2 className="inline-block text-secondary-dark py-1.5 px-1.5 xs:px-3 sm:px-4 text-sm">
              Config Overrides
            </h2>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden">
            <MonacoEditor
              path={'config.ts'}
              language={'typescript'}
              value={store.config}
              onMount={handleMount}
              onChange={handleChange}
              options={{
                ...monacoOptions,
                lineNumbers: 'off',
                renderLineHighlight: 'none',
                overviewRulerBorder: false,
                overviewRulerLanes: 0,
                fontSize: 12,
                scrollBeyondLastLine: false,
                glyphMargin: false,
              }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="pb-2">
            <h2 className="inline-block text-secondary-dark py-1.5 px-1.5 xs:px-3 sm:px-4 text-sm">
              Applied Configs
            </h2>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden">
            <MonacoEditor
              path={'applied-config.js'}
              language={'javascript'}
              value={formattedAppliedOptions}
              options={{
                ...monacoOptions,
                lineNumbers: 'off',
                renderLineHighlight: 'none',
                overviewRulerBorder: false,
                overviewRulerLanes: 0,
                fontSize: 12,
                scrollBeyondLastLine: false,
                readOnly: true,
                glyphMargin: false,
              }}
            />
          </div>
        </div>
      </div>
    </Resizable>
  );
}

function CollapsedEditor({
  onToggle,
}: {
  onToggle: (expanded: boolean) => void;
}): React.ReactElement {
  return (
    <div
      className="w-4 !h-[calc(100vh_-_3.5rem)]"
      style={{position: 'relative'}}>
      <div
        className="absolute w-10 h-16 bg-gray-700 hover:translate-x-2 transition-transform rounded-r-full flex items-center justify-center z-[5] cursor-pointer"
        title="Expand config editor"
        onClick={() => onToggle(true)}
        style={{
          top: '50%',
          marginTop: '-32px',
          left: '-8px',
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}>
        <IconChevron displayDirection="right" className="text-secondary-dark" />
      </div>
    </div>
  );
}

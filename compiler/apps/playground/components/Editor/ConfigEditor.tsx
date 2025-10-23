/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import MonacoEditor, {loader, type Monaco} from '@monaco-editor/react';
import type {editor} from 'monaco-editor';
import * as monaco from 'monaco-editor';
import React, {
  useState,
  useRef,
  unstable_ViewTransition as ViewTransition,
  unstable_addTransitionType as addTransitionType,
  startTransition,
  Activity,
} from 'react';
import {Resizable} from 're-resizable';
import {useStore, useStoreDispatch} from '../StoreContext';
import {monacoConfigOptions} from './monacoOptions';
import {IconChevron} from '../Icons/IconChevron';
import {CONFIG_PANEL_TRANSITION} from '../../lib/transitionTypes';

// @ts-expect-error - webpack asset/source loader handles .d.ts files as strings
import compilerTypeDefs from 'babel-plugin-react-compiler/dist/index.d.ts';

loader.config({monaco});

export default function ConfigEditor({
  formattedAppliedConfig,
}: {
  formattedAppliedConfig: string;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Activity mode={isExpanded ? 'visible' : 'hidden'}>
        <ExpandedEditor
          onToggle={() => {
            startTransition(() => {
              addTransitionType(CONFIG_PANEL_TRANSITION);
              setIsExpanded(false);
            });
          }}
          formattedAppliedConfig={formattedAppliedConfig}
        />
      </Activity>
      <Activity mode={isExpanded ? 'hidden' : 'visible'}>
        <CollapsedEditor
          onToggle={() => {
            startTransition(() => {
              addTransitionType(CONFIG_PANEL_TRANSITION);
              setIsExpanded(true);
            });
          }}
        />
      </Activity>
    </>
  );
}

function ExpandedEditor({
  onToggle,
  formattedAppliedConfig,
}: {
  onToggle: (expanded: boolean) => void;
  formattedAppliedConfig: string;
}): React.ReactElement {
  const store = useStore();
  const dispatchStore = useStoreDispatch();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange: (value: string | undefined) => void = (
    value: string | undefined,
  ) => {
    if (value === undefined) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      dispatchStore({
        type: 'updateConfig',
        payload: {
          config: value,
        },
      });
    }, 500); // 500ms debounce delay
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
  };

  return (
    <ViewTransition
      enter={{[CONFIG_PANEL_TRANSITION]: 'slide-in', default: 'none'}}
      exit={{[CONFIG_PANEL_TRANSITION]: 'slide-out', default: 'none'}}>
      <Resizable
        minWidth={300}
        maxWidth={600}
        defaultSize={{width: 350}}
        enable={{right: true, bottom: false}}>
        <div className="bg-blue-10 relative h-full flex flex-col !h-[calc(100vh_-_3.5rem)] border border-gray-300">
          <div
            className="absolute w-8 h-16 bg-blue-10 rounded-r-full flex items-center justify-center z-[2] cursor-pointer border border-l-0 border-gray-300"
            title="Minimize config editor"
            onClick={onToggle}
            style={{
              top: '50%',
              marginTop: '-32px',
              right: '-32px',
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}>
            <IconChevron displayDirection="left" className="text-blue-50" />
          </div>

          <div className="flex-1 flex flex-col m-2 mb-2">
            <div className="pb-2">
              <h2 className="inline-block text-blue-50 py-1.5 px-1.5 xs:px-3 sm:px-4 text-sm">
                Config Overrides
              </h2>
            </div>
            <div className="flex-1 border border-gray-300">
              <MonacoEditor
                path={'config.ts'}
                language={'typescript'}
                value={store.config}
                onMount={handleMount}
                onChange={handleChange}
                loading={''}
                className="monaco-editor-config"
                options={monacoConfigOptions}
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col m-2">
            <div className="pb-2">
              <h2 className="inline-block text-blue-50 py-1.5 px-1.5 xs:px-3 sm:px-4 text-sm">
                Applied Configs
              </h2>
            </div>
            <div className="flex-1 border border-gray-300">
              <MonacoEditor
                path={'applied-config.js'}
                language={'javascript'}
                value={formattedAppliedConfig}
                loading={''}
                className="monaco-editor-applied-config"
                options={{
                  ...monacoConfigOptions,
                  readOnly: true,
                }}
              />
            </div>
          </div>
        </div>
      </Resizable>
    </ViewTransition>
  );
}

function CollapsedEditor({
  onToggle,
}: {
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div
      className="w-4 !h-[calc(100vh_-_3.5rem)]"
      style={{position: 'relative'}}>
      <div
        className="absolute w-10 h-16 bg-blue-10 hover:translate-x-2 transition-transform rounded-r-full flex items-center justify-center z-[2] cursor-pointer border border-gray-300"
        title="Expand config editor"
        onClick={onToggle}
        style={{
          top: '50%',
          marginTop: '-32px',
          left: '-8px',
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        }}>
        <IconChevron displayDirection="right" className="text-blue-50" />
      </div>
    </div>
  );
}

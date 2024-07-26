/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Resizable} from 're-resizable';
import React, {useCallback} from 'react';

type TabsRecord = Map<string, React.ReactNode>;

export default function TabbedWindow(props: {
  defaultTab: string | null;
  tabs: TabsRecord;
  tabsOpen: Set<string>;
  setTabsOpen: (newTab: Set<string>) => void;
  changedPasses: Set<string>;
}): React.ReactElement {
  if (props.tabs.size === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{width: 'calc(100vw - 650px)'}}>
        No compiler output detected, see errors below
      </div>
    );
  }
  return (
    <div className="flex flex-row">
      {Array.from(props.tabs.keys()).map(name => {
        return (
          <TabbedWindowItem
            name={name}
            key={name}
            tabs={props.tabs}
            tabsOpen={props.tabsOpen}
            setTabsOpen={props.setTabsOpen}
            hasChanged={props.changedPasses.has(name)}
          />
        );
      })}
    </div>
  );
}

function TabbedWindowItem({
  name,
  tabs,
  tabsOpen,
  setTabsOpen,
  hasChanged,
}: {
  name: string;
  tabs: TabsRecord;
  tabsOpen: Set<string>;
  setTabsOpen: (newTab: Set<string>) => void;
  hasChanged: boolean;
}): React.ReactElement {
  const isShow = tabsOpen.has(name);

  const toggleTabs = useCallback(() => {
    const nextState = new Set(tabsOpen);
    if (nextState.has(name)) {
      nextState.delete(name);
    } else {
      nextState.add(name);
    }
    setTabsOpen(nextState);
  }, [tabsOpen, name, setTabsOpen]);

  return (
    <div key={name} className="flex flex-row">
      {isShow ? (
        <Resizable className="border-r" minWidth={550} enable={{right: true}}>
          <h2
            title="Minimize tab"
            aria-label="Minimize tab"
            onClick={toggleTabs}
            className={`p-4 duration-150 ease-in border-b cursor-pointer border-grey-200 ${
              hasChanged ? 'font-bold' : 'font-light'
            } text-secondary hover:text-link`}>
            - {name}
          </h2>
          {tabs.get(name) ?? <div>No output for {name}</div>}
        </Resizable>
      ) : (
        <div className="relative items-center h-full px-1 py-6 align-middle border-r border-grey-200">
          <button
            title={`Expand compiler tab: ${name}`}
            aria-label={`Expand compiler tab: ${name}`}
            style={{transform: 'rotate(90deg) translate(-50%)'}}
            onClick={toggleTabs}
            className={`flex-grow-0 w-5 transition-colors duration-150 ease-in ${
              hasChanged ? 'font-bold' : 'font-light'
            } text-secondary hover:text-link`}>
            {name}
          </button>
        </div>
      )}
    </div>
  );
}

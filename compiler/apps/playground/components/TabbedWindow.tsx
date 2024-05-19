/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Resizable } from "re-resizable";
import React, { useCallback } from "react";

type TabsRecord = Map<string, React.ReactNode>;

export default function TabbedWindow(props: {
  defaultTab: string | null;
  tabs: TabsRecord;
  tabsOpen: Set<string>;
  setTabsOpen: (newTab: Set<string>) => void;
}): React.ReactElement {
  if (props.tabs.size === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: "calc(100vw - 650px)" }}
      >
        No compiler output detected, see errors below
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row w-full">
      {Array.from(props.tabs.keys()).map((name) => {
        return (
          <TabbedWindowItem
            name={name}
            key={name}
            tabs={props.tabs}
            tabsOpen={props.tabsOpen}
            setTabsOpen={props.setTabsOpen}
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
}: {
  name: string;
  tabs: TabsRecord;
  tabsOpen: Set<string>;
  setTabsOpen: (newTab: Set<string>) => void;
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
    <div key={name} className="flex w-full">
      {isShow ? (
        <Resizable className="border-r" size={{
          width: '100%',
        }} minWidth={'320px'} enable={{ right: true }}>
          <h2
            title="Minimize tab"
            aria-label="Minimize tab"
            onClick={toggleTabs}
            className="p-4 duration-150 ease-in border-b cursor-pointer border-grey-200 font-medium text-secondary hover:text-link"
          >
            - {name}
          </h2>
          {tabs.get(name) ?? <div>No output for {name}</div>}
        </Resizable>
      ) : (
        <div className="items-center w-full sm:h-full p-2 sm:px-1 sm:py-6 border-b sm:border-b-0 sm:border-r border-grey-200">
          <button
            title={`Expand compiler tab: ${name}`}
            aria-label={`Expand compiler tab: ${name}`}
            // style={{ transform: "rotate(90deg) translate(-50%)" }}
            onClick={toggleTabs}
            className=" sm:w-5 transition-colors duration-150 ease-in font-medium text-secondary hover:text-link sm:rotate-90 sm:-translate-1/2 text-sm sm:text-base"
          >
            {name}
          </button>
        </div>
      )}
    </div>
  );
}

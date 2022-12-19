/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useCallback } from "react";

export type TabTypes =
  | "HIR"
  | "SSA"
  | "EliminateRedundantPhi"
  | "InferReferenceEffects"
  | "InferMutableRanges"
  | "InferReactiveScopeVariables"
  | "InferReactiveScopes"
  | "ReactiveFunctions"
  | "LeaveSSA"
  | "JS"
  | "SourceMap";

type TabsRecord = Record<TabTypes, React.ReactNode>;

export default function TabbedWindow(props: {
  defaultTab: string | null;
  tabs: TabsRecord;
  tabsOpen: Map<TabTypes, boolean>;
  setTabsOpen: (newTab: Map<TabTypes, boolean>) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-row h-full">
      {Object.keys(props.tabs).map((name, index, all) => {
        return (
          <TabbedWindowItem
            name={name as TabTypes}
            key={index}
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
  name: TabTypes;
  tabs: TabsRecord;
  tabsOpen: Map<TabTypes, boolean>;
  setTabsOpen: (newTab: Map<TabTypes, boolean>) => void;
}): React.ReactElement {
  const isShow = tabsOpen.get(name) ?? false;

  const toggleTabs = useCallback(() => {
    const nextState = new Map(tabsOpen);
    nextState.set(name, !isShow);
    setTabsOpen(nextState);
  }, [tabsOpen, name, isShow, setTabsOpen]);

  return (
    <div key={name} className="flex flex-row">
      {isShow ? (
        <div style={{ minWidth: 550 }}>
          <h2
            onClick={toggleTabs}
            className="p-4 duration-150 ease-in border-b cursor-pointer border-grey-200 text-secondary hover:text-link"
          >
            - {name}
          </h2>
          {tabs[name]}
        </div>
      ) : (
        <div className="relative items-center h-full px-4 py-8 align-middle border-r border-grey-200">
          <button
            style={{ transform: "rotate(90deg) translate(-50%)" }}
            onClick={toggleTabs}
            className="flex-grow-0 w-5 transition-colors duration-150 ease-in text-secondary hover:text-link"
          >
            {`+${name}`}
          </button>
        </div>
      )}
    </div>
  );
}

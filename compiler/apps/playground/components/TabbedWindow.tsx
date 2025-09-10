/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import clsx from 'clsx';

export default function TabbedWindow({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Map<string, React.ReactNode>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}): React.ReactElement {
  if (tabs.size === 0) {
    return (
      <div className="flex items-center justify-center flex-1 max-w-full">
        No compiler output detected, see errors below
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full max-w-full">
      <div className="flex p-2 flex-shrink-0">
        {Array.from(tabs.keys()).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={clsx(
                'active:scale-95 transition-transform text-center outline-none py-1.5 px-1.5 xs:px-3 sm:px-4 rounded-full capitalize whitespace-nowrap text-sm',
                !isActive && 'hover:bg-primary/5',
                isActive && 'bg-highlight text-link',
              )}>
              {tab}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden w-full h-full">
        {tabs.get(activeTab)}
      </div>
    </div>
  );
}

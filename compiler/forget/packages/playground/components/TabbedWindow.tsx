/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import clsx from "clsx";
import React, { useState } from "react";

export default function TabbedWindow(props: {
  defaultTab: string | null;
  tabs: { [name: string]: React.ReactNode };
}): React.ReactElement {
  let [selected, setSelected] = useState<string | null>(props.defaultTab);
  if (selected === null) {
    selected = Object.keys(props.tabs)[0];
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-none overflow-x-auto border-b border-gray-200 h-9 no-scrollbar">
        {Object.keys(props.tabs).map((name, index, all) => {
          const isFirst = index === 0;
          const isSelected = name === selected;
          return (
            <React.Fragment key={name}>
              {isFirst ? null : (
                <div className="w-[1px] h-[18px] self-center border-gray-200 border-l mx-1" />
              )}
              <div
                className={clsx(
                  "h-full border-b-2 border-white px-4 py-0.5 flex items-center",
                  {
                    "border-link": isSelected,
                  }
                )}
              >
                <button
                  disabled={isSelected}
                  onClick={() => setSelected(name)}
                  className="transition-colors duration-150 ease-in"
                >
                  {name}
                </button>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {props.tabs[selected]}
    </div>
  );
}

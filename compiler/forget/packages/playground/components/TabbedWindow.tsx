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
  return (
    <div className="flex flex-row h-full">
      {Object.keys(props.tabs).map((name, index, all) => {
        return <TabbedWindowItem name={name} key={index} tabs={props.tabs} />;
      })}
    </div>
  );
}

function TabbedWindowItem({
  name,
  tabs,
}: {
  name: string;
  tabs: { [name: string]: React.ReactNode };
}): React.ReactElement {
  const [isShow, setIsShow] = useState<boolean>(false);

  return (
    <div key={name} className="flex flex-row">
      {isShow ? (
        <div style={{ minWidth: 500 }}>
          <h2
            onClick={() => setIsShow(!isShow)}
            className="p-4 border-b cursor-pointer border-grey-200"
          >
            - {name}
          </h2>
          {tabs[name]}
        </div>
      ) : (
        <div className="relative items-center h-full px-4 py-8 align-middle border-r border-grey-200">
          <button
            style={{ transform: "rotate(90deg) translate(-50%)" }}
            onClick={() => setIsShow(!isShow)}
            className="flex-grow-0 w-5 transition-colors duration-150 ease-in"
          >
            {`+${name}`}
          </button>
        </div>
      )}
    </div>
  );
}

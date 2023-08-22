/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from "react";
import "./styles.css";
import * as Feed from "./Feed";
import * as FeedMemoized from "./FeedMemoized";
import * as FeedForget from "./Feed.forget.js";

const mockServer = {
  usePaginatedData() {
    let [data, setData] = useState([]);

    const loadNext = (num) => {
      let newData = new Array(num)
        .fill(0)
        .map((_, idx) => ({ value: data.length + idx }));

      setData([...data, ...newData]);
    };

    return { data, loadNext };
  },
};

export default function Demo1() {
  let [text, setText] = useState("");
  let { data, loadNext } = mockServer.usePaginatedData();

  return (
    <div className="App">
      <h2>Demo1 - Feeds</h2>
      <header className="Header row">
        <div className="Icon">⚛️</div>
        {/* TODO: no need to memo for host component? */}
        <input
          className="Search"
          placeholder="Search"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="Load" onClick={(e) => loadNext(1)}>
          🎲
        </button>
      </header>

      <div className="Feeds row">
        <div className="column">
          <Feed.Feed items={data} />
        </div>
        <div className="column">
          <FeedMemoized.Feed items={data} />
        </div>
        <div className="column">
          <FeedForget.Feed items={data} />
        </div>
      </div>
    </div>
  );
}

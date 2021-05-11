import { useMemoCache } from "./useMemoCache"; 
import React, { useState } from "react";
import "./styles.css";
import * as Feed from "./Feed";
import * as FeedMemoized from "./FeedMemoized";
import * as FeedForget from "./Feed.forget.js";
const mockServer = {
  usePaginatedData() {
    let $ = useMemoCache(3);
    let [data, setData] = useState([]);
    let c_data = $[1] !== data;
    if (c_data) $[1] = data;
    const loadNext = c_data ? $[2] = num => {
      let newData = new Array(num).fill(0).map((_, idx) => ({
        value: data.length + idx
      }));
      setData([...data, ...newData]);
    } : $[2];
    return {
      data,
      loadNext
    };
  }

};
export default function Demo1() {
  let $ = useMemoCache(17);
  let [text, setText] = useState("");
  let c_text = $[1] !== text;
  if (c_text) $[1] = text;
  let {
    data,
    loadNext
  } = mockServer.usePaginatedData();
  let c_loadNext = $[3] !== loadNext;
  if (c_loadNext) $[3] = loadNext;
  let c_data = $[2] !== data;
  if (c_data) $[2] = data;
  return c_text || c_loadNext || c_data ? $[16] = <div className="App">
      <h2>Demo1 - Feeds</h2>
      {c_text || c_loadNext ? $[8] = <header className="Header row">
        <div className="Icon">⚛️</div>
        {
        /* TODO: no need to memo for host component? */
      }
        {c_text ? $[5] = <input className="Search" placeholder="Search" value={text} onChange={$[4] || ($[4] = e => setText(e.target.value))} /> : $[5]}
        {c_loadNext ? $[7] = <button className="Load" onClick={c_loadNext ? $[6] = e => loadNext(1) : $[6]}>
          🎲
        </button> : $[7]}
      </header> : $[8]}

      {c_data ? $[15] = <div className="Feeds row">
        {c_data ? $[10] = <div className="column">
          {c_data ? $[9] = <Feed.Feed items={data} /> : $[9]}
        </div> : $[10]}
        {c_data ? $[12] = <div className="column">
          {c_data ? $[11] = <FeedMemoized.Feed items={data} /> : $[11]}
        </div> : $[12]}
        {c_data ? $[14] = <div className="column">
          {c_data ? $[13] = <FeedForget.Feed items={data} /> : $[13]}
        </div> : $[14]}
      </div> : $[15]}
    </div> : $[16];
}

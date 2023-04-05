/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache"; 
import React, { useRef } from "react";

function FeedItem(props) {
  let $ = useMemoCache(2);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_data = c_props && prevProps.data !== props.data;
  let c_onClick = c_props && prevProps.onClick !== props.onClick;
  const rerenderCount = useRef(0);
  return c_data || c_onClick ? $[1] = <a href={`./item/${props.data.value}`} className="FeedItem" onClick={props.onClick}>
      {rerenderCount.current++}
    </a> : $[1];
}

export function Feed(props) {
  let $ = useMemoCache(3);
  let prevProps = $[0];
  let c_props = !prevProps || prevProps !== props;
  if (c_props) $[0] = props;
  let c_items = c_props && prevProps.items !== props.items;
  const rerenderCount = useRef(0);

  const onClick = $[1] || ($[1] = e => {
    e.preventDefault();
    alert(e.target.href);
  });

  return c_items ? $[2] = <div className="Feed">
      <h3>{rerenderCount.current++}</h3>
      {props.items.map((item, index) => <FeedItem key={index} data={item} onClick={onClick} />)}
    </div> : $[2];
}

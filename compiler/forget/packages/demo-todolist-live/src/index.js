/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import "./normalize.css";
import "./styles.css";

// import BlazingTodoList from "./source/BlazingTodoList";
import BlazingTodoList from "./compiled/BlazingTodoList";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <BlazingTodoList />
  </StrictMode>,
  rootElement
);

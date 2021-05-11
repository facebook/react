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

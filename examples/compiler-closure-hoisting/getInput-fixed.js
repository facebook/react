// getInput-fixed.js

import React from "react";

export function getInput(a) {
  return function Wrapper() {
    return <input onChange={() => a.onChange()} />;
  };
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function Select({ value, options, onChange }) {
  return (
    <div className="Select">
      {options.map(o => {
        if (value === o.value) {
          return (
            <button key={o.value} className="selected">
              {" "}
              {o.label}{" "}
            </button>
          );
        } else {
          return (
            <button key={o.value} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          );
        }
      })}
    </div>
  );
}

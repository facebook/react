/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function ColorPicker({ value, onChange }) {
  return (
    <input
      className="ColorPicker"
      type="color"
      id="head"
      name="head"
      value={value}
      onChange={onChange}
    />
  );
}

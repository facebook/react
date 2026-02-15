/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

/**
 * A `<select>` element enhanced with WebMCP declarative attributes.
 *
 * Use inside a `<WebMCPForm>` to annotate select inputs for AI agents.
 * The `<option>` values and text are automatically mapped to the tool's
 * JSON Schema `enum` / `oneOf` definitions by the browser.
 */
export function WebMCPSelect({
  toolParamTitle,
  toolParamDescription,
  children,
  ...rest
}: {
  toolParamTitle?: string,
  toolParamDescription?: string,
  children: React$Node,
  ...
}): React$Node {
  const props: {[string]: mixed} = {...rest};
  if (toolParamTitle) {
    props.toolparamtitle = toolParamTitle;
  }
  if (toolParamDescription) {
    props.toolparamdescription = toolParamDescription;
  }

  return React.createElement('select', props, children);
}

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
 * A `<textarea>` element enhanced with WebMCP declarative attributes.
 *
 * Use inside a `<WebMCPForm>` to annotate textarea inputs for AI agents.
 */
export function WebMCPTextarea({
  toolParamTitle,
  toolParamDescription,
  ...rest
}: {
  toolParamTitle?: string,
  toolParamDescription?: string,
  ...
}): React$Node {
  const props: {[string]: mixed} = {...rest};
  if (toolParamTitle) {
    props.toolparamtitle = toolParamTitle;
  }
  if (toolParamDescription) {
    props.toolparamdescription = toolParamDescription;
  }

  return React.createElement('textarea', props);
}

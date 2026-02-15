/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const {useCallback, useEffect, useRef} = React;

type WebMCPFormProps = {
  toolName: string,
  toolDescription: string,
  toolAutoSubmit?: boolean,
  onSubmit?: (event: any) => void,
  onToolActivated?: (toolName: string) => void,
  onToolCancel?: (toolName: string) => void,
  children: React$Node,
  className?: string,
  id?: string,
  noValidate?: boolean,
  action?: string,
  method?: string,
};

/**
 * A React wrapper for the WebMCP declarative API.
 *
 * Renders a `<form>` element with the appropriate WebMCP HTML attributes
 * (`toolname`, `tooldescription`, `toolautosubmit`) so the browser
 * automatically registers it as a WebMCP tool.
 */
export function WebMCPForm(props: WebMCPFormProps): React$Node {
  const {
    toolName,
    toolDescription,
    toolAutoSubmit,
    onSubmit,
    onToolActivated,
    onToolCancel,
    children,
    className,
    id,
    noValidate,
    action,
    method,
  } = props;
  const formRef = useRef<HTMLFormElement | null>(null);

  // Listen for toolactivated and toolcancel events
  useEffect(() => {
    const handleActivated = (e: Event) => {
      const detail = (e: any).detail;
      const name =
        (e: any).toolName != null
          ? (e: any).toolName
          : detail != null
            ? detail.toolName
            : null;
      if (name != null && name === toolName && onToolActivated) {
        onToolActivated(name);
      }
    };

    const handleCancel = (e: Event) => {
      const cancelDetail = (e: any).detail;
      const name =
        (e: any).toolName != null
          ? (e: any).toolName
          : cancelDetail != null
            ? cancelDetail.toolName
            : null;
      if (name != null && name === toolName && onToolCancel) {
        onToolCancel(name);
      }
    };

    window.addEventListener('toolactivated', handleActivated);
    window.addEventListener('toolcancel', handleCancel);

    return () => {
      window.removeEventListener('toolactivated', handleActivated);
      window.removeEventListener('toolcancel', handleCancel);
    };
  }, [toolName, onToolActivated, onToolCancel]);

  const handleSubmit = useCallback(
    (e: any) => {
      if (onSubmit) {
        // Pass the native event which has agentInvoked and respondWith
        onSubmit(e.nativeEvent);
      }
    },
    [onSubmit],
  );

  // Build the form element props including WebMCP HTML attributes
  const formProps: {[string]: mixed} = {
    ref: formRef,
    onSubmit: handleSubmit,
    toolname: toolName,
    tooldescription: toolDescription,
  };
  if (toolAutoSubmit) {
    formProps.toolautosubmit = '';
  }
  if (className != null) {
    formProps.className = className;
  }
  if (id != null) {
    formProps.id = id;
  }
  if (noValidate != null) {
    formProps.noValidate = noValidate;
  }
  if (action != null) {
    formProps.action = action;
  }
  if (method != null) {
    formProps.method = method;
  }

  return React.createElement('form', formProps, children);
}

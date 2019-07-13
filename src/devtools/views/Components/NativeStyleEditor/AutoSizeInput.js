// @flow

import React, { Fragment, useLayoutEffect, useRef } from 'react';
import styles from './AutoSizeInput.css';

type Props = {
  className?: string,
  onFocus?: (event: FocusEvent) => void,
  placeholder?: string,
  value: any,
};

export default function AutoSizeInput({
  className,
  onFocus,
  placeholder,
  value,
  ...rest
}: Props) {
  const hiddenDivRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFocusWrapper = event => {
    if (inputRef.current !== null) {
      inputRef.current.selectionStart = 0;
      inputRef.current.selectionEnd = value.length;
    }

    if (typeof onFocus === 'function') {
      onFocus(event);
    }
  };

  // Copy text stlyes from <input> to hidden sizing <div>
  useLayoutEffect(() => {
    if (
      typeof window.getComputedStyle !== 'function' ||
      inputRef.current === null
    ) {
      return;
    }

    const inputStyle = window.getComputedStyle(inputRef.current);
    if (!inputStyle) {
      return;
    }

    if (hiddenDivRef.current !== null) {
      const divStyle = hiddenDivRef.current.style;
      divStyle.border = inputStyle.border;
      divStyle.fontFamily = inputStyle.fontFamily;
      divStyle.fontSize = inputStyle.fontSize;
      divStyle.fontStyle = inputStyle.fontStyle;
      divStyle.fontWeight = inputStyle.fontWeight;
      divStyle.letterSpacing = inputStyle.letterSpacing;
      divStyle.padding = inputStyle.padding;
    }
  }, []);

  // Resize input any time text changes
  useLayoutEffect(() => {
    if (hiddenDivRef.current === null) {
      return;
    }

    const scrollWidth = hiddenDivRef.current.getBoundingClientRect().width;
    if (!scrollWidth) {
      return;
    }

    if (inputRef.current !== null) {
      inputRef.current.style.width = `${scrollWidth}px`;
    }
  }, [value]);

  const isEmpty = value === '' || value === '""';

  return (
    <Fragment>
      <input
        ref={inputRef}
        className={`${className ? className : ''} ${styles.Input}`}
        onFocus={onFocusWrapper}
        placeholder={placeholder}
        value={isEmpty ? '' : value}
        {...rest}
      />
      <div ref={hiddenDivRef} className={styles.HiddenDiv}>
        {isEmpty ? placeholder : value}
      </div>
    </Fragment>
  );
}

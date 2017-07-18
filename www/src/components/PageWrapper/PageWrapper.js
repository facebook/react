import cn from 'classnames';
import React from 'react';
import styles from './PageWrapper.module.scss';

const PageWrapper = ({children, enablePadding, enablePaddingBottom, enablePaddingTop}) => (
  <div className={cn(styles.PageWrapper, {
    [styles.WithPaddingBottom]: enablePadding || enablePaddingBottom,
    [styles.WithPaddingTop]: enablePadding || enablePaddingTop,
  })}>
    {children}
  </div>
);

export default PageWrapper;

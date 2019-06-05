// @flow

import createListComponent from './createListComponent';

import type { Props, ScrollToAlign } from './createListComponent';

const FixedSizeList = createListComponent({
  getItemOffset: ({ itemSize, size }: Props<any>, index: number): number =>
    index * ((itemSize: any): number),

  getItemSize: ({ itemSize, size }: Props<any>, index: number): number =>
    ((itemSize: any): number),

  getEstimatedTotalSize: ({ itemCount, itemSize }: Props<any>) =>
    ((itemSize: any): number) * itemCount,

  getOffsetForIndexAndAlignment: (
    { direction, height, itemCount, itemSize, layout, width }: Props<any>,
    index: number,
    align: ScrollToAlign,
    scrollOffset: number
  ): number => {
    // TODO Deprecate direction "horizontal"
    const isHorizontal = direction === 'horizontal' || layout === 'horizontal';
    const size = (((isHorizontal ? width : height): any): number);
    const maxOffset = Math.max(
      0,
      Math.min(
        itemCount * ((itemSize: any): number) - size,
        index * ((itemSize: any): number)
      )
    );
    const minOffset = Math.max(
      0,
      index * ((itemSize: any): number) - size + ((itemSize: any): number)
    );

    if (align === 'smart') {
      if (
        scrollOffset >= minOffset - size &&
        scrollOffset <= maxOffset + size
      ) {
        align = 'auto';
      } else {
        align = 'center';
      }
    }

    switch (align) {
      case 'start':
        return maxOffset;
      case 'end':
        return minOffset;
      case 'center':
        return Math.round(minOffset + (maxOffset - minOffset) / 2);
      case 'auto':
      default:
        if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
          return scrollOffset;
        } else if (scrollOffset - minOffset < maxOffset - scrollOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },

  getStartIndexForOffset: (
    { itemCount, itemSize }: Props<any>,
    offset: number
  ): number =>
    Math.max(
      0,
      Math.min(itemCount - 1, Math.floor(offset / ((itemSize: any): number)))
    ),

  getStopIndexForStartIndex: (
    { direction, height, itemCount, itemSize, layout, width }: Props<any>,
    startIndex: number,
    scrollOffset: number
  ): number => {
    // TODO Deprecate direction "horizontal"
    const isHorizontal = direction === 'horizontal' || layout === 'horizontal';
    const offset = startIndex * ((itemSize: any): number);
    const size = (((isHorizontal ? width : height): any): number);
    return Math.max(
      0,
      Math.min(
        itemCount - 1,
        startIndex +
          Math.floor(
            (size + (scrollOffset - offset)) / ((itemSize: any): number)
          )
      )
    );
  },

  initInstanceProps(props: Props<any>): any {
    // Noop
  },

  shouldResetStyleCacheOnItemSizeChange: true,

  validateProps: ({ itemSize }: Props<any>): void => {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof itemSize !== 'number') {
        throw Error(
          'An invalid "itemSize" prop has been specified. ' +
            'Value should be a number. ' +
            `"${itemSize === null ? 'null' : typeof itemSize}" was specified.`
        );
      }
    }
  },
});

export default FixedSizeList;

// @flow

import createGridComponent from './createGridComponent';

import type { Props, ScrollToAlign } from './createGridComponent';

const FixedSizeGrid = createGridComponent({
  getColumnOffset: ({ columnWidth }: Props<any>, index: number): number =>
    index * ((columnWidth: any): number),

  getColumnWidth: ({ columnWidth }: Props<any>, index: number): number =>
    ((columnWidth: any): number),

  getRowOffset: ({ rowHeight }: Props<any>, index: number): number =>
    index * ((rowHeight: any): number),

  getRowHeight: ({ rowHeight }: Props<any>, index: number): number =>
    ((rowHeight: any): number),

  getEstimatedTotalHeight: ({ rowCount, rowHeight }: Props<any>) =>
    ((rowHeight: any): number) * rowCount,

  getEstimatedTotalWidth: ({ columnCount, columnWidth }: Props<any>) =>
    ((columnWidth: any): number) * columnCount,

  getOffsetForColumnAndAlignment: (
    { columnCount, columnWidth, width }: Props<any>,
    columnIndex: number,
    align: ScrollToAlign,
    scrollLeft: number,
    instanceProps: typeof undefined,
    scrollbarSize: number
  ): number => {
    const lastColumnOffset = Math.max(
      0,
      columnCount * ((columnWidth: any): number) - width
    );
    const maxOffset = Math.min(
      lastColumnOffset,
      columnIndex * ((columnWidth: any): number)
    );
    const minOffset = Math.max(
      0,
      columnIndex * ((columnWidth: any): number) -
        width +
        scrollbarSize +
        ((columnWidth: any): number)
    );

    if (align === 'smart') {
      if (scrollLeft >= minOffset - width && scrollLeft <= maxOffset + width) {
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
        // "Centered" offset is usually the average of the min and max.
        // But near the edges of the list, this doesn't hold true.
        const middleOffset = Math.round(
          minOffset + (maxOffset - minOffset) / 2
        );
        if (middleOffset < Math.ceil(width / 2)) {
          return 0; // near the beginning
        } else if (middleOffset > lastColumnOffset + Math.floor(width / 2)) {
          return lastColumnOffset; // near the end
        } else {
          return middleOffset;
        }
      case 'auto':
      default:
        if (scrollLeft >= minOffset && scrollLeft <= maxOffset) {
          return scrollLeft;
        } else if (minOffset > maxOffset) {
          // Because we only take into account the scrollbar size when calculating minOffset
          // this value can be larger than maxOffset when at the end of the list
          return minOffset;
        } else if (scrollLeft < minOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },

  getOffsetForRowAndAlignment: (
    { rowHeight, height, rowCount }: Props<any>,
    rowIndex: number,
    align: ScrollToAlign,
    scrollTop: number,
    instanceProps: typeof undefined,
    scrollbarSize: number
  ): number => {
    const lastRowOffset = Math.max(
      0,
      rowCount * ((rowHeight: any): number) - height
    );
    const maxOffset = Math.min(
      lastRowOffset,
      rowIndex * ((rowHeight: any): number)
    );
    const minOffset = Math.max(
      0,
      rowIndex * ((rowHeight: any): number) -
        height +
        scrollbarSize +
        ((rowHeight: any): number)
    );

    if (align === 'smart') {
      if (scrollTop >= minOffset - height && scrollTop <= maxOffset + height) {
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
        // "Centered" offset is usually the average of the min and max.
        // But near the edges of the list, this doesn't hold true.
        const middleOffset = Math.round(
          minOffset + (maxOffset - minOffset) / 2
        );
        if (middleOffset < Math.ceil(height / 2)) {
          return 0; // near the beginning
        } else if (middleOffset > lastRowOffset + Math.floor(height / 2)) {
          return lastRowOffset; // near the end
        } else {
          return middleOffset;
        }
      case 'auto':
      default:
        if (scrollTop >= minOffset && scrollTop <= maxOffset) {
          return scrollTop;
        } else if (minOffset > maxOffset) {
          // Because we only take into account the scrollbar size when calculating minOffset
          // this value can be larger than maxOffset when at the end of the list
          return minOffset;
        } else if (scrollTop < minOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },

  getColumnStartIndexForOffset: (
    { columnWidth, columnCount }: Props<any>,
    scrollLeft: number
  ): number =>
    Math.max(
      0,
      Math.min(
        columnCount - 1,
        Math.floor(scrollLeft / ((columnWidth: any): number))
      )
    ),

  getColumnStopIndexForStartIndex: (
    { columnWidth, columnCount, width }: Props<any>,
    startIndex: number,
    scrollLeft: number
  ): number => {
    const left = startIndex * ((columnWidth: any): number);
    const numVisibleColumns = Math.ceil(
      (width + scrollLeft - left) / ((columnWidth: any): number)
    );
    return Math.max(
      0,
      Math.min(
        columnCount - 1,
        startIndex + numVisibleColumns - 1 // -1 is because stop index is inclusive
      )
    );
  },

  getRowStartIndexForOffset: (
    { rowHeight, rowCount }: Props<any>,
    scrollTop: number
  ): number =>
    Math.max(
      0,
      Math.min(rowCount - 1, Math.floor(scrollTop / ((rowHeight: any): number)))
    ),

  getRowStopIndexForStartIndex: (
    { rowHeight, rowCount, height }: Props<any>,
    startIndex: number,
    scrollTop: number
  ): number => {
    const top = startIndex * ((rowHeight: any): number);
    const numVisibleRows = Math.ceil(
      (height + scrollTop - top) / ((rowHeight: any): number)
    );
    return Math.max(
      0,
      Math.min(
        rowCount - 1,
        startIndex + numVisibleRows - 1 // -1 is because stop index is inclusive
      )
    );
  },

  initInstanceProps(props: Props<any>): any {
    // Noop
  },

  shouldResetStyleCacheOnItemSizeChange: true,

  validateProps: ({ columnWidth, rowHeight }: Props<any>): void => {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof columnWidth !== 'number') {
        throw Error(
          'An invalid "columnWidth" prop has been specified. ' +
            'Value should be a number. ' +
            `"${
              columnWidth === null ? 'null' : typeof columnWidth
            }" was specified.`
        );
      }

      if (typeof rowHeight !== 'number') {
        throw Error(
          'An invalid "rowHeight" prop has been specified. ' +
            'Value should be a number. ' +
            `"${rowHeight === null ? 'null' : typeof rowHeight}" was specified.`
        );
      }
    }
  },
});

export default FixedSizeGrid;

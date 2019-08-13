// @flow

import type {
  Layout as LayoutBackend,
  Style as StyleBackend,
} from 'react-devtools-shared/src/backend/NativeStyleEditor/types';

export type Layout = LayoutBackend;
export type Style = StyleBackend;
export type StyleAndLayout = {|
  layout: LayoutBackend | null,
  style: StyleBackend | null,
|};

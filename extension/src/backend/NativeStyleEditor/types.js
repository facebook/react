// @flow

export type BoxStyle = $ReadOnly<{|
  bottom: number,
  left: number,
  right: number,
  top: number,
|}>;

export type Layout = {|
  x: number,
  y: number,
  width: number,
  height: number,
  left: number,
  top: number,
  margin: BoxStyle,
  padding: BoxStyle,
|};

export type Style = Object;

export type StyleAndLayout = {|
  id: number,
  style: Style | null,
  layout: Layout | null,
|};

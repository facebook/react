// @flow @gating
import { memo } from "react";

// TODO: this appears as a hoisted reference to Component, but it's a type not runtime reference!
type Props = React.ElementConfig<typeof Component>;

component Component(value: string) {
  return <div>{value}</div>;
}

export default memo<Props>(Component);

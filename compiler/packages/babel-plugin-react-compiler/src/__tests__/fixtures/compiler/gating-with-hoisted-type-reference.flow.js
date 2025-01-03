// @flow @gating
import {memo} from 'react';

type Props = React.ElementConfig<typeof Component>;

component Component(value: string) {
  return <div>{value}</div>;
}

export default memo<Props>(Component);

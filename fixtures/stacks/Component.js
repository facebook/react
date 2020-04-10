// Example

const Throw = React.lazy(() => {
  throw new Error('Example');
});

const Component = React.memo(function Component({children}) {
  return children;
});

function DisplayName({children}) {
  return children;
}
DisplayName.displayName = 'Custom Name';

class NativeClass extends React.Component {
  render() {
    return this.props.children;
  }
}

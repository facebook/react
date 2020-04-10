// Compile this with Babel.
// babel --config-file ./babel.config.json BabelClass.js --out-file BabelClass-compiled.js --source-maps

class BabelClass extends React.Component {
  render() {
    return this.props.children;
  }
}

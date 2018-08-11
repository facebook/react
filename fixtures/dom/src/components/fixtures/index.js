const React = window.React;
const fixturePath = window.location.pathname;

/**
 * A simple routing component that renders the appropriate
 * fixture based on the location pathname.
 */
class FixturesPage extends React.Component {
  static defaultProps = {
    fixturePath: fixturePath === '/' ? '/home' : fixturePath,
  };

  state = {
    isLoading: true,
    error: null,
    Fixture: null,
  };

  componentDidMount() {
    this.loadFixture();
  }

  async loadFixture() {
    const {fixturePath} = this.props;

    try {
      let module = await import(`.${fixturePath}`);

      this.setState({Fixture: module.default});
    } catch (error) {
      console.error(error);
      this.setState({error});
    } finally {
      this.setState({isLoading: false});
    }
  }

  render() {
    const {fixturePath} = this.props;
    const {Fixture, error, isLoading} = this.state;

    if (isLoading) {
      return <p>Awaiting fixture...</p>;
    }

    if (error) {
      return <p>Fixture at path {fixturePath} could not be loaded.</p>;
    }

    return <Fixture />;
  }
}

export default FixturesPage;

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
      const module = await import(`.${fixturePath}`);

      this.setState({Fixture: module.default});
    } catch (error) {
      console.error(error);
      this.setState({error});
    } finally {
      this.setState({isLoading: false});
    }
  }

  render() {
    const {Fixture, error, isLoading} = this.state;

    if (isLoading) {
      return null;
    }

    if (error) {
      return <FixtureError error={error} />;
    }

    return <Fixture />;
  }
}

function FixtureError({error}) {
  return (
    <section>
      <h2>Error loading fixture</h2>
      <p>{error.message}</p>
    </section>
  );
}

export default FixturesPage;

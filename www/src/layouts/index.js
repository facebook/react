import {Component} from 'react';
import docsearch from 'docsearch.js';
import Flex from 'components/Flex';
import Footer from './components/Footer';
import Header from './components/Header';
import {media} from 'theme';

// TODO Comment
import 'glamor/reset';
import 'css/reset.css';
import 'css/algolia.css';
import 'css/prism.css';

class Template extends Component {
  componentDidMount() {
    // Initialize Algolia search.
    // TODO Is this expensive? Should it be deferred until a user is about to search?
    docsearch({
      apiKey: '36221914cce388c46d0420343e0bb32e',
      indexName: 'react',
      inputSelector: '#algolia-doc-search',
    });
  }

  render() {
    const {children, location} = this.props;

    return (
      <div
        css={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}>
        <Header location={location} />
        <Flex
          direction="column"
          shrink="0"
          grow="1"
          valign="stretch"
          css={{
            flex: '1 0 auto',
            marginTop: 60,
            [media.mediumToLarge]: {
              marginTop: 50,
            },
            [media.smallDown]: {
              marginTop: 40,
            },
          }}>
          {children()}
        </Flex>
        <Footer />
      </div>
    );
  }
}

export default Template;

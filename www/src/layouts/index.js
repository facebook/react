/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Flex from 'components/Flex';
import Footer from 'components/LayoutFooter';
import Header from 'components/LayoutHeader';
import {media} from 'theme';

// Import global styles
import '../prism-styles';
import 'glamor/reset';
import 'css/reset.css';
import 'css/algolia.css';

class Template extends Component {
  constructor(props) {
    super(props);
    this.handleMenuOverlayToggle = this.handleMenuOverlayToggle.bind(this);
    this.state = {
      showHeaderAndFooter: true,
    };
  }

  getChildContext() {
    return {
      onMenuOverlayToggle: this.handleMenuOverlayToggle,
    };
  }

  componentDidMount() {
    // Initialize Algolia search.
    // TODO Is this expensive? Should it be deferred until a user is about to search?
    // eslint-disable-next-line no-undef
    docsearch({
      apiKey: '36221914cce388c46d0420343e0bb32e',
      indexName: 'react',
      inputSelector: '#algolia-doc-search',
    });
  }

  handleMenuOverlayToggle(isOpen) {
    this.setState({
      showHeaderAndFooter: !isOpen,
    });
  }

  render() {
    const {children, location} = this.props;

    // TODO - is there a better way to check if we need we have a sidebar?
    let layoutHasSidebar = false;
    if (location.pathname.match(/^\/(docs|tutorial|community|blog)/)) {
      layoutHasSidebar = true;
    }

    return (
      <div
        css={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 40px)',
        }}>
        <Header
          location={location}
          isVisible={this.state.showHeaderAndFooter}
        />
        <Flex
          direction="column"
          shrink="0"
          grow="1"
          valign="stretch"
          css={{
            flex: '1 0 auto',
            marginTop: 60,
            [media.between('medium', 'large')]: {
              marginTop: 50,
            },
            [media.lessThan('medium')]: {
              marginTop: 40,
            },
          }}>
          {children()}
        </Flex>
        <Footer
          layoutHasSidebar={layoutHasSidebar}
          isVisible={this.state.showHeaderAndFooter}
        />
      </div>
    );
  }
}

Template.childContextTypes = {
  onMenuOverlayToggle: PropTypes.func,
};

export default Template;

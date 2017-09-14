/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import Container from 'components/Container';
import {Component, React} from 'react';
import {Sticky} from 'react-sticky';
import Sidebar from 'templates/components/Sidebar';
import {colors, media} from 'theme';

class StickyResponsiveSidebar extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      activeSection: props.defaultActiveSection,
      open: false,
    };
    this.toggleOpen = this._toggleOpen.bind(this);
  }

  _toggleOpen() {
    this.setState({open: !this.state.open});
  }

  render() {
    const {defaultActiveSection} = this.props;
    const smallScreenSidebarStyles = {
      // TODO: animate height instead of using display: none?
      // Changing height may be better a11y too
      display: this.state.open ? 'block' : 'none',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      position: 'fixed',
      backgroundColor: colors.white,
    };

    const smallScreenBottomBarStyles = {
      display: 'block',
    };

    // TODO: use the location to find the active section item and use it's title
    // instead
    const activeSectionItemTitle = defaultActiveSection.title;

    const bottomBarText = this.state.open ? 'Close' : activeSectionItemTitle;

    return (
      <div>
        <Sticky>
          {({style}) => {
            return (
              <div
                css={{
                  [media.lessThan('small')]: smallScreenSidebarStyles,
                  [media.greaterThan('small')]: style,
                }}>
                <div
                  css={{
                    marginTop: 60,

                    [media.lessThan('small')]: {
                      marginTop: 40,
                    },

                    [media.between('medium', 'large')]: {
                      marginTop: 50,
                    },
                  }}>
                  <Sidebar {...this.props} />
                </div>
              </div>
            );
          }}
        </Sticky>
        <div
          css={{
            backgroundColor: colors.darker,
            bottom: 0,
            color: colors.brand,
            display: 'none', // gets overriden at small screen sizes
            left: 0,
            cursor: 'pointer',
            position: 'fixed',
            right: 0,
            width: '100%',
            zIndex: 1,
            [media.lessThan('small')]: smallScreenBottomBarStyles,
          }}
          onClick={this.toggleOpen}>
          <Container>
            <div
              css={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: 60,
                [media.between('medium', 'large')]: {
                  height: 50,
                },
                [media.lessThan('small')]: {
                  height: 40,
                },
              }}>
              {bottomBarText}
            </div>
          </Container>
        </div>
      </div>
    );
  }
}

export default StickyResponsiveSidebar;

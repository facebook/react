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
import isItemActive from 'utils/isItemActive';
import Sidebar from 'templates/components/Sidebar';
import {colors, media} from 'theme';

// TODO: memoize to save doing O(n) on the active section items + subitems every
// time.
function findActiveItemTitle(location, defaultActiveSection) {
  const {items} = defaultActiveSection;
  for (let i = 0, len = items.length; i < len; i++) {
    const item = items[i];
    if (isItemActive(location, item)) {
      return item.title;
    } else if (item.subitems && item.subitems.length) {
      const {subitems} = item;
      for (let j = 0, len2 = subitems.length; j < len2; j++) {
        const subitem = subitems[j];
        if (isItemActive(location, subitem)) {
          return subitem.title;
        }
      }
    }
  }
  // If nothing else is found, warn and default to section title
  console.warn('No active item title found in <StickyResponsiveSidebar>');
  return defaultActiveSection.title;
}

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
    const {defaultActiveSection, location} = this.props;
    console.log('the defaultActiveSection is ;', defaultActiveSection);
    console.log('this.props are ', this.props);
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
      zIndex: 2,
      height: '100vh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    };

    const smallScreenBottomBarStyles = {
      display: 'block',
    };

    const bottomBarText = this.state.open
      ? 'Close'
      : findActiveItemTitle(location, defaultActiveSection);

    return (
      <div>
        <div>
          <div
            css={{
              [media.lessThan('small')]: smallScreenSidebarStyles,

              [media.greaterThan('medium')]: {
                marginRight: -999,
                paddingRight: 999,
                backgroundColor: '#f7f7f7',
              },

              [media.between('medium', 'belowSidebarFixed')]: {
                position: 'fixed',
                zIndex: 2,
                height: '100%',
              },

              [media.size('small')]: {
                height: 'calc(100vh - 40px)',
              },

              [media.between('medium', 'large')]: {
                height: 'calc(100vh - 50px)',
              },

              [media.greaterThan('small')]: {
                position: 'fixed',
                zIndex: 2,
                height: 'calc(100vh - 60px)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                marginRight: -999,
                paddingRight: 999,
                backgroundColor: '#f7f7f7',
              },

              [media.greaterThan('sidebarFixed')]: {
                borderLeft: '1px solid #ececec',
              },
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
        </div>
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
            zIndex: 3,
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

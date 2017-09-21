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
import Sidebar from 'templates/components/Sidebar';
import {colors, media} from 'theme';
import ChevronSvg from 'templates/components/ChevronSvg';

class StickyResponsiveSidebar extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      open: false,
    };
    this.toggleOpen = this._toggleOpen.bind(this);
  }

  _toggleOpen() {
    this.setState({open: !this.state.open});
  }

  render() {
    const {title} = this.props;
    const {open} = this.state;
    const smallScreenSidebarStyles = {
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
      pointerEvents: open ? 'auto' : 'none',
    };

    const smallScreenBottomBarStyles = {
      display: 'block',
    };

    const iconOffset = open ? 7 : 0;
    const labelOffset = open ? -40 : 0;
    const menuOpacity = open ? 1 : 0;
    const menuOffset = open ? 0 : 40;

    return (
      <div>
        <div
          style={{
            opacity: menuOpacity,
            transition: 'opacity 0.5s ease',
          }}
          css={{
            [media.lessThan('small')]: smallScreenSidebarStyles,

            [media.greaterThan('medium')]: {
              marginRight: -999,
              paddingRight: 999,
              backgroundColor: '#f7f7f7',
            },

            [media.between('medium', 'sidebarFixed', true)]: {
              position: 'fixed',
              zIndex: 2,
              height: '100%',
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
              opacity: '1 !important',
            },

            [media.size('small')]: {
              height: 'calc(100vh - 40px)',
            },

            [media.between('medium', 'large')]: {
              height: 'calc(100vh - 50px)',
            },

            [media.greaterThan('sidebarFixed')]: {
              borderLeft: '1px solid #ececec',
            },
          }}>
          <div
            style={{
              transform: `translate(0px, ${menuOffset}px)`,
              transition: 'transform 0.5s ease',
            }}
            css={{
              marginTop: 60,

              [media.size('xsmall')]: {
                marginTop: 40,
              },

              [media.between('small', 'medium')]: {
                marginTop: 0,
              },

              [media.between('medium', 'large')]: {
                marginTop: 50,
              },

              [media.greaterThan('small')]: {
                tranform: 'none !important',
              },
            }}>
            <Sidebar {...this.props} />
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
                  overflow: 'hidden',
                  alignItems: 'flex-start',
                },
              }}>
              <div
                css={{
                  width: 20,
                  marginRight: 10,
                  alignSelf: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                <ChevronSvg
                  cssProps={{
                    transform: `translate(0, ${iconOffset}px) rotate(180deg)`,
                    transition: 'transform 0.5s ease',
                  }}
                />
                <ChevronSvg
                  cssProps={{
                    transform: `translate(0, ${0 - iconOffset}px)`,
                    transition: 'transform 0.5s ease',
                  }}
                />
              </div>
              <div
                css={{
                  flexGrow: 1,
                }}>
                <div
                  style={{
                    transform: `translate(0, ${labelOffset}px)`,
                    transition: 'transform 0.5s ease',
                  }}>
                  <div
                    css={{
                      height: 40,
                      lineHeight: '40px',
                    }}>
                    {title}
                  </div>
                  <div
                    css={{
                      height: 40,
                      lineHeight: '40px',
                    }}>
                    Close
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    );
  }
}

export default StickyResponsiveSidebar;

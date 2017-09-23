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

import {Component} from 'react';
import PropTypes from 'prop-types';
import {media} from 'theme';

class MenuOverlayContainer extends Component {
  constructor(props) {
    super(props);
    this.toggleMenuOverlay = this.toggleMenuOverlay.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.state = {
      open: false,
    };
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.open) {
      window.addEventListener('resize', this.handleWindowResize);
    } else {
      window.removeEventListener('resize', this.handleWindowResize);
    }
  }

  componentWillUnmount() {
    this.context.onMenuOverlayToggle(false);
    window.removeEventListener('resize', this.handleWindowResize);
  }

  handleWindowResize() {
    const mediaQuery = media.greaterThan('small').replace('@media ', '');
    if (window.matchMedia(mediaQuery).matches) {
      // If the screen has been resized >= 'small'
      this.toggleMenuOverlay(false);
    }
  }

  toggleMenuOverlay(willOpen) {
    this.setState(
      {
        open: willOpen,
      },
      () => {
        this.context.onMenuOverlayToggle(this.state.open);
      },
    );
  }

  handleTouchMove(evt) {
    // Prevent anything else from being touched when the menu overlay is open
    // to avoid touch scrolling issues
    if (this.state.open) {
      evt.preventDefault();
    }
  }
  render() {
    return this.props.children({
      open: this.state.open,
      toggleMenuOverlay: this.toggleMenuOverlay,
      preventTouches: this.handleTouchMove,
    });
  }
}

MenuOverlayContainer.contextTypes = {
  onMenuOverlayToggle: PropTypes.func.isRequired,
};

export default MenuOverlayContainer;

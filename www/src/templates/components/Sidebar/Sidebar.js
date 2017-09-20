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

import React, {Component} from 'react';
import Flex from 'components/Flex';
import Section from './Section';
import {media} from 'theme';

class Sidebar extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      activeSection: props.defaultActiveSection,
    };
  }

  render() {
    const {location, sectionList} = this.props;
    const {activeSection} = this.state;

    return (
      <Flex
        type="nav"
        direction="column"
        halign="stretch"
        css={{
          width: '100%',
          paddingLeft: 20,
          position: 'relative',

          [media.greaterThan('largerSidebar')]: {
            paddingLeft: 40,
          },

          [media.lessThan('small')]: {
            paddingBottom: 50,
          },
        }}>
        {sectionList.map((section, index) => (
          <Section
            isActive={activeSection === section || sectionList.length === 1}
            key={index}
            location={location}
            onClick={() => this._toggleSection(section)}
            section={section}
          />
        ))}
      </Flex>
    );
  }

  _toggleSection(section) {
    this.setState(state => ({
      activeSection: state.activeSection === section ? null : section,
    }));
  }
}

export default Sidebar;

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import Container from 'components/Container';
import Flex from 'components/Flex';
import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';
import {colors, fonts, media} from 'theme';

const NavigationFooter = ({next, prev, location}) => {
  return (
    <div
      css={{
        background: colors.dark,
        color: colors.white,
        paddingTop: 50,
        paddingBottom: 50,
      }}>
      <Container>
        <Flex
          type="ul"
          halign="space-between"
          css={{
            [media.between('small', 'medium')]: {
              paddingRight: 240,
            },

            [media.between('large', 'largerSidebar')]: {
              paddingRight: 280,
            },

            [media.between('largerSidebar', 'sidebarFixed', true)]: {
              paddingRight: 380,
            },
          }}>
          <Flex basis="50%" type="li">
            {prev &&
              <div>
                <SecondaryLabel>Previous article</SecondaryLabel>
                <div
                  css={{
                    paddingTop: 10,
                  }}>
                  <PrimaryLink location={location} to={prev}>
                    {linkToTitle(prev)}
                  </PrimaryLink>
                </div>
              </div>}
          </Flex>
          {next &&
            <Flex
              halign="flex-end"
              basis="50%"
              type="li"
              css={{
                textAlign: 'right',
              }}>
              <div>
                <SecondaryLabel>Next article</SecondaryLabel>
                <div
                  css={{
                    paddingTop: 10,
                  }}>
                  <PrimaryLink location={location} to={next}>
                    {linkToTitle(next)}
                  </PrimaryLink>
                </div>
              </div>
            </Flex>}
        </Flex>
      </Container>
    </div>
  );
};

NavigationFooter.propTypes = {
  next: PropTypes.string,
  prev: PropTypes.string,
};

export default NavigationFooter;

const linkToTitle = link => link.replace(/-/g, ' ').replace('.html', '');

const PrimaryLink = ({children, to, location}) => {
  // quick fix
  // TODO: replace this with better method of getting correct full url
  const updatedUrl =
    (location && location.pathname.replace(/\/[^/]+\.html/, '/' + to)) || to;
  return (
    <Link
      css={{
        display: 'inline',
        textTransform: 'capitalize',
        borderColor: colors.subtle,
        transition: 'border-color 0.2s ease',
        fontSize: 30,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',

        [media.lessThan('large')]: {
          fontSize: 24,
        },
        [media.size('xsmall')]: {
          fontSize: 16,
        },
        ':hover': {
          borderColor: colors.white,
        },
      }}
      to={updatedUrl}>
      {children}
    </Link>
  );
};

const SecondaryLabel = ({children}) => (
  <div
    css={{
      color: colors.brand,
      ...fonts.small,
    }}>
    {children}
  </div>
);

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
import HeaderLink from './HeaderLink';
import Link from 'gatsby-link';
import React from 'react';
import SearchSvg from './SearchSvg';
import {colors, fonts, media} from 'theme';

import logoSvg from 'icons/logo.svg';

// Note this version may point to an alpha/beta/next release.
// This is how the previous Jekyll site determined version though.
const {version} = require('../../../../package.json');

const Header = ({location}) => (
  <header
    css={{
      backgroundColor: colors.darker,
      color: colors.white,
      position: 'fixed',
      zIndex: 1,
      width: '100%',
      top: 0,
      left: 0,
    }}>
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
        <Link
          css={{
            display: 'flex',
            width: 'calc(100% / 6)',
          }}
          to="/">
          <img src={logoSvg} alt="React" height="20" />
          <span
            css={{
              color: colors.brand,
              marginLeft: 10,
              fontWeight: 700,
              fontSize: 20,
              [media.lessThan('large')]: {
                fontSize: 16,
              },
              [media.lessThan('small')]: {
                visibility: 'hidden',
              },
            }}>
            React
          </span>
        </Link>

        <nav
          css={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            overflowX: 'auto',
            height: '100%',
            width: '50%',
            [media.size('xsmall')]: {
              width: 'calc(100% * 2/3)',
            },
            [media.greaterThan('xlarge')]: {
              width: 'calc(100% / 3)',
            },
            [media.lessThan('small')]: {
              maskImage: 'linear-gradient(to right, transparent, black 20px, black 90%, transparent)',
            },
          }}>
          <HeaderLink
            isActive={location.pathname.includes('/docs/')}
            title="Docs"
            to="/docs/hello-world.html"
          />
          <HeaderLink
            isActive={location.pathname.includes('/tutorial/')}
            title="Tutorial"
            to="/tutorial/tutorial.html"
          />
          <HeaderLink
            isActive={location.pathname.includes('/community/')}
            title="Community"
            to="/community/support.html"
          />
          <HeaderLink
            isActive={location.pathname.includes('/blog')}
            title="Blog"
            to="/blog.html"
          />
        </nav>

        <form
          css={{
            width: 'calc(100% / 6)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            [media.lessThan('small')]: {
              justifyContent: 'flex-end',
            },
            [media.between('small', 'medium')]: {
              width: 'calc(100% / 3)',
            },
            [media.greaterThan('xlarge')]: {
              width: 'calc(100% / 3)',
            },
          }}>
          <label htmlFor="search">
            <SearchSvg />
          </label>
          <div
            css={{
              flexGrow: 1,
              paddingLeft: 10,
              [media.size('xsmall')]: {
                display: 'none',
              },
            }}>
            <input
              css={{
                appearance: 'none',
                background: 'transparent',
                border: 0,
                color: colors.white,
                width: '100%',
                fontSize: 18,
                position: 'relative',
                ':focus': {
                  outline: 'none',
                },
                [media.lessThan('large')]: {
                  fontSize: 14,
                },
              }}
              id="algolia-doc-search"
              type="search"
              placeholder="Search docs"
            />
          </div>
        </form>

        <div
          css={{
            [media.lessThan('medium')]: {
              display: 'none',
            },
            [media.greaterThan('large')]: {
              width: 'calc(100% / 6)',
            },
          }}>
          <a
            css={{
              padding: '5px 10px',
              backgroundColor: colors.lighter,
              borderRadius: 15,
              whiteSpace: 'nowrap',
              ...fonts.small,
            }}
            href="https://github.com/facebook/react/releases">
            v{version}
          </a>
          <a
            css={{
              padding: '5px 10px',
              whiteSpace: 'nowrap',
              ...fonts.small,
            }}
            href="https://github.com/facebook/react/">
            GitHub
          </a>
        </div>
      </div>
    </Container>
  </header>
);

export default Header;

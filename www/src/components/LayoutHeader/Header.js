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
import HeaderLink from './HeaderLink';
import Link from 'gatsby-link';
import React from 'react';
import {colors, fonts, media} from 'theme';
import ExternalLinkSvg from 'templates/components/ExternalLinkSvg';

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
          [media.between('small', 'large')]: {
            height: 50,
          },
          [media.lessThan('small')]: {
            height: 40,
          },
        }}>
        <Link
          css={{
            display: 'flex',
            marginRight: 10,
            height: '100%',
            alignItems: 'center',

            [media.greaterThan('small')]: {
              width: 'calc(100% / 6)',
            },
            [media.lessThan('small')]: {
              flex: '0 0 auto',
            },
          }}
          to="/">
          <img src={logoSvg} alt="" height="20" />
          <span
            css={{
              color: colors.brand,
              marginLeft: 10,
              fontWeight: 700,
              fontSize: 20,
              lineHeight: '20px',
              [media.lessThan('large')]: {
                fontSize: 16,
                marginTop: 1,
              },
              [media.lessThan('small')]: {
                // Visually hidden
                position: 'absolute',
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                height: 1,
                width: 1,
                margin: -1,
                padding: 0,
                border: 0,
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
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            height: '100%',
            width: '60%',
            [media.size('xsmall')]: {
              flexGrow: '1',
              width: 'auto',
            },
            [media.greaterThan('xlarge')]: {
              width: null,
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
            to="/blog/"
          />
        </nav>

        <form
          css={{
            display: 'flex',
            flex: '0 0 auto',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',

            [media.lessThan('small')]: {
              justifyContent: 'flex-end',
            },
            [media.lessThan('large')]: {
              marginRight: 10,
            },
            [media.between('small', 'medium')]: {
              width: 'calc(100% / 3)',
            },
            [media.between('medium', 'xlarge')]: {
              width: 'calc(100% / 6)',
            },
            [media.greaterThan('small')]: {
              minWidth: 120,
            },
          }}>
          <input
            css={{
              appearance: 'none',
              background: 'transparent',
              border: 0,
              color: colors.white,
              fontSize: 18,
              fontWeight: 300,
              fontFamily: 'inherit',
              position: 'relative',
              paddingLeft: '24px',
              backgroundImage: 'url(/search.svg)',
              backgroundSize: '16px 16px',
              backgroundRepeat: 'no-repeat',
              backgroundPositionY: 'center',
              backgroundPositionX: 'left',

              [media.lessThan('large')]: {
                fontSize: 16,
              },
              [media.greaterThan('small')]: {
                width: '100%',
              },
              [media.lessThan('small')]: {
                width: '16px',
                transition: 'width 0.2s ease, padding 0.2s ease',
                paddingLeft: '16px',

                ':focus': {
                  paddingLeft: '24px',
                  width: '8rem',
                  outline: 'none',
                },
              },
            }}
            id="algolia-doc-search"
            type="search"
            placeholder="Search docs"
            aria-label="Search docs"
          />
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
            href="https://github.com/facebook/react/releases"
            target="_blank"
            rel="noopener">
            v{version}
          </a>
          <a
            css={{
              padding: '5px 10px',
              marginLeft: 10,
              whiteSpace: 'nowrap',
              ...fonts.small,
              ':hover': {
                color: colors.brand,
              },
            }}
            href="https://github.com/facebook/react/"
            target="_blank"
            rel="noopener">
            GitHub
            <ExternalLinkSvg
              cssProps={{
                marginLeft: 5,
                verticalAlign: -2,
                color: colors.subtle,
              }}
            />
          </a>
        </div>
      </div>
    </Container>
  </header>
);

export default Header;

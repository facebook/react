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
import FooterLink from './FooterLink';
import FooterNav from './FooterNav';
import MetaTitle from 'templates/components/MetaTitle';
import React from 'react';
import {colors, media} from 'theme';

import ossLogoPng from 'images/oss_logo.png';

const Footer = () => (
  <footer
    css={{
      backgroundColor: colors.darker,
      color: colors.white,
      paddingTop: 10,
      paddingBottom: 50,

      [media.size('sidebarFixed')]: {
        paddingTop: 80,
      },

      [media.size('sidebarFixedNarrowFooter')]: {
        paddingTop: 10,
      },
    }}>
    <Container isFooter={true}>
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',

          [media.between('small', 'medium')]: {
            paddingRight: 240,
          },

          [media.between('large', 'xlargeSmaller')]: {
            paddingRight: 280,
          },
          [media.between('xlargeSmaller', 'belowSidebarFixed')]: {
            paddingRight: 380,
          },
        }}>
        <div
          css={{
            flexWrap: 'wrap',
            display: 'flex',

            [media.lessThan('large')]: {
              width: '100%',
            },
            [media.greaterThan('xlarge')]: {
              width: 'calc(100% / 3 * 2)',
              paddingLeft: 40,
            },
          }}>
          <FooterNav>
            <MetaTitle onDark={true}>Docs</MetaTitle>
            <FooterLink to="/docs/hello-world.html">Quick Start</FooterLink>
            <FooterLink to="/docs/thinking-in-react.html">
              Thinking in React
            </FooterLink>
            <FooterLink to="/tutorial/tutorial.html">Tutorial</FooterLink>
            <FooterLink to="/docs/jsx-in-depth.html">
              Advanced Guides
            </FooterLink>
          </FooterNav>
          <FooterNav>
            <MetaTitle onDark={true}>Community</MetaTitle>
            <FooterLink
              to="http://stackoverflow.com/questions/tagged/reactjs"
              target="_blank"
              rel="noopener">
              Stack Overflow
            </FooterLink>
            <FooterLink
              to="https://discuss.reactjs.org"
              target="_blank"
              rel="noopener">
              Discussion Forum
            </FooterLink>
            <FooterLink
              to="https://discord.gg/0ZcbPKXt5bZjGY5n"
              target="_blank"
              rel="noopener">
              Reactiflux Chat
            </FooterLink>
            <FooterLink
              to="https://www.facebook.com/react"
              target="_blank"
              rel="noopener">
              Facebook
            </FooterLink>
            <FooterLink
              to="https://twitter.com/reactjs"
              target="_blank"
              rel="noopener">
              Twitter
            </FooterLink>
          </FooterNav>
          <FooterNav>
            <MetaTitle onDark={true}>Resources</MetaTitle>
            <FooterLink to="/community/conferences.html">
              Conferences
            </FooterLink>
            <FooterLink to="/community/videos.html">Videos</FooterLink>
            <FooterLink
              to="https://github.com/facebook/react/wiki/Examples"
              target="_blank"
              rel="noopener">
              Examples
            </FooterLink>
            <FooterLink
              to="https://github.com/facebook/react/wiki/Complementary-Tools"
              target="_blank"
              rel="noopener">
              Complementary Tools
            </FooterLink>
          </FooterNav>
          <FooterNav>
            <MetaTitle onDark={true}>More</MetaTitle>
            <FooterLink to="/blog.html">Blog</FooterLink>
            <FooterLink to="https://github.com/facebook/react" target="_blank">
              GitHub
            </FooterLink>
            <FooterLink
              to="http://facebook.github.io/react-native/"
              target="_blank">
              React Native
            </FooterLink>
            <FooterLink to="/acknowledgements.html">
              Acknowledgements
            </FooterLink>
          </FooterNav>
        </div>
        <section
          css={{
            paddingTop: 40,
            display: 'block !important', // Override 'Installation' <style> specifics

            [media.greaterThan('xlarge')]: {
              width: 'calc(100% / 3)',
              order: -1,
            },
            [media.lessThan('large')]: {
              textAlign: 'center',
              width: '100%',
              paddingTop: 40,
            },
          }}>
          <a href="https://code.facebook.com/projects/" target="_blank">
            <img
              alt="Facebook Open Source"
              css={{
                maxWidth: 160,
                height: 'auto',
              }}
              src={ossLogoPng}
            />
          </a>
          <p
            css={{
              color: colors.subtleOnDark,
              paddingTop: 15,
            }}>
            Copyright © 2017 Facebook Inc.
          </p>
        </section>
      </div>
    </Container>
  </footer>
);

export default Footer;

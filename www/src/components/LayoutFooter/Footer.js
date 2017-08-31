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
import FooterTitle from './FooterTitle';
import React from 'react';
import {colors, media} from 'theme';

import ossLogoPng from 'images/oss_logo.png';

const Footer = () => (
  <footer
    css={{
      backgroundColor: colors.darker,
      color: colors.white,
      paddingTop: 50,
      paddingBottom: 50,

      [media.xxlarge]: {
        paddingTop: 80,
      },
    }}>
    <Container>
      <div
        css={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
        <FooterNav>
          <FooterTitle>Docs</FooterTitle>
          <FooterLink to="/docs/hello-world.html">Quick Start</FooterLink>
          <FooterLink to="/docs/thinking-in-react.html">Thinking in React</FooterLink>
          <FooterLink to="/tutorial/tutorial.html">Tutorial</FooterLink>
          <FooterLink to="/docs/jsx-in-depth.html">Advanced Guides</FooterLink>
        </FooterNav>
        <FooterNav>
          <FooterTitle>Community</FooterTitle>
          <FooterLink to="http://stackoverflow.com/questions/tagged/reactjs" target="_blank">Stack Overflow</FooterLink>
          <FooterLink to="https://discuss.reactjs.org" target="_blank">Discussion Forum</FooterLink>
          <FooterLink to="https://discord.gg/0ZcbPKXt5bZjGY5n" target="_blank">Reactiflux Chat</FooterLink>
          <FooterLink to="https://www.facebook.com/react" target="_blank">Facebook</FooterLink>
          <FooterLink to="https://twitter.com/reactjs" target="_blank">Twitter</FooterLink>
        </FooterNav>
        <FooterNav>
          <FooterTitle>Resources</FooterTitle>
          <FooterLink to="/community/conferences.html">Conferences</FooterLink>
          <FooterLink to="/community/videos.html">Videos</FooterLink>
          <FooterLink to="https://github.com/facebook/react/wiki/Examples" target="_blank">Examples</FooterLink>
          <FooterLink to="https://github.com/facebook/react/wiki/Complementary-Tools" target="_blank">Complementary Tools</FooterLink>
        </FooterNav>
        <FooterNav>
          <FooterTitle>More</FooterTitle>
          <FooterLink to="/blog.html">Blog</FooterLink>
          <FooterLink to="https://github.com/facebook/react" target="_blank">GitHub</FooterLink>
          <FooterLink to="http://facebook.github.io/react-native/" target="_blank">React Native</FooterLink>
          <FooterLink to="/acknowledgements.html">Acknowledgements</FooterLink>
        </FooterNav>
        <section
          css={{
            [media.xlargeUp]: {
              width: 'calc(100% / 3)',
              order: -1,
            },
            [media.largeDown]: {
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
              color: colors.subtle,
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

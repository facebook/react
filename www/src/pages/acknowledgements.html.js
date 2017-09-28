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
import Header from 'components/Header';
import React from 'react';
import {sharedStyles} from 'theme';

import names from '../../../docs/_data/acknowledgements.yml';

const Acknowlegements = ({data, location}) => (
  <Container>
    <div css={sharedStyles.articleLayout.container}>
      <div css={sharedStyles.articleLayout.content}>
        <Header>Acknowledgements</Header>

        <div css={sharedStyles.markdown}>
          <p>We'd like to thank all of our contributors:</p>

          <ul
            css={{
              display: 'flex',
              flexWrap: 'wrap',
            }}>
            {names.map((name, index) => (
              <li
                css={{
                  flex: '1 0 200px',
                }}
                key={index}>
                {name}
              </li>
            ))}
          </ul>

          <p>In addition, we're grateful to</p>
          <ul>
            <li>
              <a href="https://github.com/jeffbski">Jeff Barczewski</a>
              {' '}
              for allowing us to use the
              {' '}
              <a href="https://www.npmjs.com/package/react">react</a>
              {' '}
              package name on npm.
            </li>
            <li>
              <a href="http://christopheraue.net/">Christopher Aue</a>
              {' '}
              for letting us use the
              {' '}
              <a href="http://reactjs.com/">reactjs.com</a>
              {' '}
              domain name and the
              {' '}
              <a href="https://twitter.com/reactjs">@reactjs</a>
              {' '}
              username on Twitter.
            </li>
            <li>
              <a href="https://github.com/ProjectMoon">ProjectMoon</a>
              {' '}
              for letting us use the
              {' '}
              <a href="https://www.npmjs.com/package/flux">flux</a>
              {' '}
              package name on npm.
            </li>
            <li>
              Shane Anderson for allowing us to use the
              {' '}
              <a href="https://github.com/react">react</a>
              {' '}
              org on GitHub.
            </li>
            <li>
              <a href="https://github.com/voronianski">Dmitri Voronianski</a>
              {' '}
              for letting us use the
              {' '}
              <a href="https://labs.voronianski.com/oceanic-next-color-scheme/">
                Oceanic Next
              </a>
              {' '}
              color scheme on this website.
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Container>
);

export default Acknowlegements;

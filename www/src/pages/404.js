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

const PageNotFound = () => (
  <Container>
    <div css={sharedStyles.articleLayout.container}>
      <div css={sharedStyles.articleLayout.content}>
        <Header>Page Not Found</Header>
        <div css={sharedStyles.markdown}>
          <p>
            We couldn't find what you were looking for.
          </p>
          <p>
            Please contact the owner of the site that linked you
            to the original URL and let them know their link is broken.
          </p>
        </div>
      </div>
    </div>
  </Container>
);

export default PageNotFound;

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

import Link from 'gatsby-link';
import Container from 'components/Container';
import Header from 'components/Header';

const PageNotFound = () => (
  <Container>
    <Header>Page Not Found</Header>
    <p>
      We couldn't find what you were looking for.
    </p>
    <p>
      Please contact the owner of the site that linked you to the original URL and let them know their link is broken.
    </p>
  </Container>
);

export default PageNotFound;

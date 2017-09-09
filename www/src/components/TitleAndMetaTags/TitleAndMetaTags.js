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

import Helmet from 'react-helmet';
import React from 'react';

const defaultDescription = 'A JavaScript library for building user interfaces';

const TitleAndMetaTags = ({title, ogDescription, ogUrl}) => {
  // TODO: get the og:url passed in
  return (
    <Helmet title={title}>
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      {ogUrl &&
      <meta property="og:url" content={ogUrl} />
      }
      <meta property="og:image" content="https://facebook.github.io/react/img/logo_og.png" />
      <meta property="og:description" content={ogDescription || defaultDescription} />
      <meta property="fb:app_id" content="623268441017527" />
    </Helmet>
  );
};

export default TitleAndMetaTags;

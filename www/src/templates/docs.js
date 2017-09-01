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

import InstallationPage from 'components/InstallationPage';
import MarkdownPage from 'components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';

import sectionListA from '../../../docs/_data/nav_docs.yml';
import sectionListB from '../../../docs/_data/nav_contributing.yml';

const sectionList = sectionListA
  .map(item => {
    item.directory = 'docs';
    return item;
  })
  .concat(
    sectionListB.map(item => {
      item.directory = 'contributing';
      return item;
    }),
  );

const Docs = ({data, location}) => {
  console.log('location is ', location);
  if (location.pathname === '/docs/installation.html') {
    console.log('about to render InstallationPage');
    return (
      <InstallationPage
        markdownRemark={data.markdownRemark}
        sectionList={sectionList}
      />
    );
  }
  return (
    <MarkdownPage
      location={location}
      markdownRemark={data.markdownRemark}
      sectionList={sectionList}
    />
  );
};

Docs.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query TemplateDocsMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        next
        prev
      }
      fields {
        path
      }
    }
  }
`;

export default Docs;

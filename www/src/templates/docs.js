/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import MarkdownPage from 'components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';
import {createLinkDocs} from 'utils/createLink';
import {sectionListDocs} from 'utils/sectionList';

const Docs = ({data, location}) => (
  <MarkdownPage
    createLink={createLinkDocs}
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={sectionListDocs}
    titlePostfix=" - React"
  />
);

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

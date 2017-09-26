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

import MarkdownPage from 'components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';
import {createLinkTutorial} from 'utils/createLink';
import {sectionListTutorial} from 'utils/sectionList';

const Tutorial = ({data, location}) => (
  <MarkdownPage
    createLink={createLinkTutorial}
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={sectionListTutorial}
    titlePostfix=" - React"
  />
);

Tutorial.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query TemplateTutorialMarkdown($slug: String!) {
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

export default Tutorial;

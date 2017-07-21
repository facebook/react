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

import {Component} from 'react';
import {navigateTo} from 'gatsby-link';
import PropTypes from 'prop-types';

// TODO Remove this page in favor of createRedirect() in gatsby-node.js
// github.com/gatsbyjs/gatsby/pull/1068

class BlogRedirectPage extends Component {
  componentDidMount() {
    navigateTo(this.props.data.allMarkdownRemark.edges[0].node.fields.slug);
  }

  render() {
    return null;
  }
}

BlogRedirectPage.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query BlogPageQuery {
    allMarkdownRemark(
      limit: 1,
      filter: { id: { regex: "/_posts/" } }
      sort: { fields: [fields___date], order: DESC }
    ) {
      edges {
        node {
          fields {
            slug
          }
        }
      }
    }
  }
`;

export default BlogRedirectPage;

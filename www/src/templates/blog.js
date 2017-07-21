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

import MarkdownPage from './components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';

// TODO This is hacky
const toSectionList = allMarkdownRemark => [
  {
    title: 'Recent Posts',
    items: allMarkdownRemark.edges
      .map(({node}) => ({
        id: node.fields.slug,
        title: node.frontmatter.title,
      }))
      .concat({
        id: '/blog/all.html',
        title: 'All posts ...',
      }),
  },
];

const Blog = ({data, location}) => (
  <MarkdownPage
    authors={data.markdownRemark.frontmatter.author}
    date={new Date(data.markdownRemark.fields.date)}
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={toSectionList(data.allMarkdownRemark)}
  />
);

Blog.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query TemplateBlogMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        next
        prev
        author {
          frontmatter {
            name
            url
          }
        }
      }
      fields {
        date
        path
      }
    }
    allMarkdownRemark(
      limit: 10,
      filter: { id: { regex: "/_posts/" } }
      sort: { fields: [fields___date], order: DESC }
    ) {
      edges {
        node {
          frontmatter {
            title
          }
          fields {
            slug
          }
        }
      }
    }
  }
`;

export default Blog;

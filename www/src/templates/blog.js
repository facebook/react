/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import PropTypes from 'prop-types';
import React from 'react';
import MarkdownPage from 'components/MarkdownPage';
import {createLinkBlog} from 'utils/createLink';

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
    createLink={createLinkBlog}
    date={data.markdownRemark.fields.date}
    location={location}
    ogDescription={data.markdownRemark.excerpt}
    markdownRemark={data.markdownRemark}
    sectionList={toSectionList(data.allMarkdownRemark)}
    titlePostfix=" - React Blog"
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
      excerpt(pruneLength: 500)
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
        date(formatString: "MMMM DD, YYYY")
        path
        slug
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

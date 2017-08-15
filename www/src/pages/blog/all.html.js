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
import React from 'react';
import {sharedStyles} from 'theme';
import toCommaSeparatedList from 'utils/toCommaSeparatedList';

const AllBlogPosts = ({data}) => (
  <Container>
    <Header>All Posts</Header>
    <ul>
      {data.allMarkdownRemark.edges.map(({node}) => (
        <li
          css={{
            marginTop: 10,
          }}
          key={node.fields.slug}>
          <Link
            css={sharedStyles.link}
            key={node.fields.slug}
            to={node.fields.slug}>
            {node.frontmatter.title}
          </Link>
          {' '}
          on
          {' '}
          {node.fields.date}
          {' '}
          by
          {' '}
          {toCommaSeparatedList(node.frontmatter.author, author => (
            <span key={author.frontmatter.name}>
              {author.frontmatter.name}
            </span>
          ))}
        </li>
      ))}
    </ul>
  </Container>
);

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query AllBlogPostsPageQuery {
    allMarkdownRemark(
      filter: { id: { regex: "/_posts/" } }
      sort: { fields: [fields___date], order: DESC }
    ) {
      edges {
        node {
          frontmatter {
            title
            author {
              frontmatter {
                name
                url
              }
            }
          }
          fields {
            date(formatString: "MMMM DD, YYYY")
            slug
          }
        }
      }
    }
  }
`;

export default AllBlogPosts;

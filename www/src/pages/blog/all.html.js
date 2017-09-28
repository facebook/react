/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

import Link from 'gatsby-link';
import Container from 'components/Container';
import Header from 'components/Header';
import React from 'react';
import {colors, media, sharedStyles} from 'theme';
import toCommaSeparatedList from 'utils/toCommaSeparatedList';
import MetaTitle from 'templates/components/MetaTitle';

const AllBlogPosts = ({data}) => (
  <Container>
    <div css={sharedStyles.articleLayout.container}>
      <div css={sharedStyles.articleLayout.content}>
        <Header>All Posts</Header>
        <ul
          css={{
            display: 'flex',
            flexWrap: 'wrap',
            marginLeft: -40,
          }}>
          {data.allMarkdownRemark.edges.map(({node}) => (
            <li
              css={{
                paddingLeft: 40,
                paddingTop: 40,
                borderTop: '1px dotted #ececec',
                paddingBottom: 40,
                width: '100%',

                [media.size('medium')]: {
                  width: '50%',
                },

                [media.greaterThan('large')]: {
                  width: '33.33%',
                },
              }}
              key={node.fields.slug}>
              <h2
                css={{
                  fontSize: 24,
                  color: colors.dark,
                  lineHeight: 1.3,
                  fontWeight: 700,
                }}>
                <Link
                  css={{
                    borderBottom: '1px solid #ececec',
                    ':hover': {
                      borderBottomColor: colors.black,
                    },
                  }}
                  key={node.fields.slug}
                  to={node.fields.slug}>
                  {node.frontmatter.title}
                </Link>
              </h2>
              <MetaTitle>
                {node.fields.date}
              </MetaTitle>
              <div
                css={{
                  color: colors.subtle,
                  marginTop: -5,
                }}>
                by
                {' '}
                {toCommaSeparatedList(node.frontmatter.author, author => (
                  <span key={author.frontmatter.name}>
                    {author.frontmatter.name}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
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

import Link from 'gatsby-link';
import MarkdownHeader from '../../components/MarkdownHeader';
import Container from '../../components/Container';
import PropTypes from 'prop-types';
import React from 'react';
import {sharedStyles} from '../../theme';
import dateToString from '../../utils/dateToString';
import toCommaSeparatedList from '../../utils/toCommaSeparatedList';

const AllBlogPosts = ({data}) => (
  <Container>
    <MarkdownHeader title="All Posts" />
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
          {dateToString(new Date(node.fields.date))}
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
            date
            slug
          }
        }
      }
    }
  }
`;

export default AllBlogPosts;

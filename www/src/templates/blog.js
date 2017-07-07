import MarkdownPage from '../components/MarkdownPage';
import PropTypes from 'prop-types';
import React from 'react';

const sectionList = []; // TODO Load 10 most recent blog entries; see nav_blog.html

const Blog = ({data, location}) => (
  <MarkdownPage
    author={data.markdownRemark.frontmatter.author}
    date={new Date(data.markdownRemark.fields.date)}
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={sectionList}
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
  }
`;

export default Blog;

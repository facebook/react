import { navigateTo } from 'gatsby-link';
import PropTypes from 'prop-types';
import React from 'react';

// TODO Remove this page in favor of createRedirect() in gatsby-node.js
// github.com/gatsbyjs/gatsby/pull/1068

class BlogRedirectPage extends React.Component {
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

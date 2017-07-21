import MarkdownPage from './components/MarkdownPage';
import PropTypes from 'prop-types';

import sectionList from '../../../docs/_data/nav_community.yml';

const Community = ({data, location}) => (
  <MarkdownPage
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={sectionList}
  />
);

Community.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query TemplateCommunityMarkdown($slug: String!) {
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

export default Community;

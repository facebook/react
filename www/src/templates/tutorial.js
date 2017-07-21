import MarkdownPage from './components/MarkdownPage';
import PropTypes from 'prop-types';

import sectionList from '../../../docs/_data/nav_tutorial.yml';

const Tutorial = ({data, location}) => (
  <MarkdownPage
    location={location}
    markdownRemark={data.markdownRemark}
    sectionList={sectionList}
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

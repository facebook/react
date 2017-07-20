import Container from 'components/Container';
import Flex from 'components/Flex';
import MarkdownHeader from 'templates/components/MarkdownHeader';
import NavigationFooter from 'templates/components/NavigationFooter';
import React from 'react';
import {StickyContainer} from 'react-sticky';
import PropTypes from 'prop-types';
import StickySidebar from '../StickySidebar';
import dateToString from 'utils/dateToString';
import findSectionForPath from 'utils/findSectionForPath';
import toCommaSeparatedList from 'utils/toCommaSeparatedList';
import {sharedStyles} from 'theme';

// TODO Use 'react-helmet' to set metadata

// TODO Set nested markup styles (eg <p>, <code>, etc)

const MarkdownPage = ({
  authors,
  date,
  location,
  markdownRemark,
  sectionList,
}) => {
  const hasAuthors = authors.length > 0;

  return (
    <Flex
      direction="column"
      grow="1"
      shrink="0"
      halign="stretch"
      css={{
        width: '100%',
        flex: '1 0 auto',
        position: 'relative',
        zIndex: 0,
      }}>
      <div css={{flex: '1 0 auto'}}>
        <Container>
          <StickyContainer
            css={{
              display: 'flex',
              overflow: 'auto',
            }}>
            <Flex type="article" direction="column" grow="1" halign="stretch">
              <MarkdownHeader
                path={markdownRemark.fields.path}
                title={markdownRemark.frontmatter.title}
              />

              {(date || hasAuthors) &&
                <div css={{marginTop: 15}}>
                  {date ? `${dateToString(date)} ` : ''}
                  {hasAuthors &&
                    <span>
                      by {toCommaSeparatedList(authors, author => (
                        <a
                          href={author.frontmatter.url}
                          key={author.frontmatter.name}>
                          {author.frontmatter.name}
                        </a>
                      ))}
                    </span>}
                </div>}

              <div
                css={{
                  marginTop: 65,
                  marginBottom: 120,
                  '& a:not(.anchor)': sharedStyles.link,
                }}
                dangerouslySetInnerHTML={{__html: markdownRemark.html}}
              />
            </Flex>

            <div
              css={{
                flex: '0 0 200px',
                marginLeft: 'calc(9% + 40px)',
              }}>
              <StickySidebar
                defaultActiveSection={findSectionForPath(
                  location.pathname,
                  sectionList,
                )}
                location={location}
                sectionList={sectionList}
              />
            </div>
          </StickyContainer>
        </Container>
      </div>

      {/* TODO Read prev/next from index map, not this way */}
      <NavigationFooter
        next={markdownRemark.frontmatter.next}
        prev={markdownRemark.frontmatter.prev}
      />
    </Flex>
  );
};

MarkdownPage.defaultProps = {
  authors: [],
};

// TODO Better types
MarkdownPage.propTypes = {
  authors: PropTypes.array.isRequired,
  date: PropTypes.object,
  location: PropTypes.object.isRequired,
  markdownRemark: PropTypes.object.isRequired,
  sectionList: PropTypes.array.isRequired,
};

export default MarkdownPage;

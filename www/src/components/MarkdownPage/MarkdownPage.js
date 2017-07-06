import cn from 'classnames';
import MarkdownHeader from '../MarkdownHeader';
import NavigationFooter from '../NavigationFooter';
import React from 'react';
import {StickyContainer} from 'react-sticky';
import PropTypes from 'prop-types';
import StickySidebar from '../StickySidebar';
import findSectionForPath from '../../utils/findSectionForPath';
import styles from './MarkdownPage.module.scss';

// TODO Use 'react-helmet' to set metadata

const MarkdownPage = ({location, markdownRemark, sectionList}) => (
  <div className={styles.MarkdownPage}>
    <div className={styles.Wrapper}>
      <StickyContainer className={styles.Sticky}>
        <article className={styles.Main}>
          <div className={styles.Inner}>
            <MarkdownHeader
              path={markdownRemark.fields.path}
              title={markdownRemark.frontmatter.title}
            />
          </div>

          <div
            className={cn(styles.Body, styles.Inner)}
            dangerouslySetInnerHTML={{__html: markdownRemark.html}}
          />
        </article>

        <div className={styles.Wrapper}>
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

      {/* TODO Read prev/next from index map, not this way */}
      <NavigationFooter
        next={markdownRemark.frontmatter.next}
        prev={markdownRemark.frontmatter.prev}
      />
    </div>
  </div>
);

// TODO Better types
MarkdownPage.propTypes = {
  location: PropTypes.object.isRequired,
  markdownRemark: PropTypes.object.isRequired,
  sectionList: PropTypes.array.isRequired,
};

export default MarkdownPage;

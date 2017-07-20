import Link from 'gatsby-link';
import React from 'react';
import slugify from 'utils/slugify';
import {colors} from 'theme';

const toAnchor = (href = '') => {
  const index = href.indexOf('#');
  return index >= 0 ? href.substr(index) : '';
};

// TODO Update isActive link as document scrolls past anchor tags
// Maybe used 'hashchange' along with 'scroll' to set/update active links

// TODO Account for redirect_from URLs somehow; they currently won't match.

// HACK Use window.location instead because Gatsby's location.hash doesn't update
const isItemActive = item => {
  if (window.location.hash) {
    if (item.href) {
      return window.location.hash === toAnchor(item.href);
    }
  } else if (item.id.includes('html')) {
    return window.location.pathname.includes(item.id);
  } else {
    return window.location.pathname.includes(slugify(item.id));
  }
};

const Section = ({isActive, onClick, section}) => (
  <div>
    <h2 css={{margin: '1rem 0'}}>
      <a
        css={{
          color: isActive ? colors.text : colors.subtle,
          transition: 'color 0.2s ease',
          cursor: 'pointer',

          ':hover': {
            color: colors.text,
          },
        }}
        onClick={onClick}>
        {section.title}
      </a>
    </h2>
    {isActive &&
      <ul css={{marginBottom: 10}}>
        {section.items.map(item => (
          <li key={item.id}>
            {CreateLink(item)}

            {item.subitems &&
              <ul css={{marginLeft: 20}}>
                {item.subitems.map(subitem => (
                  <li key={subitem.id}>
                    {CreateLink(subitem)}
                  </li>
                ))}
              </ul>}
          </li>
        ))}
      </ul>}
  </div>
);

const activeLinkCss = {
  color: colors.brand,

  ':before': {
    content: '',
    width: 4,
    height: '100%',
    borderLeft: `4px solid ${colors.brand}`,
    marginLeft: -20,
    paddingLeft: 16,
  },
};

const linkCss = {
  color: colors.text,
  display: 'inline-block',
  borderBottom: '1px solid transparent',
  transition: 'border 0.2s ease',
  marginTop: 5,

  '&:hover': {
    color: colors.brand,
  },
};

const CreateLink = item => {
  if (item.id.includes('.html')) {
    return (
      <Link css={[linkCss, isItemActive(item) && activeLinkCss]} to={item.id}>
        {item.title}
      </Link>
    );
  } else if (item.forceInternal) {
    return (
      <Link
        css={[linkCss, isItemActive(item) && activeLinkCss]}
        to={toAnchor(item.href)}>
        {item.title}
      </Link>
    );
  } else if (item.href) {
    return (
      <a
        css={[
          linkCss,
          {
            paddingRight: 15,

            ':hover': {
              borderBottomColor: 'transparent',
            },

            ':after': {
              content: '" " url(../../../../docs/img/external.png)', // TODO Move to a better relative location
            },
          },
        ]}
        href={item.href}>
        {item.title}
      </a>
    );
  } else {
    return (
      <Link
        css={[linkCss, isItemActive(item) && activeLinkCss]}
        to={slugify(item.id)}>
        {item.title}
      </Link>
    );
  }
};

export default Section;

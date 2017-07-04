import Link from 'gatsby-link';
import React from 'react';
import { debounce } from 'lodash';
import getScrollTop from '../utils/getScrollTop';
import getOffsetTop from '../utils/getOffsetTop';

// TODO (HACK)
import docsList from '../../../docs/_data/nav_docs.yml'
const slugify = id => `${id}.html`

// TODO Componentize this whole file

const getDefaultActiveSection = pathname => {
  let activeSection = docsList[0]; // Default to first

  docsList.forEach(section => {
    const match = section.items.some(
      item => pathname.includes(slugify(item.id))
    );
    if (match) {
      activeSection = section;
    }
  });

  return activeSection;
}

class Sidebar extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      activeSection: getDefaultActiveSection(props.location.pathname),
    };

    this.isSticky = false;
    this.isAtBottom = false;
    this.hasScrolled = false;
    this.handleWindowScroll = this.handleWindowScroll.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleAfterWindowResize = debounce(this.handleWindowResize, 200);
    this.handleWindowLoad = this.handleWindowLoad.bind(this);
    this.update = this.update.bind(this);
  }

  componentDidMount() {
    this.nav = document.getElementById('nav');
    this.navOuter = document.getElementById('nav_outer');
    this.navInner = document.getElementById('nav_inner');
    this.navBounds = document.getElementById('nav_bounds');
    this.header = document.getElementById('header');
    window.addEventListener('scroll', this.handleWindowScroll);
    window.addEventListener('resize', this.handleAfterWindowResize);
    window.addEventListener('load', this.handleWindowLoad);
    this.cacheDimensions();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleWindowScroll);
    window.removeEventListener('resize', this.handleAfterWindowResize);
    window.removeEventListener('load', this.handleWindowLoad);
  }

  update(evt) {
    if (this.hasScrolled === false) {
      this.hasScrolled = true;
    }

    const diff = this.scrollTop - this.prevScrollTop;
    const navOffsetTop = getOffsetTop(this.nav);
    const navBottom = navOffsetTop + this.navHeight;
    const navPositionTop = parseInt(this.navInner.style.top || this.headerHeight, 10);
    const navIsLarger = this.navHeight > this.windowHeight;
    const navBoundsBottom = getOffsetTop(this.navBounds) + this.navBoundsHeight;
    const shouldBeAtBottom = (this.scrollTop + this.navInnerHeight + navPositionTop) > navBoundsBottom;
    const shouldBeSticky = navOffsetTop < (this.scrollTop + this.headerHeight);

    this.prevScrollTop = this.scrollTop;

    if (shouldBeSticky === true && shouldBeAtBottom === false) {
      if (this.isSticky === false) {
        this.nav.style.height = this.navInnerHeight + 'px';
        this.nav.style.width = this.navOuterWidth + 'px';
        this.nav.classList.add('is-sticky');
        this.isSticky = true;
      }
    } else {
      if (this.isSticky === true) {
        this.nav.style.height = null;
        this.nav.style.width = null;
        this.nav.classList.remove('is-sticky');
        this.isSticky = false;
      }
    }

    if (shouldBeAtBottom === true) {
      if (this.isAtBottom === false) {
        this.nav.classList.add('is-at-bottom');
        this.isAtBottom = true;
        this.navInner.style.top = null;
      }
    } else {
      if (this.isAtBottom === true) {
        this.nav.classList.remove('is-at-bottom');
        this.isAtBottom = false;
      }
    }

    if (navIsLarger && this.isSticky) {
      const minOffset = 0 - ((this.navHeight) - this.windowHeight);
      const maxOffset = this.headerHeight;
      let newTop = (navPositionTop - diff);
      newTop = Math.max(minOffset, newTop);
      newTop = Math.min(maxOffset, newTop);
      this.navInner.style.top = newTop + 'px';
    }

    this.ticking = false;
  }

  cacheDimensions() {
    this.navHeight = this.nav.offsetHeight;
    this.windowHeight = window.innerHeight;
    this.navTopRect = this.nav.getBoundingClientRect().top;
    this.navInnerHeight = this.navInner.offsetHeight;
    this.navOuterWidth = this.navOuter.offsetWidth;
    this.navBoundsHeight = this.navBounds.offsetHeight;
    this.navBoundsTopRect = this.navBounds.getBoundingClientRect().top;
    this.headerHeight = this.header.offsetHeight;
  }

  destroy() {
    this.prevScrollTop = null;
    this.isSticky = false;
    this.isAtBottom = false;
    this.navInner.style.top = null;
    this.nav.style.height = null;
    this.nav.style.width = null;
    this.ticking = false;
  }

  requestTick() {
    if (!this.ticking) {
      requestAnimationFrame(this.update);
      this.ticking = true;
    }
  }

  handleWindowScroll() {
    this.scrollTop = getScrollTop();
    this.requestTick();
  }

  handleWindowLoad() {
    this.cacheDimensions();
    if (this.hasScrolled === false) {
      this.handleWindowScroll();
    }
  }

  handleWindowResize() {
    this.cacheDimensions();
    this.destroy();
    this.handleWindowScroll();
  }

  render() {
    const activeSection = this.state.activeSection;
    const pathname = this.props.location.pathname;

    return (
      <nav className="article__nav">
        <div className="article__nav_mid below_nav" id="nav_outer">
          <div className="article__nav_inner">
            <div id="nav">
              <div className="article_nav" id="nav_inner">
                {docsList.map((section, index) => (
                  <div key={index}>
                    <h2 className={`article_nav__category_title ${activeSection === section ? 'is-current' : ''}`}>
                      <a onClick={() => this._onSectionHeaderClick(section)}>
                        {section.title}
                      </a>
                    </h2>
                    {activeSection === section && (
                      <ul className="vert_nav article_nav__list">
                        {section.items.map(item => (
                          <li
                            className="vert_nav__item"
                            key={item.id}
                          >
                            <Link
                              to={slugify(item.id)}
                              className={`vert_nav__link ${pathname.includes(slugify(item.id)) ? 'is-current' : ''}`}
                            >
                              <span className="vert_nav__text">
                                {item.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  _onSectionHeaderClick(section) {
    this.setState(state => ({
      activeSection: state.activeSection === section ? null : section
    }));
  }
}

export default Sidebar;

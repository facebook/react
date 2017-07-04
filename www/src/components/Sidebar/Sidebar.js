import React from 'react';
import {getDefaultActiveSection} from './utils';
import Section from './Section';
import styles from './Sidebar.module.scss';

// TODO (HACK) This data should be passed in as a parameter
import sectionList from '../../../../docs/_data/nav_docs.yml';

// TODO Support sticky behavior

class Sidebar extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      activeSection: getDefaultActiveSection(
        props.location.pathname,
        sectionList,
      ),
    };
  }

  render() {
    const activeSection = this.state.activeSection;
    const pathname = this.props.location.pathname;

    return (
      <nav className={styles.Sidebar}>
        {sectionList.map((section, index) => (
          <Section
            isActive={activeSection === section}
            key={index}
            onClick={() => this._toggleSection(section)}
            pathname={pathname}
            section={section}
          />
        ))}
      </nav>
    );
  }

  _toggleSection(section) {
    this.setState(state => ({
      activeSection: state.activeSection === section ? null : section,
    }));
  }
}

export default Sidebar;

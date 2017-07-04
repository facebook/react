import React from 'react';
import Section from './Section';
import styles from './Sidebar.module.scss';

class Sidebar extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      activeSection: props.defaultActiveSection,
    };
  }

  render() {
    const {location, sectionList} = this.props;
    const {activeSection} = this.state;

    return (
      <nav className={styles.Sidebar}>
        {sectionList.map((section, index) => (
          <Section
            isActive={activeSection === section}
            key={index}
            onClick={() => this._toggleSection(section)}
            pathname={location.pathname}
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

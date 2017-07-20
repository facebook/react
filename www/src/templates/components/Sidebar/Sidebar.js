import React from 'react';
import Flex from '../../../components/Flex';
import Section from './Section';

class Sidebar extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      activeSection: props.defaultActiveSection,
    };
  }

  render() {
    const {sectionList} = this.props;
    const {activeSection} = this.state;

    return (
      <Flex
        type="nav"
        direction="column"
        halign="stretch"
        css={{
          width: '100%',
          paddingLeft: '1rem',
        }}>
        {sectionList.map((section, index) => (
          <Section
            isActive={activeSection === section || sectionList.length === 1}
            key={index}
            onClick={() => this._toggleSection(section)}
            section={section}
          />
        ))}
      </Flex>
    );
  }

  _toggleSection(section) {
    this.setState(state => ({
      activeSection: state.activeSection === section ? null : section,
    }));
  }
}

export default Sidebar;

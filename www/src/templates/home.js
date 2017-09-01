/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import ButtonLink from './components/ButtonLink';
import Container from 'components/Container';
import Flex from 'components/Flex';
import mountCodeExample from 'utils/mountCodeExample';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {colors, media, sharedStyles} from 'theme';

class Home extends Component {
  componentDidMount() {
    mountCodeExample('helloExample', HELLO_COMPONENT);
    mountCodeExample('timerExample', TIMER_COMPONENT);
    mountCodeExample('todoExample', TODO_COMPONENT);
    mountCodeExample('markdownExample', MARKDOWN_COMPONENT);
  }

  render() {
    const {data} = this.props;

    return (
      <div css={{width: '100%'}}>
        <header
          css={{
            backgroundColor: colors.dark,
            color: colors.white,
          }}>
          <div
            css={{
              paddingTop: 45,
              paddingBottom: 20,

              [media.smallUp]: {
                paddingTop: 60,
                paddingBottom: 70,
              },

              [media.xlargeUp]: {
                paddingTop: 95,
                paddingBottom: 85,
                maxWidth: 1500, // Positioning of background logo
                marginLeft: 'auto',
                marginRight: 'auto',
                backgroundImage: 'url(/large-logo.svg)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '100% 100px',
                backgroundSize: '50% auto',
              },
            }}>
            <Container>
              <h1
                css={{
                  color: colors.brand,
                  textAlign: 'center',
                  margin: 0,
                  fontSize: 45,
                  [media.xsmall]: {
                    fontSize: 30,
                  },
                  [media.xlargeUp]: {
                    fontSize: 60,
                  },
                }}>
                React
              </h1>
              <p
                css={{
                  paddingTop: 15,
                  textAlign: 'center',
                  fontSize: 24,

                  [media.xsmall]: {
                    fontSize: 16,
                    maxWidth: '12em',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  },

                  [media.xlargeUp]: {
                    paddingTop: 20,
                    fontSize: 30,
                  },
                }}>
                A JavaScript library for building user interfaces
              </p>
              <Flex
                valign="center"
                css={{
                  paddingTop: 40,

                  [media.xlargeUp]: {
                    paddingTop: 65,
                  },
                }}>
                <CtaItem>
                  <ButtonLink to="/docs/hello-world.html" type="primary">
                    Get Started
                  </ButtonLink>
                </CtaItem>
                <CtaItem>
                  <ButtonLink to="/tutorial/tutorial.html" type="secondary">
                    Take the tutorial{' '}
                    <ArrowSvg />
                  </ButtonLink>
                </CtaItem>
              </Flex>
            </Container>
          </div>
        </header>

        <Container>
          <div
            css={[sharedStyles.markdown, markdownStyles]}
            dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
          />
        </Container>

        <section
          css={{
            background: colors.dark,
            color: colors.white,
            paddingTop: 45,
            paddingBottom: 45,
          }}>
          <Container>
            <Flex valign="center">
              <CtaItem>
                <ButtonLink to="/docs/hello-world.html" type="primary">
                  Get Started
                </ButtonLink>
              </CtaItem>
              <CtaItem>
                <ButtonLink to="/tutorial/tutorial.html" type="secondary">
                  Take the tutorial{' '}
                  <ArrowSvg />
                </ButtonLink>
              </CtaItem>
            </Flex>
          </Container>
        </section>
      </div>
    );
  }
}

Home.propTypes = {
  data: PropTypes.object.isRequired,
};

const CtaItem = ({children}) => (
  <div
    css={{
      width: '50%',
      paddingLeft: 20,

      [media.xlargeUp]: {
        paddingLeft: 40,
      },

      '&:first-child': {
        textAlign: 'right',
      },
    }}>
    {children}
  </div>
);

const ArrowSvg = () => (
  <svg
    height="12"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 4.53657 8.69699">
    <path
      d={`
        M.18254,8.697a.18149.18149,0,0,1-.12886-.31034L4.09723,4.34126.05369.29954a.18149.18149,
        0,0,1,.2559-.2559L4.4838,4.21785a.18149.18149,0,0,1,0,.2559L.30958,8.648A.18149.18149,
        0,0,1,.18254,8.697Z
      `}
      fill="currentColor"
    />
  </svg>
);

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query HomeMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`;

export default Home;

// TODO This nasty CSS is required because 'docs/index.md' defines hard-coded class names.
const markdownStyles = {
  '& .home-section': {
    marginTop: 60,
    marginBottom: 65,
  },

  '& .homeDivider': {
    height: 1,
    marginBottom: -1,
    border: 'none',
    borderBottom: `1 solid ${colors.divider}`,
  },

  '& .marketing-row': {
    display: 'flex',
    flexDirection: 'row',

    [media.mediumDown]: {
      flexDirection: 'column',
    },
  },

  '& .marketing-col': {
    display: 'flex',
    flexDirection: 'column',
    flex: '0 1 33%',
    marginLeft: 40,

    '&:first-of-type': {
      marginLeft: 0,
    },

    [media.mediumDown]: {
      display: 'block',
      marginTop: 40,
      marginLeft: 0,

      '&:first-of-type': {
        marginTop: 0,
      },
    },

    '& h3': {
      color: colors.subtle,

      [media.largeDown]: {
        fontSize: 18,
        fontWeight: 400,
      },

      [media.xlargeUp]: {
        fontSize: 24,
        fontWeight: 500,
      },
    },
  },

  '& .example': {
    marginTop: 80,
  },
};

// TODO Move these hard-coded examples into example files and out of the template?
// Alternately, move them into the markdown and transform them during build?
const HELLO_COMPONENT = `
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}

ReactDOM.render(<HelloMessage name="Devin" />, mountNode);
`.trim();

const TIMER_COMPONENT = `
class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {secondsElapsed: 0};
  }

  tick() {
    this.setState((prevState) => ({
      secondsElapsed: prevState.secondsElapsed + 1
    }));
  }

  componentDidMount() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div>Seconds Elapsed: {this.state.secondsElapsed}</div>
    );
  }
}

ReactDOM.render(<Timer />, mountNode);
`.trim();

var TODO_COMPONENT = `
class TodoApp extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {items: [], text: ''};
  }

  render() {
    return (
      <div>
        <h3>TODO</h3>
        <TodoList items={this.state.items} />
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.handleChange} value={this.state.text} />
          <button>{'Add #' + (this.state.items.length + 1)}</button>
        </form>
      </div>
    );
  }

  handleChange(e) {
    this.setState({text: e.target.value});
  }

  handleSubmit(e) {
    e.preventDefault();
    var newItem = {
      text: this.state.text,
      id: Date.now()
    };
    this.setState((prevState) => ({
      items: prevState.items.concat(newItem),
      text: ''
    }));
  }
}

class TodoList extends React.Component {
  render() {
    return (
      <ul>
        {this.props.items.map(item => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    );
  }
}

ReactDOM.render(<TodoApp />, mountNode);
`.trim();

var MARKDOWN_COMPONENT = `
class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {value: 'Type some *markdown* here!'};
  }

  handleChange(e) {
    this.setState({value: e.target.value});
  }

  getRawMarkup() {
    var md = new Remarkable();
    return { __html: md.render(this.state.value) };
  }

  render() {
    return (
      <div className="MarkdownEditor">
        <h3>Input</h3>
        <textarea
          onChange={this.handleChange}
          defaultValue={this.state.value}
        />
        <h3>Output</h3>
        <div
          className="content"
          dangerouslySetInnerHTML={this.getRawMarkup()}
        />
      </div>
    );
  }
}

ReactDOM.render(<MarkdownEditor />, mountNode);
`.trim();

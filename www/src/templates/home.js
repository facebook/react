/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
import TitleAndMetaTags from 'components/TitleAndMetaTags';
import {colors, media, sharedStyles} from 'theme';
import createOgUrl from 'utils/createOgUrl';

class Home extends Component {
  componentDidMount() {
    mountCodeExample('helloExample', HELLO_COMPONENT);
    mountCodeExample('timerExample', TIMER_COMPONENT);
    mountCodeExample('todoExample', TODO_COMPONENT);
    mountCodeExample('markdownExample', MARKDOWN_COMPONENT);
  }

  render() {
    const {data} = this.props;
    const title = 'React - A JavaScript library for building user interfaces';

    return (
      <div css={{width: '100%'}}>
        <TitleAndMetaTags
          title={title}
          ogUrl={createOgUrl(data.markdownRemark.fields.slug)}
        />
        <header
          css={{
            backgroundColor: colors.dark,
            color: colors.white,
          }}>
          <div
            css={{
              paddingTop: 45,
              paddingBottom: 20,

              [media.greaterThan('small')]: {
                paddingTop: 60,
                paddingBottom: 70,
              },

              [media.greaterThan('xlarge')]: {
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
                  [media.size('xsmall')]: {
                    fontSize: 30,
                  },
                  [media.greaterThan('xlarge')]: {
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

                  [media.size('xsmall')]: {
                    fontSize: 16,
                    maxWidth: '12em',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  },

                  [media.greaterThan('xlarge')]: {
                    paddingTop: 20,
                    fontSize: 30,
                    fontWeight: 300,
                  },
                }}>
                A JavaScript library for building user interfaces
              </p>
              <Flex
                valign="center"
                css={{
                  paddingTop: 40,

                  [media.greaterThan('xlarge')]: {
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
                    Take the Tutorial
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
                  Take the Tutorial
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
  location: PropTypes.object.isRequired,
};

const CtaItem = ({children, primary = false}) => (
  <div
    css={{
      width: '50%',

      [media.between('small', 'large')]: {
        paddingLeft: 20,
      },

      [media.greaterThan('xlarge')]: {
        paddingLeft: 40,
      },

      '&:first-child': {
        textAlign: 'right',
        paddingRight: 15,
      },

      '&:nth-child(2)': {
        [media.greaterThan('small')]: {
          paddingLeft: 15,
        },
      },
    }}>
    {children}
  </div>
);

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query HomeMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
      fields {
        slug
      }
    }
  }
`;

export default Home;

// TODO This nasty CSS is required because 'docs/index.md' defines hard-coded class names.
const markdownStyles = {
  '& .home-section': {
    marginTop: 20,
    marginBottom: 15,

    [media.greaterThan('medium')]: {
      marginTop: 60,
      marginBottom: 65,
    },
  },

  '& .home-section:first-child': {
    [media.lessThan('medium')]: {
      marginTop: 0,
      marginBottom: 0,
      overflowX: 'auto',
      paddingTop: 30,
      WebkitOverflowScrolling: 'touch',
      position: 'relative',
      maskImage: 'linear-gradient(to right, transparent, white 10px, white 90%, transparent)',
    },
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

    [media.lessThan('medium')]: {
      display: 'block',
      whiteSpace: 'nowrap',
    },
  },

  '& .marketing-col': {
    display: 'flex',
    flexDirection: 'column',
    flex: '0 1 33%',
    marginLeft: 40,

    '&:first-of-type': {
      marginLeft: 0,

      [media.lessThan('medium')]: {
        marginLeft: 10,
      },
    },

    [media.lessThan('medium')]: {
      display: 'inline-block',
      verticalAlign: 'top',
      marginLeft: 0,
      whiteSpace: 'normal',
      width: '75%',
      marginRight: 20,
      paddingBottom: 40,

      '&:first-of-type': {
        marginTop: 0,
      },
    },

    '& h3': {
      color: colors.subtle,
      paddingTop: 0,

      [media.lessThan('large')]: {
        fontSize: 18,
        fontWeight: 400,
      },

      [media.greaterThan('xlarge')]: {
        fontSize: 24,
        fontWeight: 400,
      },
    },

    '& p': {
      lineHeight: 1.7,
    },

    '& h3 + p': {
      marginTop: 20,
    },
  },

  '& .example': {
    marginTop: 40,

    '&:first-child': {
      marginTop: 0,
    },

    [media.greaterThan('xlarge')]: {
      marginTop: 80,
    },
  },
};

// TODO Move these hard-coded examples into example files and out of the template?
// Alternately, move them into the markdown and transform them during build?
const name = Math.random() > 0.5 ? 'John' : 'Jane';
const HELLO_COMPONENT = `
class HelloMessage extends React.Component {
  render() {
    return (
      <div>
        Hello {this.props.name}
      </div>
    );
  }
}

ReactDOM.render(
  <HelloMessage name="${name}" />,
  mountNode
);
`.trim();

const TIMER_COMPONENT = `
class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { seconds: 0 };
  }

  tick() {
    this.setState((prevState) => ({
      seconds: prevState.seconds + 1
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
      <div>
        Seconds: {this.state.seconds}
      </div>
    );
  }
}

ReactDOM.render(<Timer />, mountNode);
`.trim();

var TODO_COMPONENT = `
class TodoApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { items: [], text: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (
      <div>
        <h3>TODO</h3>
        <TodoList items={this.state.items} />
        <form onSubmit={this.handleSubmit}>
          <input
            onChange={this.handleChange}
            value={this.state.text}
          />
          <button>
            Add #{this.state.items.length + 1}
          </button>
        </form>
      </div>
    );
  }

  handleChange(e) {
    this.setState({ text: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    const newItem = {
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
    this.state = { value: 'Type some *markdown* here!' };
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  getRawMarkup() {
    const md = new Remarkable();
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

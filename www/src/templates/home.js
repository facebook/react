import ButtonLink from './components/ButtonLink';
import CodeEditor from './components/CodeEditor';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

// TODO The non-markdown portions of this page won't get localized currently.

// TODO Split '.marketing-row .marketing-col' into tabs?

// TODO This is a huge hack.
// Remark transform this template to split code examples and their targets apart.
const mount = (containerId, code) => {
  const container = document.getElementById(containerId);
  const parent = container.parentElement;

  const children = Array.prototype.filter.call(
    parent.children,
    child => child !== container,
  );
  children.forEach(child => parent.removeChild(child));

  const description = children
    .map(child => child.outerHTML)
    .join('')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  ReactDOM.render(
    <CodeEditor code={code}>
      {<div dangerouslySetInnerHTML={{__html: description}} />}
    </CodeEditor>,
    container,
  );
};

class Home extends React.Component {
  componentDidMount() {
    mount('helloExample', HELLO_COMPONENT);
    mount('timerExample', TIMER_COMPONENT);
    mount('todoExample', TODO_COMPONENT);
    mount('markdownExample', MARKDOWN_COMPONENT);
  }

  render() {
    const {data} = this.props;
    console.log(this.props, data);
    return (
      <div>
        <div className="home">
          <header className="hero">
            <div className="hero__inner">
              <div className="wrapper">
                <h1 className="hero__title">React</h1>
                <p className="hero__subtitle">
                  A JavaScript library for building user interfaces
                </p>
                <div className="hero__cta_group cta_group">
                  <div className="cta_group__item">
                    <ButtonLink to="/docs/hello-world.html" type="primary">
                      Get Started
                    </ButtonLink>
                  </div>
                  <div className="cta_group__item">
                    <ButtonLink to="/tutorial/tutorial.html" type="secondary">
                      Take the tutorial{' '}
                      <ArrowSvg />
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div
            className="wrapper article__inner"
            dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
          />
        </div>
        <section className="prefooter_nav">
          <div className="wrapper">
            <div className="cta_group">
              <div className="cta_group__item">
                <ButtonLink to="/docs/hello-world.html" type="primary">
                  Get Started
                </ButtonLink>
              </div>
              <div className="cta_group__item">
                <ButtonLink to="/tutorial/tutorial.html" type="secondary">
                  Take the tutorial{' '}
                  <ArrowSvg />
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

Home.propTypes = {
  data: PropTypes.object.isRequired,
};

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

const ArrowSvg = () => (
  <svg
    height="12"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 4.53657 8.69699"
  >
    <path
      d="M.18254,8.697a.18149.18149,0,0,1-.12886-.31034L4.09723,4.34126.05369.29954a.18149.18149,0,0,1,.2559-.2559L4.4838,4.21785a.18149.18149,0,0,1,0,.2559L.30958,8.648A.18149.18149,0,0,1,.18254,8.697Z"
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

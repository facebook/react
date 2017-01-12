import React, { Component } from 'react';
import Draggable from 'react-draggable';
import ReactNoop from 'react-noop-renderer';
import ReactFiberInstrumentation from 'react-noop-renderer/lib/ReactFiberInstrumentation';
import Editor from './Editor';
import Fibers from './Fibers';
import describeFibers from './describeFibers';

function getFiberState(root, workInProgress) {
  if (!root) {
    return null;
  }
  return describeFibers(root.current, workInProgress);
}

const defaultCode = `
log('Render <div>Hello</div>');
ReactNoop.render(<div>Hello</div>);
ReactNoop.flush();

log('Render <h1>Goodbye</h1>');
ReactNoop.render(<h1>Goodbye</h1>);
ReactNoop.flush();
`;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: localStorage.getItem('fiber-debugger-code') || defaultCode,
      isEditing: false,
      history: [],
      currentStep: 0,
      show: {
        alt: false,
        child: true,
        sibling: true,
        return: false,
        fx: false,
        progressedChild: false,
        progressedDel: false
      }
    };
  }

  componentDidMount() {
    this.runCode(this.state.code);
  }

  runCode(code) {
    let currentStage;
    let currentRoot;

    ReactFiberInstrumentation.debugTool = null;
    ReactNoop.render(null);
    ReactNoop.flush();
    ReactFiberInstrumentation.debugTool = {
      onMountContainer: (root) => {
        currentRoot = root;
      },
      onUpdateContainer: (root) => {
        currentRoot = root;
      },
      onWillBeginWork: (fiber) => {
        const fibers = getFiberState(currentRoot, fiber);
        const stage = currentStage;
        this.setState(({ history }) => ({
          history: [
            ...history, {
              action: 'willBeginWork',
              fibers,
              stage
            }
          ]
        }));
      },
      onDidBeginWork: (fiber) => {
        const fibers = getFiberState(currentRoot, fiber);
        const stage = currentStage;
        this.setState(({ history }) => ({
          history: [
            ...history, {
              action: 'didBeginWork',
              fibers,
              stage
            }
          ]
        }));
      },
      onWillCompleteWork: (fiber) => {
        const fibers = getFiberState(currentRoot, fiber);
        const stage = currentStage;
        this.setState(({ history }) => ({
          history: [
            ...history, {
              action: 'willCompleteWork',
              fibers,
              stage
            }
          ]
        }));
      },
      onDidCompleteWork: (fiber) => {
        const fibers = getFiberState(currentRoot, fiber);
        const stage = currentStage;
        this.setState(({ history }) => ({
          history: [
            ...history, {
              action: 'didCompleteWork',
              fibers,
              stage
            }
          ]
        }));
      },
    };
    window.React = React;
    window.ReactNoop = ReactNoop;
    window.log = s => currentStage = s;
    // eslint-disable-next-line
    eval(window.Babel.transform(code, {
      presets: ['react', 'es2015']
    }).code);
  }

  handleEdit = (e) => {
    e.preventDefault();
    this.setState({
      isEditing: true
    });
  }

  handleCloseEdit = (nextCode) => {
    localStorage.setItem('fiber-debugger-code', nextCode);
    this.setState({
      isEditing: false,
      history: [],
      currentStep: 0,
      code: nextCode
    });
    this.runCode(nextCode);
  }

  render() {
    const { history, currentStep, isEditing, code } = this.state;
    if (isEditing) {
      return <Editor code={code} onClose={this.handleCloseEdit} />;
    }

    const { fibers, action, stage } = history[currentStep] || {};
    let friendlyAction;

    if (fibers) {
      let wipFiber = fibers.descriptions[fibers.workInProgressID];
      let friendlyFiber = wipFiber.type || wipFiber.tag + ' #' + wipFiber.id;
      switch (action) {
        case 'willBeginWork':
          friendlyAction = 'Before BEGIN phase on ' + friendlyFiber;
          break;
        case 'didBeginWork':
          friendlyAction = 'After BEGIN phase on ' + friendlyFiber;
          break;
        case 'willCompleteWork':
          friendlyAction = 'Before COMPLETE phase on ' + friendlyFiber;
          break;
        case 'didCompleteWork':
          friendlyAction = 'After COMPLETE phase on ' + friendlyFiber;
          break;
        default:
          throw new Error('Unknown action');
      }
    }

    return (
      <div style={{ height: '100%' }}>
        {fibers &&
          <Draggable>
            <Fibers fibers={fibers} show={this.state.show} />
          </Draggable>
        }
        <div style={{
          width: '100%',
          textAlign: 'center',
          position: 'fixed',
          bottom: 0,
          padding: 10,
          zIndex: 1,
          backgroundColor: '#fafafa',
          border: '1px solid #ccc'
        }}>
          <input
            type="range"
            min={0}
            max={history.length - 1}
            value={currentStep}
            onChange={e => this.setState({ currentStep: Number(e.target.value) })}
          />
          <p>Step {currentStep}: {friendlyAction} (<a style={{ color: 'gray' }} onClick={this.handleEdit} href='#'>Edit</a>)</p>
          {stage && <p>Stage: {stage}</p>}
          {Object.keys(this.state.show).map(key =>
            <label style={{ marginRight: '10px' }} key={key}>
              <input
                type="checkbox"
                checked={this.state.show[key]}
                onChange={e => {
                  this.setState(({ show }) => ({
                    show: {...show, [key]: !show[key]}
                  }));
                }} />
              {key}
            </label>
          )}
        </div>
      </div>
    );
  }
}

export default App;

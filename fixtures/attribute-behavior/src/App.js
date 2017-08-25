import {createElement} from 'glamor/react'; // eslint-disable-line
/* @jsx createElement */

import {MultiGrid, AutoSizer} from 'react-virtualized';
import 'react-virtualized/styles.css';

import {
  inject as injectErrorOverlay,
  uninject as uninjectErrorOverlay,
} from 'react-error-overlay/lib/overlay';

import {
  attributes,
  types,
  getRenderedAttributeValue,
} from './attributeBehavior';

const React = global.React;
const {Component} = React;

const React15 = global.React15;
const ReactDOM15 = global.ReactDOM15;
const React16 = React;
const ReactDOM16 = global.ReactDOM;

function getRenderedAttributeValues(attribute, type) {
  const react15Value = getRenderedAttributeValue(
    React15,
    ReactDOM15,
    attribute,
    type,
  );
  const react16Value = getRenderedAttributeValue(
    React16,
    ReactDOM16,
    attribute,
    type,
  );

  let hasSameBehavior;
  if (react15Value.didError && react16Value.didError) {
    hasSameBehavior = true;
  } else if (!react15Value.didError && !react16Value.didError) {
    hasSameBehavior =
      react15Value.didWarn === react16Value.didWarn &&
      Object.is(react15Value.result, react16Value.result);
  } else {
    hasSameBehavior = false;
  }

  return {
    react15: react15Value,
    react16: react16Value,
    hasSameBehavior,
  };
}

const table = new Map();

// Disable error overlay while test each attribute
uninjectErrorOverlay();
for (let attribute of attributes) {
  const row = new Map();
  for (let type of types) {
    const result = getRenderedAttributeValues(attribute, type);
    row.set(type.name, result);
  }
  table.set(attribute, row);
}
// Renable error overlay
injectErrorOverlay();

const successColor = 'white';
const warnColor = 'yellow';
const errorColor = 'red';

function RendererResult({version, result, defaultValue, didWarn, didError}) {
  let backgroundColor;
  if (didError) {
    backgroundColor = errorColor;
  } else if (didWarn) {
    backgroundColor = warnColor;
  } else if (result !== defaultValue) {
    backgroundColor = 'cyan';
  } else {
    backgroundColor = successColor;
  }

  let style = {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    height: '100%',
    width: '100%',
    backgroundColor,
  };

  let displayResult;
  switch (typeof result) {
    case 'undefined':
      displayResult = '<undefined>';
      break;
    case 'object':
      if (result === null) {
        displayResult = '<null>';
        break;
      }
      displayResult = '<object>';
      break;
    case 'function':
      displayResult = '<function>';
      break;
    case 'symbol':
      displayResult = '<symbol>';
      break;
    case 'number':
      displayResult = `<number: ${result}>`;
      break;
    case 'string':
      if (result === '') {
        displayResult = '<empty string>';
        break;
      }
      displayResult = '"' + result + '"';
      break;
    case 'boolean':
      displayResult = `<boolean: ${result}>`;
      break;
    default:
      throw new Error('Switch statement should be exhaustive.');
  }

  return <div css={style}>{displayResult}</div>;
}

function ResultPopover(props) {
  return (
    <pre
      css={{
        padding: '1em',
        width: '25em',
      }}>
      {JSON.stringify(
        {
          react15: props.react15,
          react16: props.react16,
          hasSameBehavior: props.hasSameBehavior,
        },
        null,
        2,
      )}
    </pre>
  );
}

class Result extends React.Component {
  state = {showInfo: false};
  onMouseEnter = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.setState({showInfo: true});
    }, 250);
  };
  onMouseLeave = () => {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.setState({showInfo: false});
  };

  componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.interval);
    }
  }

  render() {
    const {react15, react16, hasSameBehavior} = this.props;
    const style = {
      position: 'absolute',
      width: '100%',
      height: '100%',
    };

    let highlight = null;
    let popover = null;
    if (this.state.showInfo) {
      highlight = (
        <div
          css={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            border: '2px solid blue',
          }}
        />
      );

      popover = (
        <div
          css={{
            backgroundColor: 'white',
            border: '1px solid black',
            position: 'absolute',
            top: '100%',
            zIndex: 999,
          }}>
          <ResultPopover {...this.props} />
        </div>
      );
    }

    if (!hasSameBehavior) {
      style.border = '4px solid purple';
    }
    return (
      <div
        css={style}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
        <div css={{position: 'absolute', width: '50%', height: '100%'}}>
          <RendererResult version={15} {...react15} />
        </div>
        <div
          css={{
            position: 'absolute',
            width: '50%',
            left: '50%',
            height: '100%',
          }}>
          <RendererResult version={16} {...react16} />
        </div>
        {highlight}
        {popover}
      </div>
    );
  }
}

function ColumnHeader({children}) {
  return (
    <div
      css={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}>
      {children}
    </div>
  );
}

function RowHeader({children}) {
  return (
    <div
      css={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}>
      {children}
    </div>
  );
}

function CellContent(props) {
  const {columnIndex, rowIndex} = props;

  const attribute = attributes[rowIndex - 1];
  const type = types[columnIndex - 1];

  if (columnIndex === 0) {
    if (rowIndex === 0) {
      return null;
    }
    return <RowHeader>{attribute.name}</RowHeader>;
  }

  if (rowIndex === 0) {
    return <ColumnHeader>{type.name}</ColumnHeader>;
  }

  const row = table.get(attribute);
  const result = row.get(type.name);

  return <Result {...result} />;
}

function cellRenderer(props) {
  return <div style={props.style}><CellContent {...props} /></div>;
}

class App extends Component {
  render() {
    return (
      <AutoSizer disableHeight={true}>
        {({width}) => (
          <MultiGrid
            cellRenderer={cellRenderer}
            columnWidth={200}
            columnCount={1 + types.length}
            fixedColumnCount={1}
            enableFixedColumnScroll={true}
            enableFixedRowScroll={true}
            height={1200}
            rowHeight={40}
            rowCount={attributes.length + 1}
            fixedRowCount={1}
            width={width}
          />
        )}
      </AutoSizer>
    );
  }
}

export default App;

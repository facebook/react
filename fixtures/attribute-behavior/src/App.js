import {createElement} from 'glamor/react'; // eslint-disable-line
/* @jsx createElement */

import {
  getRenderedAttributeValue,
  attributes,
  types,
} from './attributeBehavior';

import {MultiGrid, AutoSizer} from 'react-virtualized';
import 'react-virtualized/styles.css';

import {
  inject as injectErrorOverlay,
  uninject as uninjectErrorOverlay,
} from 'react-error-overlay/lib/overlay';

const React = global.React;
const {Component} = React;

const ReactDOM15 = global.ReactDOM15;
const ReactDOM16 = global.ReactDOM16;

const ReactDOMServer15 = global.ReactDOMServer15;
const ReactDOMServer16 = global.ReactDOMServer16;

function getRenderedAttributeValues(attribute, type) {
  const react15Value = getRenderedAttributeValue(
    React,
    ReactDOM15,
    ReactDOMServer15,
    attribute,
    type
  );
  const react16Value = getRenderedAttributeValue(
    React,
    ReactDOM16,
    ReactDOMServer16,
    attribute,
    type
  );

  let hasSameBehavior;
  if (react15Value.didError && react16Value.didError) {
    hasSameBehavior = true;
  } else if (!react15Value.didError && !react16Value.didError) {
    hasSameBehavior =
      react15Value.didWarn === react16Value.didWarn &&
      react15Value.canonicalResult === react16Value.canonicalResult &&
      react15Value.ssrHasSameBehavior === react16Value.ssrHasSameBehavior;
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
const rowPatternHashes = new Map();

// Disable error overlay while testing each attribute
uninjectErrorOverlay();
for (let attribute of attributes) {
  const results = new Map();
  let hasSameBehaviorForAll = true;
  let rowPatternHash = '';
  for (let type of types) {
    const result = getRenderedAttributeValues(attribute, type);
    results.set(type.name, result);
    if (!result.hasSameBehavior) {
      hasSameBehaviorForAll = false;
    }
    rowPatternHash += [result.react15, result.react16]
      .map(res =>
        [
          res.canonicalResult,
          res.canonicalDefaultValue,
          res.didWarn,
          res.didError,
        ].join('||')
      )
      .join('||');
  }
  const row = {
    results,
    hasSameBehaviorForAll,
    rowPatternHash,
    // "Good enough" id that we can store in localStorage
    rowIdHash: `${attribute.name} ${attribute.tagName} ${attribute.overrideStringValue}`,
  };
  const rowGroup = rowPatternHashes.get(rowPatternHash) || new Set();
  rowGroup.add(row);
  rowPatternHashes.set(rowPatternHash, rowGroup);
  table.set(attribute, row);
}

// Renable error overlay
injectErrorOverlay();

const ALPHABETICAL = 'alphabetical';
const REV_ALPHABETICAL = 'reverse_alphabetical';
const GROUPED_BY_ROW_PATTERN = 'grouped_by_row_pattern';

const ALL = 'all';
const COMPLETE = 'complete';
const INCOMPLETE = 'incomplete';

const successColor = 'white';
const warnColor = 'yellow';
const errorColor = 'red';

function RendererResult({
  version,
  result,
  canonicalResult,
  defaultValue,
  canonicalDefaultValue,
  didWarn,
  didError,
  ssrHasSameBehavior,
  ssrHasSameBehaviorExceptWarnings,
}) {
  let backgroundColor;
  if (didError) {
    backgroundColor = errorColor;
  } else if (didWarn) {
    backgroundColor = warnColor;
  } else if (canonicalResult !== canonicalDefaultValue) {
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

  if (!ssrHasSameBehavior) {
    const color = ssrHasSameBehaviorExceptWarnings ? 'gray' : 'magenta';
    style.border = `3px dotted ${color}`;
  }

  return <div css={style}>{canonicalResult}</div>;
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
        2
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

function RowHeader({children, checked, onChange}) {
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
      <input type="checkbox" checked={checked} onChange={onChange} />
    </div>
  );
}

function CellContent(props) {
  const {
    columnIndex,
    rowIndex,
    attributesInSortedOrder,
    completedHashes,
    toggleAttribute,
  } = props;
  const attribute = attributesInSortedOrder[rowIndex - 1];
  const type = types[columnIndex - 1];

  if (columnIndex === 0) {
    if (rowIndex === 0) {
      return null;
    }
    const row = table.get(attribute);
    const rowPatternHash = row.rowPatternHash;
    return (
      <RowHeader
        checked={completedHashes.has(rowPatternHash)}
        onChange={() => toggleAttribute(rowPatternHash)}>
        {row.hasSameBehaviorForAll
          ? attribute.name
          : <b css={{color: 'purple'}}>{attribute.name}</b>}
      </RowHeader>
    );
  }

  if (rowIndex === 0) {
    return <ColumnHeader>{type.name}</ColumnHeader>;
  }

  const row = table.get(attribute);
  const result = row.results.get(type.name);

  return <Result {...result} />;
}

function saveToLocalStorage(completedHashes) {
  const str = JSON.stringify([...completedHashes]);
  localStorage.setItem('completedHashes', str);
}

function restoreFromLocalStorage() {
  const str = localStorage.getItem('completedHashes');
  if (str) {
    const completedHashes = new Set(JSON.parse(str));
    return completedHashes;
  }
  return new Set();
}

class App extends Component {
  state = {
    sortOrder: ALPHABETICAL,
    filter: ALL,
    completedHashes: restoreFromLocalStorage(),
  };

  renderCell = props => {
    return (
      <div style={props.style}>
        <CellContent
          toggleAttribute={this.toggleAttribute}
          completedHashes={this.state.completedHashes}
          attributesInSortedOrder={this.attributes}
          {...props}
        />
      </div>
    );
  };

  onUpdateSort = e => {
    this.setState({sortOrder: e.target.value});
  };

  onUpdateFilter = e => {
    this.setState({filter: e.target.value});
  };

  toggleAttribute = rowPatternHash => {
    const completedHashes = new Set(this.state.completedHashes);
    if (completedHashes.has(rowPatternHash)) {
      completedHashes.delete(rowPatternHash);
    } else {
      completedHashes.add(rowPatternHash);
    }
    this.setState({completedHashes}, () => saveToLocalStorage(completedHashes));
  };

  componentWillMount() {
    this.attributes = this.getAttributes(
      this.state.sortOrder,
      this.state.filter
    );
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      nextState.sortOrder !== this.state.sortOrder ||
      nextState.filter !== this.state.filter ||
      nextState.completedHashes !== this.state.completedHashes
    ) {
      this.attributes = this.getAttributes(
        nextState.sortOrder,
        nextState.filter,
        nextState.completedHashes
      );
      this.grid.forceUpdateGrids();
    }
  }

  getAttributes(sortOrder, filter, completedHashes) {
    // Filter
    let filteredAttributes;
    switch (filter) {
      case ALL:
        filteredAttributes = attributes.filter(() => true);
        break;
      case COMPLETE:
        filteredAttributes = attributes.filter(attribute => {
          const row = table.get(attribute);
          return completedHashes.has(row.rowPatternHash);
        });
        break;
      case INCOMPLETE:
        filteredAttributes = attributes.filter(attribute => {
          const row = table.get(attribute);
          return !completedHashes.has(row.rowPatternHash);
        });
        break;
      default:
        throw new Error('Switch statement should be exhuastive');
    }

    // Sort
    switch (sortOrder) {
      case ALPHABETICAL:
        return filteredAttributes.sort(
          (attr1, attr2) => (attr1.name < attr2.name ? -1 : 1)
        );
      case REV_ALPHABETICAL:
        return filteredAttributes.sort(
          (attr1, attr2) => (attr1.name < attr2.name ? 1 : -1)
        );
      case GROUPED_BY_ROW_PATTERN: {
        return filteredAttributes.sort((attr1, attr2) => {
          const row1 = table.get(attr1);
          const row2 = table.get(attr2);
          const patternGroup1 = rowPatternHashes.get(row1.rowPatternHash);
          const patternGroupSize1 = (patternGroup1 && patternGroup1.size) || 0;
          const patternGroup2 = rowPatternHashes.get(row2.rowPatternHash);
          const patternGroupSize2 = (patternGroup2 && patternGroup2.size) || 0;
          return patternGroupSize2 - patternGroupSize1;
        });
      }
      default:
        throw new Error('Switch statement should be exhuastive');
    }
  }

  render() {
    return (
      <div>
        <div>
          <select onChange={this.onUpdateSort}>
            <option
              selected={this.state.sortOrder === ALPHABETICAL}
              value={ALPHABETICAL}>
              alphabetical
            </option>
            <option
              selected={this.state.sortOrder === REV_ALPHABETICAL}
              value={REV_ALPHABETICAL}>
              reverse alphabetical
            </option>
            <option
              selected={this.state.sortOrder === GROUPED_BY_ROW_PATTERN}
              value={GROUPED_BY_ROW_PATTERN}>
              grouped by row pattern :)
            </option>
          </select>
          <select onChange={this.onUpdateFilter}>
            <option selected={this.state.sortOrder === ALL} value={ALL}>
              all
            </option>
            <option
              selected={this.state.sortOrder === INCOMPLETE}
              value={INCOMPLETE}>
              incomplete
            </option>
            <option
              selected={this.state.sortOrder === COMPLETE}
              value={COMPLETE}>
              complete
            </option>
          </select>
        </div>
        <AutoSizer disableHeight={true}>
          {({width}) => (
            <MultiGrid
              ref={input => {
                this.grid = input;
              }}
              cellRenderer={this.renderCell}
              columnWidth={200}
              columnCount={1 + types.length}
              fixedColumnCount={1}
              enableFixedColumnScroll={true}
              enableFixedRowScroll={true}
              height={1200}
              rowHeight={40}
              rowCount={this.attributes.length + 1}
              fixedRowCount={1}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default App;

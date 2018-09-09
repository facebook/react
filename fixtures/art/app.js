'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var VectorWidget = require('./VectorWidget');

class App extends React.Component {
    render() {
        return (
            <React.Fragment>
                <VectorWidget />
                <VectorWidget mode="svg" />
            </React.Fragment>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('container'));
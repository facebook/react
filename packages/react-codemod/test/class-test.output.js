'use strict';

var React = require('React');
var Relay = require('Relay');

var Image = require('Image.react');

/*
 * Multiline
 */
class MyComponent extends React.Component {
  constructor(props, context) {
    super(props, context);
    var x = props.foo;

    this.state = {
      heyoo: 23,
    };
  }

  foo() {
    this.setState({heyoo: 24});
  }
}

// Class comment
class MyComponent2 extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.foo = this.foo.bind(this);
  }

  foo() {
    pass(this.foo);
    this.forceUpdate();
  }
}

MyComponent2.defaultProps = {a: 1};

class MyComponent3 extends React.Component {
  constructor(props, context) {
    super(props, context);
    this._renderRange = this._renderRange.bind(this);
    this._renderText = this._renderText.bind(this);
    this.autobindMe = this.autobindMe.bind(this);
    props.foo();

    this.state = {
      heyoo: 23,
    };
  }

  _renderText(text) {
    return <Text text={text} />;
  }

  _renderImageRange(text, range) {
    var image = range.image;
    if (image) {
      return (
        <Image
          src={image.uri}
          height={image.height / image.scale}
          width={image.width / image.scale}
        />
      );
    }
  }

  autobindMe() {}
  dontAutobindMe() {}

  // Function comment
  _renderRange(text, range) {
    var self = this;

    self.dontAutobindMe();
    call(self.autobindMe);

    var type = rage.type;
    var {highlightEntities} = this.props;

    if (type === 'ImageAtRange') {
      return this._renderImageRange(text, range);
    }

    if (this.props.linkifyEntities) {
      text =
        <Link href={usersURI}>
          {text}
        </Link>;
    } else {
      text = <span>{text}</span>;
    }

    return text;
  }

  /* This is a comment */
  render() {
    var content = this.props.text;
    return (
      <BaseText
        {...this.props}
        textRenderer={this._renderText}
        rangeRenderer={this._renderRange}
        text={content.text}
      />
    );
  }
}

MyComponent3.defaultProps = function() {
  foo();
  return {
    linkifyEntities: true,
    highlightEntities: false
  };
}();

MyComponent3.foo = function() {};

MyComponent3.propTypes = {
  highlightEntities: React.PropTypes.bool,
  linkifyEntities: React.PropTypes.bool,
  text: React.PropTypes.shape({
    text: React.PropTypes.string,
    ranges: React.PropTypes.array
  }).isRequired
};

MyComponent3.someThing = 10;

var MyComponent4 = React.createClass({
  foo: callMeMaybe(),
  render: function() {},
});

module.exports = Relay.createContainer(MyComponent, {
  queries: {
    me: Relay.graphql`this is not graphql`,
  }
});

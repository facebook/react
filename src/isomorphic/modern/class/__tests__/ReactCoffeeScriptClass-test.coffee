###
Copyright 2015-present, Facebook, Inc.
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. An additional grant
of patent rights can be found in the PATENTS file in the same directory.
###

React = null
ReactDOM = null
PropTypes = null

describe 'ReactCoffeeScriptClass', ->
  div = null
  span = null
  container = null
  Inner = null
  attachedListener = null;
  renderedName = null;

  beforeEach ->
    React = require 'react'
    ReactDOM = require 'react-dom'
    PropTypes = require 'prop-types'
    container = document.createElement 'div'
    attachedListener = null
    renderedName = null
    div = React.createFactory 'div'
    span = React.createFactory 'span'
    class InnerComponent extends React.Component
      getName: -> this.props.name
      render: ->
        attachedListener = this.props.onClick
        renderedName = this.props.name
        return div className: this.props.name
    Inner = React.createFactory InnerComponent

  test = (element, expectedTag, expectedClassName) ->
    instance = ReactDOM.render(element, container)
    expect(container.firstChild).not.toBeNull()
    expect(container.firstChild.tagName).toBe(expectedTag)
    expect(container.firstChild.className).toBe(expectedClassName)
    instance;

  it 'preserves the name of the class for use in error messages', ->
    class Foo extends React.Component
    expect(Foo.name).toBe 'Foo'

  it 'throws if no render function is defined', ->
    spyOn console, 'error'
    class Foo extends React.Component
    expect(->
      ReactDOM.render React.createElement(Foo), container
    ).toThrow()
    expect(console.error.calls.count()).toBe(1)
    expect(console.error.calls.argsFor(0)[0]).toContain('No `render` method found on the returned component instance')
    undefined

  it 'renders a simple stateless component with prop', ->
    class Foo extends React.Component
      render: ->
        Inner
          name: @props.bar

    test React.createElement(Foo, bar: 'foo'), 'DIV', 'foo'
    test React.createElement(Foo, bar: 'bar'), 'DIV', 'bar'
    undefined

  it 'renders based on state using initial values in this.props', ->
    class Foo extends React.Component
      constructor: (props) ->
        super props
        @state = bar: @props.initialValue

      render: ->
        span
          className: @state.bar

    test React.createElement(Foo, initialValue: 'foo'), 'SPAN', 'foo'
    undefined

  it 'renders based on state using props in the constructor', ->
    class Foo extends React.Component
      constructor: (props) ->
        @state = bar: props.initialValue

      changeState: ->
        @setState bar: 'bar'

      render: ->
        if @state.bar is 'foo'
          return div(
            className: 'foo'
          )
        span
          className: @state.bar

    instance = test React.createElement(Foo, initialValue: 'foo'), 'DIV', 'foo'
    instance.changeState()
    test React.createElement(Foo), 'SPAN', 'bar'
    undefined

  it 'renders based on context in the constructor', ->
    class Foo extends React.Component
      @contextTypes:
        tag: PropTypes.string
        className: PropTypes.string

      constructor: (props, context) ->
        super props, context
        @state =
          tag: context.tag
          className: @context.className

      render: ->
        Tag = @state.tag
        React.createElement Tag,
          className: @state.className

    class Outer extends React.Component
      @childContextTypes:
        tag: PropTypes.string
        className: PropTypes.string

      getChildContext: ->
        tag: 'span'
        className: 'foo'

      render: ->
        React.createElement Foo

    test React.createElement(Outer), 'SPAN', 'foo'
    undefined

  it 'renders only once when setting state in componentWillMount', ->
    renderCount = 0
    class Foo extends React.Component
      constructor: (props) ->
        @state = bar: props.initialValue

      componentWillMount: ->
        @setState bar: 'bar'

      render: ->
        renderCount++
        span className: @state.bar

    test React.createElement(Foo, initialValue: 'foo'), 'SPAN', 'bar'
    expect(renderCount).toBe 1
    undefined

  it 'should throw with non-object in the initial state property', ->
    [['an array'], 'a string', 1234].forEach (state) ->
      class Foo extends React.Component
        constructor: ->
          @state = state

        render: ->
          span()

      expect(->
        test React.createElement(Foo), 'span', ''
      ).toThrowError(
        'Foo.state: must be set to an object or null'
      )
    undefined

  it 'should render with null in the initial state property', ->
    class Foo extends React.Component
      constructor: ->
        @state = null

      render: ->
        span()

    test React.createElement(Foo), 'SPAN', ''
    undefined

  it 'setState through an event handler', ->
    class Foo extends React.Component
      constructor: (props) ->
        @state = bar: props.initialValue

      handleClick: =>
        @setState bar: 'bar'

      render: ->
        Inner
          name: @state.bar
          onClick: @handleClick

    test React.createElement(Foo, initialValue: 'foo'), 'DIV', 'foo'
    attachedListener()
    expect(renderedName).toBe 'bar'
    undefined

  it 'should not implicitly bind event handlers', ->
    class Foo extends React.Component
      constructor: (props) ->
        @state = bar: props.initialValue

      handleClick: -> # needs double arrow
        @setState bar: 'bar'

      render: ->
        Inner
          name: @state.bar
          onClick: @handleClick

    test React.createElement(Foo, initialValue: 'foo'), 'DIV', 'foo'
    expect(attachedListener).toThrow()
    undefined

  it 'renders using forceUpdate even when there is no state', ->
    class Foo extends React.Component
      constructor: (props) ->
        @mutativeValue = props.initialValue

      handleClick: =>
        @mutativeValue = 'bar'
        @forceUpdate()

      render: ->
        Inner
          name: @mutativeValue
          onClick: @handleClick

    test React.createElement(Foo, initialValue: 'foo'), 'DIV', 'foo'
    attachedListener()
    expect(renderedName).toBe 'bar'
    undefined

  it 'will call all the normal life cycle methods', ->
    lifeCycles = []
    class Foo extends React.Component
      constructor: ->
        @state = {}

      componentWillMount: ->
        lifeCycles.push 'will-mount'

      componentDidMount: ->
        lifeCycles.push 'did-mount'

      componentWillReceiveProps: (nextProps) ->
        lifeCycles.push 'receive-props', nextProps

      shouldComponentUpdate: (nextProps, nextState) ->
        lifeCycles.push 'should-update', nextProps, nextState
        true

      componentWillUpdate: (nextProps, nextState) ->
        lifeCycles.push 'will-update', nextProps, nextState

      componentDidUpdate: (prevProps, prevState) ->
        lifeCycles.push 'did-update', prevProps, prevState

      componentWillUnmount: ->
        lifeCycles.push 'will-unmount'

      render: ->
        span
          className: @props.value

    test React.createElement(Foo, value: 'foo'), 'SPAN', 'foo'
    expect(lifeCycles).toEqual [
      'will-mount'
      'did-mount'
    ]
    lifeCycles = [] # reset
    test React.createElement(Foo, value: 'bar'), 'SPAN', 'bar'
    expect(lifeCycles).toEqual [
      'receive-props', { value: 'bar' }
      'should-update', { value: 'bar' }, {}
      'will-update',   { value: 'bar' }, {}
      'did-update',    { value: 'foo' }, {}
    ]
    lifeCycles = [] # reset
    ReactDOM.unmountComponentAtNode container
    expect(lifeCycles).toEqual ['will-unmount']
    undefined

  it 'warns when classic properties are defined on the instance,
      but does not invoke them.', ->
    spyOn console, 'error'
    getInitialStateWasCalled = false
    getDefaultPropsWasCalled = false
    class Foo extends React.Component
      constructor: ->
        @contextTypes = {}
        @propTypes = {}

      getInitialState: ->
        getInitialStateWasCalled = true
        {}

      getDefaultProps: ->
        getDefaultPropsWasCalled = true
        {}

      render: ->
        span
          className: 'foo'

    test React.createElement(Foo), 'SPAN', 'foo'
    expect(getInitialStateWasCalled).toBe false
    expect(getDefaultPropsWasCalled).toBe false
    expect(console.error.calls.count()).toBe 4
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'getInitialState was defined on Foo, a plain JavaScript class.'
    )
    expect(console.error.calls.argsFor(1)[0]).toContain(
      'getDefaultProps was defined on Foo, a plain JavaScript class.'
    )
    expect(console.error.calls.argsFor(2)[0]).toContain(
      'propTypes was defined as an instance property on Foo.'
    )
    expect(console.error.calls.argsFor(3)[0]).toContain(
      'contextTypes was defined as an instance property on Foo.'
    )
    undefined

  it 'does not warn about getInitialState() on class components
      if state is also defined.', ->
    spyOn console, 'error'
    class Foo extends React.Component
      constructor: (props) ->
        super props
        @state = bar: @props.initialValue

      getInitialState: ->
        {}

      render: ->
        span
          className: 'foo'

    test React.createElement(Foo), 'SPAN', 'foo'
    expect(console.error.calls.count()).toBe 0
    undefined

  it 'should warn when misspelling shouldComponentUpdate', ->
    spyOn console, 'error'
    class NamedComponent extends React.Component
      componentShouldUpdate: ->
        false

      render: ->
        span
          className: 'foo'

    test React.createElement(NamedComponent), 'SPAN', 'foo'
    expect(console.error.calls.count()).toBe 1
    expect(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: NamedComponent has a method called componentShouldUpdate().
       Did you mean shouldComponentUpdate()? The name is phrased as a
       question because the function is expected to return a value.'
    )
    undefined

  it 'should warn when misspelling componentWillReceiveProps', ->
    spyOn console, 'error'
    class NamedComponent extends React.Component
      componentWillRecieveProps: ->
        false

      render: ->
        span
          className: 'foo'

    test React.createElement(NamedComponent), 'SPAN', 'foo'
    expect(console.error.calls.count()).toBe 1
    expect(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: NamedComponent has a method called componentWillRecieveProps().
       Did you mean componentWillReceiveProps()?'
    )
    undefined

  it 'should throw AND warn when trying to access classic APIs', ->
    spyOn console, 'warn'
    instance =
      test Inner(name: 'foo'), 'DIV', 'foo'
    expect(-> instance.replaceState {}).toThrow()
    expect(-> instance.isMounted()).toThrow()
    expect(console.warn.calls.count()).toBe 2
    expect(console.warn.calls.argsFor(0)[0]).toContain(
      'replaceState(...) is deprecated in plain JavaScript React classes'
    )
    expect(console.warn.calls.argsFor(1)[0]).toContain(
      'isMounted(...) is deprecated in plain JavaScript React classes'
    )
    undefined

  it 'supports this.context passed via getChildContext', ->
    class Bar extends React.Component
      @contextTypes:
        bar: PropTypes.string
      render: ->
        div className: @context.bar

    class Foo extends React.Component
      @childContextTypes:
        bar: PropTypes.string
      getChildContext: ->
        bar: 'bar-through-context'
      render: ->
        React.createElement Bar

    test React.createElement(Foo), 'DIV', 'bar-through-context'
    undefined

  it 'supports classic refs', ->
    class Foo extends React.Component
      render: ->
        Inner
          name: 'foo'
          ref: 'inner'

    instance = test(React.createElement(Foo), 'DIV', 'foo')
    expect(instance.refs.inner.getName()).toBe 'foo'
    undefined

  it 'supports drilling through to the DOM using findDOMNode', ->
    instance = test Inner(name: 'foo'), 'DIV', 'foo'
    node = ReactDOM.findDOMNode(instance)
    expect(node).toBe container.firstChild
    undefined

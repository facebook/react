###
Copyright 2015, Facebook, Inc.
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. An additional grant
of patent rights can be found in the PATENTS file in the same directory.
###

React = null

describe 'ReactCoffeeScriptClass', ->
  div = null
  span = null
  container = null
  Inner = null
  attachedListener = null;
  renderedName = null;

  beforeEach ->
    React = require 'React'
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
    instance = React.render(element, container)
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
      React.render React.createElement(Foo), container
    ).toThrow()
    expect(console.error.calls.length).toBe(1)
    expect(console.error.calls[0].args[0]).toContain('No `render` method found on the returned component instance')

  it 'renders a simple stateless component with prop', ->
    class Foo
      render: ->
        Inner
          name: @props.bar

    test React.createElement(Foo, bar: 'foo'), 'DIV', 'foo'
    test React.createElement(Foo, bar: 'bar'), 'DIV', 'bar'

  it 'renders based on state using initial values in this.props', ->
    class Foo extends React.Component
      constructor: (props) ->
        super props
        @state = bar: @props.initialValue

      render: ->
        span
          className: @state.bar

    test React.createElement(Foo, initialValue: 'foo'), 'SPAN', 'foo'

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

  it 'renders based on context in the constructor', ->
    class Foo extends React.Component
      @contextTypes:
        tag: React.PropTypes.string
        className: React.PropTypes.string

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
        tag: React.PropTypes.string
        className: React.PropTypes.string

      getChildContext: ->
        tag: 'span'
        className: 'foo'

      render: ->
        React.createElement Foo

    test React.createElement(Outer), 'SPAN', 'foo'

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

  it 'should throw with non-object in the initial state property', ->
    [['an array'], 'a string', 1234].forEach (state) ->
      class Foo
        constructor: ->
          @state = state

        render: ->
          span()

      expect(->
        test React.createElement(Foo), 'span', ''
      ).toThrow(
        'Invariant Violation: Foo.state: must be set to an object or null'
      )

  it 'should render with null in the initial state property', ->
    class Foo extends React.Component
      constructor: ->
        @state = null

      render: ->
        span()

    test React.createElement(Foo), 'SPAN', ''

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

  it 'will call all the normal life cycle methods', ->
    lifeCycles = []
    class Foo
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
    React.unmountComponentAtNode container
    expect(lifeCycles).toEqual ['will-unmount']

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
    expect(console.error.calls.length).toBe 4
    expect(console.error.calls[0].args[0]).toContain(
      'getInitialState was defined on Foo, a plain JavaScript class.'
    )
    expect(console.error.calls[1].args[0]).toContain(
      'getDefaultProps was defined on Foo, a plain JavaScript class.'
    )
    expect(console.error.calls[2].args[0]).toContain(
      'propTypes was defined as an instance property on Foo.'
    )
    expect(console.error.calls[3].args[0]).toContain(
      'contextTypes was defined as an instance property on Foo.'
    )

  it 'should warn when misspelling shouldComponentUpdate', ->
    spyOn console, 'error'
    class NamedComponent
      componentShouldUpdate: ->
        false

      render: ->
        span
          className: 'foo'

    test React.createElement(NamedComponent), 'SPAN', 'foo'
    expect(console.error.calls.length).toBe 1
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: NamedComponent has a method called componentShouldUpdate().
       Did you mean shouldComponentUpdate()? The name is phrased as a
       question because the function is expected to return a value.'
    )

  it 'should warn when misspelling componentWillReceiveProps', ->
    spyOn console, 'error'
    class NamedComponent
      componentWillRecieveProps: ->
        false

      render: ->
        span
          className: 'foo'

    test React.createElement(NamedComponent), 'SPAN', 'foo'
    expect(console.error.calls.length).toBe 1
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: NamedComponent has a method called componentWillRecieveProps().
       Did you mean componentWillReceiveProps()?'
    )

  it 'should throw AND warn when trying to access classic APIs', ->
    spyOn console, 'error'
    instance =
      test Inner(name: 'foo'), 'DIV', 'foo'
    expect(-> instance.getDOMNode()).toThrow()
    expect(-> instance.replaceState {}).toThrow()
    expect(-> instance.isMounted()).toThrow()
    expect(-> instance.setProps name: 'bar').toThrow()
    expect(-> instance.replaceProps name: 'bar').toThrow()
    expect(console.error.calls.length).toBe 5
    expect(console.error.calls[0].args[0]).toContain(
      'getDOMNode(...) is deprecated in plain JavaScript React classes'
    )
    expect(console.error.calls[1].args[0]).toContain(
      'replaceState(...) is deprecated in plain JavaScript React classes'
    )
    expect(console.error.calls[2].args[0]).toContain(
      'isMounted(...) is deprecated in plain JavaScript React classes'
    )
    expect(console.error.calls[3].args[0]).toContain(
      'setProps(...) is deprecated in plain JavaScript React classes'
    )
    expect(console.error.calls[4].args[0]).toContain(
      'replaceProps(...) is deprecated in plain JavaScript React classes'
    )

  it 'supports this.context passed via getChildContext', ->
    class Bar
      @contextTypes:
        bar: React.PropTypes.string
      render: ->
        div className: @context.bar

    class Foo
      @childContextTypes:
        bar: React.PropTypes.string
      getChildContext: ->
        bar: 'bar-through-context'
      render: ->
        React.createElement Bar

    test React.createElement(Foo), 'DIV', 'bar-through-context'

  it 'supports classic refs', ->
    class Foo
      render: ->
        Inner
          name: 'foo'
          ref: 'inner'

    instance = test(React.createElement(Foo), 'DIV', 'foo')
    expect(instance.refs.inner.getName()).toBe 'foo'

  it 'supports drilling through to the DOM using findDOMNode', ->
    instance = test Inner(name: 'foo'), 'DIV', 'foo'
    node = React.findDOMNode(instance)
    expect(node).toBe container.firstChild

###
Copyright (c) Facebook, Inc. and its affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
###

React = null
ReactDOM = null
PropTypes = null

describe 'ReactCoffeeScriptClass', ->
  container = null
  InnerComponent = null
  attachedListener = null;
  renderedName = null;

  beforeEach ->
    React = require 'react'
    ReactDOM = require 'react-dom'
    PropTypes = require 'prop-types'
    container = document.createElement 'div'
    attachedListener = null
    renderedName = null
    InnerComponent = class extends React.Component
      getName: -> this.props.name
      render: ->
        attachedListener = this.props.onClick
        renderedName = this.props.name
        return React.createElement('div', className: this.props.name)

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
    class Foo extends React.Component
    expect(->
      expect(->
        ReactDOM.render React.createElement(Foo), container
      ).toThrow()
    ).toErrorDev([
      # A failed component renders twice in DEV
      'No `render` method found on the returned component instance',
      'No `render` method found on the returned component instance',
    ])
    undefined

  it 'renders a simple stateless component with prop', ->
    class Foo extends React.Component
      render: ->
        React.createElement(InnerComponent,
          name: @props.bar
        )

    test React.createElement(Foo, bar: 'foo'), 'DIV', 'foo'
    test React.createElement(Foo, bar: 'bar'), 'DIV', 'bar'
    undefined

  it 'renders based on state using initial values in this.props', ->
    class Foo extends React.Component
      constructor: (props) ->
        super props
        @state = bar: @props.initialValue

      render: ->
        React.createElement('span',
          className: @state.bar
        )

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
          return React.createElement('div',
            className: 'foo'
          )
        React.createElement('span',
          className: @state.bar
        )

    instance = test React.createElement(Foo, initialValue: 'foo'), 'DIV', 'foo'
    instance.changeState()
    test React.createElement(Foo), 'SPAN', 'bar'
    undefined

  it 'sets initial state with value returned by static getDerivedStateFromProps', ->
    class Foo extends React.Component
      constructor: (props) ->
        super props
        @state = foo: null
      render: ->
        React.createElement('div',
          className: "#{@state.foo} #{@state.bar}"
        )
    Foo.getDerivedStateFromProps = (nextProps, prevState) ->
      {
        foo: nextProps.foo
        bar: 'bar'
      }
    test React.createElement(Foo, foo: 'foo'), 'DIV', 'foo bar'
    undefined

  it 'warns if getDerivedStateFromProps is not static', ->
    class Foo extends React.Component
      render: ->
        React.createElement('div')
      getDerivedStateFromProps: ->
        {}
    expect(->
      ReactDOM.render(React.createElement(Foo, foo: 'foo'), container)
    ).toErrorDev 'Foo: getDerivedStateFromProps() is defined as an instance method and will be ignored. Instead, declare it as a static method.'
    undefined

  it 'warns if getDerivedStateFromError is not static', ->
    class Foo extends React.Component
      render: ->
        React.createElement('div')
      getDerivedStateFromError: ->
        {}
    expect(->
      ReactDOM.render(React.createElement(Foo, foo: 'foo'), container)
    ).toErrorDev 'Foo: getDerivedStateFromError() is defined as an instance method and will be ignored. Instead, declare it as a static method.'
    undefined

  it 'warns if getSnapshotBeforeUpdate is static', ->
    class Foo extends React.Component
      render: ->
        React.createElement('div')
    Foo.getSnapshotBeforeUpdate = () ->
      {}
    expect(->
      ReactDOM.render(React.createElement(Foo, foo: 'foo'), container)
    ).toErrorDev 'Foo: getSnapshotBeforeUpdate() is defined as a static method and will be ignored. Instead, declare it as an instance method.'
    undefined

  it 'warns if state not initialized before static getDerivedStateFromProps', ->
    class Foo extends React.Component
      render: ->
        React.createElement('div',
          className: "#{@state.foo} #{@state.bar}"
        )
    Foo.getDerivedStateFromProps = (nextProps, prevState) ->
      {
        foo: nextProps.foo
        bar: 'bar'
      }
    expect(->
      ReactDOM.render(React.createElement(Foo, foo: 'foo'), container)
    ).toErrorDev (
      '`Foo` uses `getDerivedStateFromProps` but its initial state is ' +
      'undefined. This is not recommended. Instead, define the initial state by ' +
      'assigning an object to `this.state` in the constructor of `Foo`. ' +
      'This ensures that `getDerivedStateFromProps` arguments have a consistent shape.'
    )
    undefined

  it 'updates initial state with values returned by static getDerivedStateFromProps', ->
    class Foo extends React.Component
      constructor: (props, context) ->
        super props, context
        @state =
          foo: 'foo'
          bar: 'bar'
      render: ->
        React.createElement('div',
          className: "#{@state.foo} #{@state.bar}"
        )
    Foo.getDerivedStateFromProps = (nextProps, prevState) ->
      {
        foo: "not-#{prevState.foo}"
      }
    test React.createElement(Foo), 'DIV', 'not-foo bar'
    undefined

  it 'renders updated state with values returned by static getDerivedStateFromProps', ->
    class Foo extends React.Component
      constructor: (props, context) ->
        super props, context
        @state =
          value: 'initial'
      render: ->
        React.createElement('div',
          className: @state.value
        )
    Foo.getDerivedStateFromProps = (nextProps, prevState) ->
      if nextProps.update
        return {
          value: 'updated'
        }
      return null
    test React.createElement(Foo, update: false), 'DIV', 'initial'
    test React.createElement(Foo, update: true), 'DIV', 'updated'
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

      UNSAFE_componentWillMount: ->
        @setState bar: 'bar'

      render: ->
        renderCount++
        React.createElement('span', className: @state.bar)

    test React.createElement(Foo, initialValue: 'foo'), 'SPAN', 'bar'
    expect(renderCount).toBe 1
    undefined

  it 'should warn with non-object in the initial state property', ->
    [['an array'], 'a string', 1234].forEach (state) ->
      class Foo extends React.Component
        constructor: ->
          @state = state

        render: ->
          React.createElement('span')

      expect(->
        test React.createElement(Foo), 'SPAN', ''
      ).toErrorDev('Foo.state: must be set to an object or null')
    undefined

  it 'should render with null in the initial state property', ->
    class Foo extends React.Component
      constructor: ->
        @state = null

      render: ->
        React.createElement('span')

    test React.createElement(Foo), 'SPAN', ''
    undefined

  it 'setState through an event handler', ->
    class Foo extends React.Component
      constructor: (props) ->
        @state = bar: props.initialValue

      handleClick: =>
        @setState bar: 'bar'

      render: ->
        React.createElement(InnerComponent,
          name: @state.bar
          onClick: @handleClick
        )

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
        React.createElement(InnerComponent,
          name: @state.bar
          onClick: @handleClick
        )

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
        React.createElement(InnerComponent,
          name: @mutativeValue
          onClick: @handleClick
        )

    test React.createElement(Foo, initialValue: 'foo'), 'DIV', 'foo'
    attachedListener()
    expect(renderedName).toBe 'bar'
    undefined

  it 'will call all the normal life cycle methods', ->
    lifeCycles = []
    class Foo extends React.Component
      constructor: ->
        @state = {}

      UNSAFE_componentWillMount: ->
        lifeCycles.push 'will-mount'

      componentDidMount: ->
        lifeCycles.push 'did-mount'

      UNSAFE_componentWillReceiveProps: (nextProps) ->
        lifeCycles.push 'receive-props', nextProps

      shouldComponentUpdate: (nextProps, nextState) ->
        lifeCycles.push 'should-update', nextProps, nextState
        true

      UNSAFE_componentWillUpdate: (nextProps, nextState) ->
        lifeCycles.push 'will-update', nextProps, nextState

      componentDidUpdate: (prevProps, prevState) ->
        lifeCycles.push 'did-update', prevProps, prevState

      componentWillUnmount: ->
        lifeCycles.push 'will-unmount'

      render: ->
        React.createElement('span',
          className: @props.value
        )

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
    getInitialStateWasCalled = false
    getDefaultPropsWasCalled = false
    class Foo extends React.Component
      constructor: ->
        @contextTypes = {}
        @contextType = {}
        @propTypes = {}

      getInitialState: ->
        getInitialStateWasCalled = true
        {}

      getDefaultProps: ->
        getDefaultPropsWasCalled = true
        {}

      render: ->
        React.createElement('span',
          className: 'foo'
        )

    expect(->
      test React.createElement(Foo), 'SPAN', 'foo'
    ).toErrorDev([
      'getInitialState was defined on Foo, a plain JavaScript class.',
      'getDefaultProps was defined on Foo, a plain JavaScript class.',
      'propTypes was defined as an instance property on Foo.',
      'contextTypes was defined as an instance property on Foo.',
      'contextType was defined as an instance property on Foo.',
    ])
    expect(getInitialStateWasCalled).toBe false
    expect(getDefaultPropsWasCalled).toBe false
    undefined

  it 'does not warn about getInitialState() on class components
      if state is also defined.', ->
    class Foo extends React.Component
      constructor: (props) ->
        super props
        @state = bar: @props.initialValue

      getInitialState: ->
        {}

      render: ->
        React.createElement('span',
          className: 'foo'
        )

    test React.createElement(Foo), 'SPAN', 'foo'
    undefined

  it 'should warn when misspelling shouldComponentUpdate', ->
    class NamedComponent extends React.Component
      componentShouldUpdate: ->
        false

      render: ->
        React.createElement('span',
          className: 'foo'
        )

    expect(->
      test React.createElement(NamedComponent), 'SPAN', 'foo'
    ).toErrorDev(
      'Warning: NamedComponent has a method called componentShouldUpdate().
       Did you mean shouldComponentUpdate()? The name is phrased as a
       question because the function is expected to return a value.'
    )
    undefined

  it 'should warn when misspelling componentWillReceiveProps', ->
    class NamedComponent extends React.Component
      componentWillRecieveProps: ->
        false

      render: ->
        React.createElement('span',
          className: 'foo'
        )

    expect(->
      test React.createElement(NamedComponent), 'SPAN', 'foo'
    ).toErrorDev(
      'Warning: NamedComponent has a method called componentWillRecieveProps().
       Did you mean componentWillReceiveProps()?'
    )
    undefined

  it 'should warn when misspelling UNSAFE_componentWillReceiveProps', ->
    class NamedComponent extends React.Component
      UNSAFE_componentWillRecieveProps: ->
        false

      render: ->
        React.createElement('span',
          className: 'foo'
        )

    expect(->
      test React.createElement(NamedComponent), 'SPAN', 'foo'
    ).toErrorDev(
      'Warning: NamedComponent has a method called UNSAFE_componentWillRecieveProps().
       Did you mean UNSAFE_componentWillReceiveProps()?'
    )
    undefined

  it 'should throw AND warn when trying to access classic APIs', ->
    instance =
      test React.createElement(InnerComponent, name: 'foo'), 'DIV', 'foo'
    expect(->
      expect(-> instance.replaceState {}).toThrow()
    ).toWarnDev(
      'replaceState(...) is deprecated in plain JavaScript React classes',
      {withoutStack: true}
    )
    expect(->
      expect(-> instance.isMounted()).toThrow()
    ).toWarnDev(
      'isMounted(...) is deprecated in plain JavaScript React classes',
      {withoutStack: true}
    )
    undefined

  it 'supports this.context passed via getChildContext', ->
    class Bar extends React.Component
      @contextTypes:
        bar: PropTypes.string
      render: ->
        React.createElement('div', className: @context.bar)

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
        React.createElement(InnerComponent,
          name: 'foo'
          ref: 'inner'
        )

    instance = test(React.createElement(Foo), 'DIV', 'foo')
    expect(instance.refs.inner.getName()).toBe 'foo'
    undefined

  it 'supports drilling through to the DOM using findDOMNode', ->
    instance = test React.createElement(InnerComponent, name: 'foo'), 'DIV', 'foo'
    node = ReactDOM.findDOMNode(instance)
    expect(node).toBe container.firstChild
    undefined
  undefined

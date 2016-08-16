---
id: context-zh-CN
title: Context
permalink: docs/context-zh-CN.html
prev: advanced-performance-zh-CN.html
---

React优势之一是你可以很容易地从React组件里跟踪数据流动。当你查看一个组件时，你可以很容易地判断出传入了哪些props，而这也有利于你的App进行逻辑推断。

有时，你想不通过在每一级组件设置prop的方式来向组件树内传递数据。那么，React的"context"特性可以让你做到这点。

> 注意：
>
> Context是一个先进的实验性特性，这个API很可能在未来版本变化。
>
> 大多数应用将不会需要用到context。尤其是如果你刚开始用React，你很可能不会想用它。使用context将会使你的代码难以理解，因为它让数据流变得不清晰。它类似于在你的应用里用以传递state的全局变量。
>
> **如果你必须使用context，请保守地使用它。**
>
> 不论你正在创建一个应用或者是库，试着缩小context的使用范围，并尽可能避免直接使用context相关API，以便在API变动时容易升级。

## 在组件树内自动传递info

假设你有一个这样的结构:

```javascript
var Button = React.createClass({
  render: function() {
    return (
      <button style={{'{{'}}background: this.props.color}}>
        {this.props.children}
      </button>
    );
  }
});

var Message = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.text} <Button color={this.props.color}>Delete</Button>
      </div>
    );
  }
});

var MessageList = React.createClass({
  render: function() {
    var color = "purple";
    var children = this.props.messages.map(function(message) {
      return <Message text={message.text} color={color} />;
    });
    return <div>{children}</div>;
  }
});
```

在这个例子里，我们手工传递一个叫`color`的prop，以便于给`Button`和`Message`组件添加合适的样式。当你想所有子组件可以访问一部分信息时(比如color)，上面的设置主题是一个很好的例子。通过使用context，我们能自动在组件树中传递信息：

```javascript{2-4,7,18,25-30,33}
var Button = React.createClass({
  contextTypes: {
    color: React.PropTypes.string
  },
  render: function() {
    return (
      <button style={{'{{'}}background: this.context.color}}>
        {this.props.children}
      </button>
    );
  }
});

var Message = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.text} <Button>Delete</Button>
      </div>
    );
  }
});

var MessageList = React.createClass({
  childContextTypes: {
    color: React.PropTypes.string
  },
  getChildContext: function() {
    return {color: "purple"};
  },
  render: function() {
    var children = this.props.messages.map(function(message) {
      return <Message text={message.text} />;
    });
    return <div>{children}</div>;
  }
});
```

通过添加`childContextTypes`和`getChildContext`到 `MessageList`(context提供者)，React会自动下传信息，并且通过定义`contextTypes`，子树中的任何组件(在这个例子中，子组件是`Button`)可以访问`context`。

如果`contextTypes`没有定义，那么`this.context`将是一个空对象。

## 父子耦合

Context同样可以使你构建这样的API:

```javascript
<Menu>
  <MenuItem>aubergine</MenuItem>
  <MenuItem>butternut squash</MenuItem>
  <MenuItem>clementine</MenuItem>
</Menu>
```

通过在`Menu`组件内下传相关的信息，每个`MenuItem` 可以与包含他们的`Menu`组件沟通。

**在你用这个API构建组件以前，考虑一下是否有清晰的替代方案** 我们喜欢用数组传递items，就像下面这样：

```javascript
<Menu items={['aubergine', 'butternut squash', 'clementine']} />
```

记住，如果你愿意，你同样可以在props里传递整个React组件。

## 在生命周期方法里引用context

如果`contextTypes`是定义在一个组件中，接下来的生命周期方法会收到一个额外的参数，`context`对象：

```javascript
void componentWillReceiveProps(
  object nextProps, object nextContext
)

boolean shouldComponentUpdate(
  object nextProps, object nextState, object nextContext
)

void componentWillUpdate(
  object nextProps, object nextState, object nextContext
)

void componentDidUpdate(
  object prevProps, object prevState, object prevContext
)
```

## 在无状态函数组件里引用 context

如果 `contextTypes` 被定义为函数的属性，无状态函数同样能够引用`context`。下面的代码展示了被写为无状态函数组件的`Button`组件：

```javascript
function Button(props, context) {
  return (
    <button style={{'{{'}}background: context.color}}>
      {props.children}
    </button>
  );
}
Button.contextTypes = {color: React.PropTypes.string};
```

## 更新context

当state或props改变时，会调用`getChildContext`方法。为了能更新context内的数据，需要使用`this.setState`来触发组件state更新。这将会触发一个新的context，并且子组件也能接收变化。

```javascript
var MediaQuery = React.createClass({
  getInitialState: function(){
    return {type:'desktop'};
  },
  childContextTypes: {
    type: React.PropTypes.string
  },
  getChildContext: function() {
    return {type: this.state.type};
  },
  componentDidMount: function(){
    var checkMediaQuery = function(){
      var type = window.matchMedia("(min-width: 1025px)").matches ? 'desktop' : 'mobile';
      if (type !== this.state.type){
        this.setState({type:type});
      }
    };

    window.addEventListener('resize', checkMediaQuery);
    checkMediaQuery();
  },
  render: function(){
    return this.props.children;
  }
});
```

## 什么时候不用 context

正如在写清晰代码时最好要避免使用全局变量一样，在大多数情况下，你应该避免使用context。特别是，在用它来"节省输入"和代替显式传入props时要三思。

隐式传入登录的用户，当前的语言，或者主题信息，是context最好的使用场景。要不然所有这些可能就是全局变量，但是context让你限定他们到一个单独的React树里。

在组件里传递你的模型数据时，不要依赖context。在组件树内显式传递数据，会更容易令人理解。之所以使用context会增加组件耦合度以及降低复用性，是因为组件在不同的地方渲染时，他们会表现出不同的行为。

## 已知的限制

假设由父组件提供的context值发生变动，但中间父级组件的`shouldComponentUpdate`返回了`false`，那么后代子级不会更新context。详见 issue [#2517](https://github.com/facebook/react/issues/2517) 。

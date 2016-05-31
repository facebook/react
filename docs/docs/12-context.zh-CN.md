---
id: context-zh-CN
title: Context
permalink: context-zh-CN.html
prev: advanced-performance-zh-CN.html
---

React最大的优势之一是很容易从你的React组件里跟踪数据流动。当你看着一个组件，你可以很容易准确看出哪个props被传入，这让你的APP很容易推断。

偶尔，你想通过组件树传递数据，而不在每一级上手工下传prop，React的 "context" 让你做到这点。

＞　注意：
＞　
＞　Context是一个先进的实验性特性．这个 API 很可能在未来版本变化.
>
> 大多数应用将不会需要用到 context. 尤其是如果你刚开始用React,你很可能不会想用 context.使用 context 将会使你的代码很难理解因为它让数据流不清晰.它类似于在你的应用里使用全局变量传递state.
>
> **如果你必须使用 context ,保守的使用它**
>
> 不论你正在创建一个应用或者是库,试着分离你对 context 的使用到一个小区域,并尽可能避免直接使用 context API,以便在API变动时容易升级.

## 从树里自动传递info

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

在这里例子里,我们手工穿透一个 `color` prop 以便于恰当格式化 `Button` 和 `Message` 组件.主题是一个很好的例子,当你可能想整个子树都可以访问一部分信息时(比如color). 使用 context 我们可以自动传过这个树:

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

通过添加 `childContextTypes` 和 `getChildContext` 到 `MessageList` ( context 提供),React下传信息到子树中的任何组件(在这个例子中, `Button`可以由定义 `contextTypes`来访问它).

如果 `contextTypes` 没有定义,那么 `this.context` 将是一个空对象.

## 父子耦合

Context 同样可以使你构建这样的 APT:

```javascript
<Menu>
  <MenuItem>aubergine</MenuItem>
  <MenuItem>butternut squash</MenuItem>
  <MenuItem>clementine</MenuItem>
</Menu>
```

通过在 `Menu` 组件下传相关的信息,每个 `MenuItem` 可以与包含他们的 `Menu` 组件沟通.

**在你用这个API构建组件以前,考虑一下是否有清晰的替代方案** 我们 喜欢像这样简单的用数组传递items:

```javascript
<Menu items={['aubergine', 'butternut squash', 'clementine']} />
```

记住你同样可以在props里传递整个React组件,如果你想.

## 在生命周期方法里引用 context

如果 `contextTypes` 在一个组件中定义,接下来的生命周期方法会收到一个额外的参数, `context` 对象:

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

无状态函数同样能够引用 `context` 如果 `contextTypes` 被定义为函数的属性.下面的代码展示了被写为无状态函数组件的 `Button` 组件.

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

## Updating context

当 state 或者 props 变化时 `getChildContext` 函数会被调用。为了更新context里的数据，用 `this.setState` 触发一个本地的state更新。这将会触发一个新的 context 并且子级将收到变化。

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

正像全局变量是在写清晰代码时最好要避免的,你应该在大多数情况下避免使用context. 特别是,在用它来"节省输入"和代替显示传入props时要三思.

context最好的使用场景是隐式的传入登录的用户,当前的语言,或者主题信息.要不然所有这些可能就是全局变量,但是context让你限定他们到一个单独的React树里.

不要用context在组件里传递你的模型数据.通过树显示的传递你的数据更容易理解.使用context使你的组件更耦合和不可复用,因为  依赖于他们在哪里渲染,他们会表现不同的行为.

## 已知的限制

如果一个由组件提供的context值变动,使用那个值的子级不会更新,如果一个直接的父级从 `shouldComponentUpdate` 返回 `false` .详见 issue [#2517](https://github.com/facebook/react/issues/2517) . 

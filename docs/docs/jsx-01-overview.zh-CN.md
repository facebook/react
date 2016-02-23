---
id: jsx-overview-zh-CN
title: 深入 JSX
permalink: jsx-overview-zh-CN.html
next: jsx-html-differences-zh-CN.html
redirect_from: docs/jsx-in-depth-zh-CN.html
---

[JSX](https://facebook.github.io/jsx/) 是一个看起来很像 XML 的 JavaScript 语法扩展。React 可以用来做简单的 JSX 句法转换。

## 为什么要用 JSX？

你不需要为了 React 使用 JSX，可以直接使用原生 JS。但是，我们建议使用 JSX 是因为它能精确，也是常用的定义包含属性的树状结构的语法。

它对于非专职开发者比如设计师也比较熟悉。

XML 有固定的标签开启和闭合的优点。这能让复杂的树更易于阅读，优于方法调用和对象字面量的形式。

它没有修改 JavaScript 语义。


## HTML 标签对比 React 组件

React 可以渲染 HTML 标签 (strings) 或 React 组件 (classes)。

要渲染 HTML 标签，只需在 JSX 里使用小写字母的标签名。

```javascript
var myDivElement = <div className="foo" />;
ReactDOM.render(myDivElement, document.getElementById('example'));
```

要渲染 React 组件，只需创建一个大写字母开头的本地变量。

```javascript
var MyComponent = React.createClass({/*...*/});
var myElement = <MyComponent someProperty={true} />;
ReactDOM.render(myElement, document.getElementById('example'));
```

React 的 JSX 使用大、小写的约定来区分本地组件的类和 HTML 标签。

> 注意:
>
> 由于 JSX 就是 JavaScript，一些标识符像 `class` 和 `for` 不建议作为 XML
> 属性名。作为替代，React DOM 使用 `className` 和 `htmlFor` 来做对应的属性。

## JSX 语法

我们坚信组件是正确方法去做关注分离，而不是通过“模板”和“展示逻辑”。我们认为标签和生成它的代码是紧密相连的。此外，展示逻辑通常是很复杂的，通过模板语言实现这些逻辑会产生大量代码。

我们得出解决这个问题最好的方案是通过 JavaScript 直接生成模板，这样你就可以用一个真正语言的所有表达能力去构建用户界面。

为了使这变得更简单，我们做了一个非常简单、**可选**类似 HTML 语法 ，通过函数调用即可生成模板的编译器，称为 JSX。

**JSX 让你可以用 HTML 语法去写 JavaScript 函数调用** 为了在 React 生成一个链接，通过纯 JavaScript 你可以这么写：

`React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Hello React!')`。

通过 JSX 这就变成了

`<a href="https://facebook.github.io/react/">Hello React!</a>`。

我们发现这会使搭建 React 应用更加简单，设计师也偏向用这用语法，但是每个人可以有它们自己的工作流，所以**JSX 不是必须用的。**

JSX 非常小；上面“hello, world”的例子使用了 JSX 所有的特性。想要了解更多，请看 [深入理解 JSX](/react/docs/jsx-in-depth-zh-CN.html)。或者直接使用[在线 JSX 编译器](/react/jsx-compiler.html)观察变化过程。

JSX 类似于 HTML，但不是完全一样。参考 [JSX 陷阱](/react/docs/jsx-html-differences-zh-CN.html) 学习关键区别。

[Babel 公开了一些使用 JSX 的方式],从命令行工具到 Ruby on Rails 集成。选择一个对你来说最合适的工具。

## 没有 JSX 的 React

JSX完全是可选的；你无需在 React 中必须使用 JSX。你可以通过 `React.createElement` 来创建一个树。第一个参数是标签，第二个参数是一个属性对象，每三个是子节点。

```javascript
var child1 = React.createElement('li', null, 'First Text Content');
var child2 = React.createElement('li', null, 'Second Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```

方便起见，你可以创建基于自定义组件的速记工厂方法。

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

React 已经为 HTML 标签提供内置工厂方法。

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```

## 转换（Transform）

JSX 把类 XML 的语法转成原生 JavaScript，XML 元素、属性和子节点被转换成 `React.createElement` 的参数。

```javascript
var Nav;
// 输入 (JSX):
var app = <Nav color="blue" />;
// 输出 (JS):
var app = React.createElement(Nav, {color:"blue"});
```

注意，要想使用 `<Nav />`，`Nav` 变量一定要在作用区间内。

JSX 也支持使用 XML 语法定义子结点：

```javascript
var Nav, Profile;
// 输入 (JSX):
var app = <Nav color="blue"><Profile>click</Profile></Nav>;
// 输出 (JS):
var app = React.createElement(
  Nav,
  {color:"blue"},
  React.createElement(Profile, null, "click")
);
```

当显示名称没有定义时，JSX 会根据变量赋值来推断类的 [显示名称](/react/docs/component-specs.html#displayname) :

```javascript
// 输入 (JSX):
var Nav = React.createClass({ });
// 输出 (JS):
var Nav = React.createClass({displayName: "Nav", });
```

使用 [JSX 编译器](/react/jsx-compiler.html) 来试用 JSX 并理解它是如何转换到原生 JavaScript，还有 [HTML 到 JSX 转换器](/react/html-jsx.html) 来把现有 HTML 转成 JSX。

如果你要使用 JSX，这篇 [新手入门](/react/docs/getting-started.html) 教程来教你如何搭建环境。

> 注意:
>
>
> JSX 表达式总是会当作 ReactElement 执行。具体的实际细节可能不同。一种优化
> 的模式是把 ReactElement 当作一个行内的对象字面量形式来绕过
> `React.createElement` 里的校验代码。

## 命名组件（Namespaced Components）

如果你正在构建一个有很多子组件的组件，比如表单，你也许会最终得到许多的变量声明。

```javascript
// 尴尬的变量声明块
var Form = MyFormComponent;
var FormRow = Form.Row;
var FormLabel = Form.Label;
var FormInput = Form.Input;

var App = (
  <Form>
    <FormRow>
      <FormLabel />
      <FormInput />
    </FormRow>
  </Form>
);
```

为了使其更简单和容易，*命名组件*令你使用包含其他组件作为属性的单一的组件。

```javascript
var Form = MyFormComponent;

var App = (
  <Form>
    <Form.Row>
      <Form.Label />
      <Form.Input />
    </Form.Row>
  </Form>
);
```

要做到这一点，你只需要把你的*"子组件"*创建为主组件的属性。

```javascript
var MyFormComponent = React.createClass({ ... });

MyFormComponent.Row = React.createClass({ ... });
MyFormComponent.Label = React.createClass({ ... });
MyFormComponent.Input = React.createClass({ ... });
```

当编译你的代码时，JSX会恰当的进行处理。

```javascript
var App = (
  React.createElement(Form, null,
    React.createElement(Form.Row, null,
      React.createElement(Form.Label, null),
      React.createElement(Form.Input, null)
    )
  )
);
```

## JavaScript 表达式

### 属性表达式

要使用 JavaScript 表达式作为属性值，只需把这个表达式用一对大括号 (`{}`) 包起来，不要用引号 (`""`)。

```javascript
// 输入 (JSX):
var person = <Person name={window.isLoggedIn ? window.name : ''} />;
// 输出 (JS):
var person = React.createElement(
  Person,
  {name: window.isLoggedIn ? window.name : ''}
);
```

### Boolean 属性

省略一个属性的值会导致JSX把它当做 `true`。要传值 `false`必须使用属性表达式。这常出现于使用HTML表单元素，含有属性如`disabled`, `required`, `checked` 和 `readOnly`。

```javascript
// 在JSX中，对于禁用按钮这二者是相同的。
<input type="button" disabled />;
<input type="button" disabled={true} />;

// 在JSX中，对于不禁用按钮这二者是相同的。
<input type="button" />;
<input type="button" disabled={false} />;
```

### 子节点表达式

同样地，JavaScript 表达式可用于描述子结点：

```javascript
// 输入 (JSX):
var content = <Container>{window.isLoggedIn ? <Nav /> : <Login />}</Container>;
// 输出 (JS):
var content = React.createElement(
  Container,
  null,
  window.isLoggedIn ? React.createElement(Nav) : React.createElement(Login)
);
```

### 注释

JSX 里添加注释很容易；它们只是 JS 表达式而已。你仅仅需要小心的是当你在一个标签的子节点块时，要用 `{}` 包围要注释的部分。

```javascript
var content = (
  <Nav>
    {/* child comment, 用 {} 包围 */}
    <Person
      /* 多
         行
         注释 */
      name={window.isLoggedIn ? window.name : ''} // 行尾注释
    />
  </Nav>
);
```

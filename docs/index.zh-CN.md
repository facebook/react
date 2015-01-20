---
layout: page.zh-CN
title: 一个构建用户界面的JavaScript库
id: home
---

<section class="light home-section">
  <div class="marketing-row">
    <div class="marketing-col">
      <h3>只是UI</h3>
      <p>
        许多人把React作为MVC的V来使用。
        由于React不会为你的技术栈其他部分不做任何干涉，
        所以很容易在现有的项目的小功能上尝试一下。
      </p>
    </div>
    <div class="marketing-col">
      <h3>虚拟DOM</h3>
      <p>
        React 使用了<i>虚拟DOM</i>这个高性能的不同实现。甚至可以用Node.js在服务端上渲染&mdash; 没有重度浏览器DOM的依赖。
      </p>
    </div>
    <div class="marketing-col">
      <h3>数据流</h3>
      <p>
        React实现单向触发数据流从而降低样板比传统的数据绑定更容易使用。
      </p>
    </div>
  </div>
</section>
<hr class="home-divider" />
<section class="home-section">
  <div id="examples">
    <div class="example">
      <h3>一个简单的组件</h3>
      <p>
        React组件实现了一个`render()`方法用于输入数据和返回展示。这个例子使用了JSX的类XML语法。输入数据可以通过`render()`的`this.props`来访问。
      </p>
      <p>
        <strong>JSX是在React里是可选和不必要</strong> 可以点击“编译JS”通过JSX编译器生成JavaScript的代码。
      </p>
      <div id="helloExample"></div>
    </div>
    <div class="example">
      <h3>一个状态组件</h3>
      <p>
        除了采取输入数据（通过`this.props`来访问），一个组件还可以保持内部的状态数据（通过`this.state`来访问）。
        当一个组件的状态数据改变，通过重新调用`render()`渲染标记将会被更新。
      </p>
      <div id="timerExample"></div>
    </div>
    <div class="example">
      <h3>一个应用</h3>
      <p>
        使用`props`和`state`，我们可以组建一个小的TODO应用。
        这个例子是当用户输入文本，使用`state`来跟踪当前列表子项，尽管事件处理看起来像在渲染内部实现，这些将会通过事件委托被收集和实现。
      </p>
      <div id="todoExample"></div>
    </div>
    <div class="example">
      <h3>一个使用外部插件的组件</h3>
      <p>
        React是灵活的，允许你通过它提供的钩子在接口上关联其他的库和框架。这个例子使用Showdown，一个Markdown的库，来实时转化文本域的值。
      </p>
      <div id="markdownExample"></div>
    </div>
  </div>
  <script type="text/javascript" src="js/examples/hello.js"></script>
  <script type="text/javascript" src="js/examples/timer.js"></script>
  <script type="text/javascript" src="js/examples/todo.js"></script>
  <script type="text/javascript" src="js/examples/markdown.js"></script>
</section>
<hr class="home-divider" />
<section class="home-bottom-section">
  <div class="buttons-unit">
    <a href="docs/getting-started.html" class="button">入门教程</a>
    <a href="downloads.html" class="button">下载 React v{{site.react_version}}</a>
  </div>
</section>

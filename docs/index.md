---
layout: page
title: A JavaScript library for building user interfaces
id: home
---

<section class="light home-section">
  <div class="marketing-row">
    <div class="marketing-col">
      <h3>Just the UI</h3>
      <p>
        Lots of people use React as the V in MVC.
        Since React makes no assumptions about the rest of your technology stack,
        it&apos;s easy to try it out on a small feature in an existing project.
      </p>
    </div>
    <div class="marketing-col">
      <h3>Virtual DOM</h3>
      <p>
        React abstracts away the DOM from you, giving a simpler programming model and better performance. React can also render on the server using Node, and it can power native apps using <a href="https://facebook.github.io/react-native/">React Native</a>.
      </p>
    </div>
    <div class="marketing-col">
      <h3>Data flow</h3>
      <p>
        React implements one-way reactive data flow which reduces boilerplate and is
        easier to reason about than traditional data binding.
      </p>
    </div>
  </div>
</section>
<hr class="home-divider" />
<section class="home-section">
  <div id="examples">
    <div class="example">
      <h3>A Simple Component</h3>
      <p>
        React components implement a `render()` method that takes input data and
        returns what to display. This example uses an XML-like syntax called
        JSX. Input data that is passed into the component can be accessed by
        `render()` via `this.props`.
      </p>
      <p>
        <strong>JSX is optional and not required to use React.</strong> Try
        clicking on "Compiled JS" to see the raw JavaScript code produced by
        the JSX compiler.
      </p>
      <div id="helloExample"></div>
    </div>
    <div class="example">
      <h3>A Stateful Component</h3>
      <p>
        In addition to taking input data (accessed via `this.props`), a
        component can maintain internal state data (accessed via `this.state`).
        When a component's state data changes, the rendered markup will be
        updated by re-invoking `render()`.
      </p>
      <div id="timerExample"></div>
    </div>
    <div class="example">
      <h3>An Application</h3>
      <p>
        Using `props` and `state`, we can put together a small Todo application.
        This example uses `state` to track the current list of items as well as
        the text that the user has entered. Although event handlers appear to be
        rendered inline, they will be collected and implemented using event
        delegation.
      </p>
      <div id="todoExample"></div>
    </div>
    <div class="example">
      <h3>A Component Using External Plugins</h3>
      <p>
        React is flexible and provides hooks that allow you to interface with
        other libraries and frameworks. This example uses **marked**, an external
        Markdown library, to convert the textarea's value in real-time.
      </p>
      <div id="markdownExample"></div>
    </div>
  </div>
  <script type="text/javascript" src="/react/js/marked.min.js"></script>
  <script type="text/javascript" src="/react/js/examples/hello.js"></script>
  <script type="text/javascript" src="/react/js/examples/timer.js"></script>
  <script type="text/javascript" src="/react/js/examples/todo.js"></script>
  <script type="text/javascript" src="/react/js/examples/markdown.js"></script>
</section>
<hr class="home-divider" />
<section class="home-bottom-section">
  <div class="buttons-unit">
    <a href="docs/getting-started.html" class="button">Get Started</a>
    <a href="downloads.html" class="button">Download React v{{site.react_version}}</a>
  </div>
</section>

---
layout: hero
title: A JavaScript library for building user interfaces
id: home
---

<section class="light home-section">
  <div class="marketing-row">
    <div class="marketing-col">
      <h3>Declarative</h3>
      <p>React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.</p>
      <p>Declarative views make your code more predictable and easier to debug.</p>
    </div>
    <div class="marketing-col">
      <h3>Component-Based</h3>
      <p>Build encapsulated components that manage their own state, then compose them to make complex UIs.</p>
      <p>Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep state out of the DOM.</p>
    </div>
    <div class="marketing-col">
      <h3>Learn Once, Write Anywhere</h3>
      <p>We don't make assumptions about the rest of your technology stack, so you can develop new features in React without rewriting existing code.</p>
      <p>React can also render on the server using Node and power mobile apps using <a href="https://facebook.github.io/react-native/">React Native</a>.</p>
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
        <strong>JSX is optional and not required to use React.</strong>
        Try the
        <a href="http://babeljs.io/repl#?babili=false&browsers=&build=&builtIns=false&code_lz=MYGwhgzhAEASCmIQHsCy8pgOb2vAHgC7wB2AJjAErxjCEB0AwsgLYAOyJph0A3gFABIAE6ky8YQAoAlHyEj4hAK7CS0ADxkAlgDcAfAiTI-hABZaI9NsORtLJMC3gBfdQHpt-gNxDn_P_zUtIQAIgDyqPSi5BKS6oYo6Jg40A5OALwARCHwOlokmdBuegA00CzISiSEAHLI4tJeQA&debug=false&circleciRepo=&evaluate=false&lineWrap=false&presets=react&prettier=true&targets=&version=6.26.0">Babel REPL</a>
        to see the raw JavaScript code produced by the JSX compilation step.
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
        other libraries and frameworks. This example uses **remarkable**, an
        external Markdown library, to convert the textarea's value in real time.
      </p>
      <div id="markdownExample"></div>
    </div>
  </div>
  <script src="https://unpkg.com/remarkable@1.7.1/dist/remarkable.min.js"></script>
  <script src="/react/js/examples/hello.js"></script>
  <script src="/react/js/examples/timer.js"></script>
  <script src="/react/js/examples/todo.js"></script>
  <script src="/react/js/examples/markdown.js"></script>
</section>

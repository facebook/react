# Goals of the documentation
- Flow of docs should mimic progression of questions a new user would ask
- High information density -- assume the reader is adept at JS
- Talk about best practices
- JSFiddles for all code samples
- Provide background for some of the design decisions
- Less words less words less words!

# Outline

Motivation / Why React?
- Declarative (simple)
- Components (separation of concerns)
- Give it 5 minutes

Displaying data
- Hello world example
- Reactive updates
- Components are just functions
- JSX syntax (link to separate doc?)

Interactivity and dynamic UIs
- Click handler example
- Event handlers / synthetic events (link to w3c docs)
- Under the hood: autoBind and event delegation (IE8 notes)
- React is a state machine
- How state works
- What components should have state?
- What should go in state?
- What shouldn't go in state?

Scaling up: using multiple components
- Motivation: separate concerns
- Composition example
- Ownership (and owner vs. parent)
- Children
- Data flow (one-way data binding)
- A note on performance

Building effective reusable components
- You should build a reusable component library (CSS, testing etc)
- Prop validation
- Transferring props: a shortcut
- Mixins
- Testing

Forms

Working with the browser
- The mock DOM
- Refs / getDOMNode()
- More about refs
- Component lifecycle
- Browser support and polyfills

Working with your environment
- CDN-hosted React
- Using master
- In-browser JSX transform
- Productionizing: precompiled JSX
- Helpful open-source projects

Integrating with other UI libraries
- Using jQuery plugins
- Letting jQuery manage React components
- Using with Backbone.View
- CoffeeScript
- Moving from Handlebars to React: an example

Server / static rendering
- Motivation
- Simple example
- How does it work? (No DOM)
- Rendr + React

Big ideas
- Animation
- Bootstrap bindings (responsive grids)
- Reactive CSS
- Web workers
- Native views

Case studies
- Comment box tutorial from scratch
- From HTML mock to application: React one-hour email
- Jordan's LikeToggler example

Reference
- API
- DOM differences
- JSX gotchas
- Antipatterns

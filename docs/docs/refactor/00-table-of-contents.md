# Goals of the documentation
- Flow of docs should mimic progression of questions a new user would ask
- High information density -- assume the reader is adept at JS
- Talk about best practices
- JSFiddles for all code samples

# Outline

Motivation / Why React?
- Declarative (simple)
- Components (separation of concerns)
- Give it 5 minutes

Displaying data
- Hello world example
- Reactive updates
- JSX syntax (link to separate doc?)

Handling user input
- Click handler example
- Event handlers / synthetic events (link to w3c docs)
- Under the hood: autoBind and event delegation (IE8 notes)
- How state works
- What should go in state?
- What components should have state?

Scaling up: using multiple components
- Motivation: separate concerns
- Composition example
- Handling events
- A note on performance
- You should build a reusable component library (CSS, testing etc)
- Mixins
- Testing

Forms
- TODO list example
- How to think about Reactive forms
- New form events and properties

Touching the DOM
- Refs / getDOMNode()
- Component lifecycle

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

Case studies
- Comment box tutorial from scratch
- From HTML mock to application: React one-hour email

API reference

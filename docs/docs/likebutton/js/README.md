## 2.0 BOOTSTRAP JS PHILOSOPHY
These are the high-level design rules which guide the development of Bootstrap's plugin apis.

---

### DATA-ATTRIBUTE API

We believe you should be able to use all plugins provided by Bootstrap purely through the markup API without writing a single line of JavaScript. This is Bootstrap's first class API.

We acknowledge that this isn't always the most performant and it may sometimes be desirable to turn this functionality off altogether. Therefore, as of 2.0 we provide the ability to disable the data attribute API by unbinding all events on the body namespaced with `'data-api'`. This looks like this:

    $('body').off('.data-api')

To target a specific plugin, just include the plugins name as a namespace along with the data-api namespace like this:

    $('body').off('.alert.data-api')

---

### PROGRAMATIC API

We also believe you should be able to use all plugins provided by Bootstrap purely through the JavaScript API.

All public APIs should be single, chainable methods, and return the collection acted upon.

    $(".btn.danger").button("toggle").addClass("fat")

All methods should accept an optional options object, a string which targets a particular method, or null which initiates the default behavior:

    $("#myModal").modal() // initialized with defaults
    $("#myModal").modal({ keyboard: false }) // initialized with no keyboard
    $("#myModal").modal('show') // initializes and invokes show immediately

---

### OPTIONS

Options should be sparse and add universal value. We should pick the right defaults.

All plugins should have a default object which can be modified to affect all instances' default options. The defaults object should be available via `$.fn.plugin.defaults`.

    $.fn.modal.defaults = { … }

An options definition should take the following form:

    *noun*: *adjective* - describes or modifies a quality of an instance

Examples:

    backdrop: true
    keyboard: false
    placement: 'top'

---

### EVENTS

All events should have an infinitive and past participle form. The infinitive is fired just before an action takes place, the past participle on completion of the action.

    show | shown
    hide | hidden

All infinitive events should provide preventDefault functionality. This provides the abililty to stop the execution of an action.

    $('#myModal').on('show', function (e) {
        if (!data) return e.preventDefault() // stops modal from being shown
    })

---

### CONSTRUCTORS

Each plugin should expose its raw constructor on a `Constructor` property -- accessed in the following way:


    $.fn.popover.Constructor

---

### DATA ACCESSOR

Each plugin stores a copy of the invoked class on an object. This class instance can be accessed directly through jQuery's data API like this:

    $('[rel=popover]').data('popover') instanceof $.fn.popover.Constructor

---

### DATA ATTRIBUTES

Data attributes should take the following form:

- data-{{verb}}={{plugin}} - defines main interaction
- data-target || href^=# - defined on "control" element (if element controls an element other than self)
- data-{{noun}} - defines class instance options

Examples:

    // control other targets
    data-toggle="modal" data-target="#foo"
    data-toggle="collapse" data-target="#foo" data-parent="#bar"

    // defined on element they control
    data-spy="scroll"

    data-dismiss="modal"
    data-dismiss="alert"

    data-toggle="dropdown"

    data-toggle="button"
    data-toggle="buttons-checkbox"
    data-toggle="buttons-radio"
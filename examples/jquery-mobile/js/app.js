/**
 * jQuery Mobile React Example
 *
 * Main application script.
 * For variety, this example is written in 100% JSHint-compliant JavaScript, not in JSX.
 *
 * Component structure:
 *
 * - App
 *   |-- JQueryMobilePage (one)
 *   |   |-- JQueryMobileHeader
 *   |   |-- JQueryMobileContent
 *   |   |   |-- PageOneContent
 *   |   |       |-- JQueryMobileButton
 *   |   |-- JQueryMobileFooter
 *   |-- JQueryMobilePage (two)
 *   |   |-- JQueryMobileHeader
 *   |   |-- JQueryMobileContent
 *   |   |   |-- PageTwoContent
 *   |   |       |-- JQueryMobileButton
 *   |   |-- JQueryMobileFooter
 *   |-- JQueryMobilePage (popup)
 *       |-- JQueryMobileHeader
 *       |-- JQueryMobileContent
 *       |   |-- PagePopUpContent
 *       |       |-- JQueryMobileButton
 *       |-- JQueryMobileFooter
 */

 /* global document, React */

'use strict';

/** Main application component. */
var App = React.createClass({
  displayName: 'App',

  render: function() {
    return React.DOM.div({className:'app'},
      JQueryMobilePage({id:'one'}, PageOneContent(null)),
      JQueryMobilePage({id:'two'}, PageTwoContent(null)),
      JQueryMobilePage({id:'popup', headerTheme:'b'}, PagePopUpContent(null))
    );
  }
});

/** jQuery Mobile button component. */
var JQueryMobileButton = React.createClass({
  displayName: 'JQueryMobileButton',

  getDefaultProps: function() {
    return {className:'ui-btn ui-shadow ui-corner-all'};
  },

  render: function() {
    return React.DOM.p(null,
      React.DOM.a(this.props, this.props.children)
    );
  }
});

/** jQuery Mobile page content component. */
var JQueryMobileContent = React.createClass({
  displayName: 'JQueryMobileContent',

  render: function() {
    return React.DOM.div({role:'main', className:'ui-content'},
      this.props.children
    );
  }
});

/** jQuery Mobile footer component. */
var JQueryMobileFooter = React.createClass({
  displayName: 'JQueryMobileFooter',

  render: function() {
    return React.DOM.div({'data-role':'footer'},
      React.DOM.h4(null, 'Page footer')
    );
  }
});

/** jQuery Mobile header component. */
var JQueryMobileHeader = React.createClass({
  displayName: 'JQueryMobileHeader',

  render: function() {
    return React.DOM.div({'data-role':'header', 'data-theme':this.props.headerTheme},
      React.DOM.h1(null, this.props.title)
    );
  }
});

/** jQuery Mobile page component. */
var JQueryMobilePage = React.createClass({
  displayName: 'JQueryMobilePage',

  getDefaultProps: function() {
    return {'data-role':'page', 'data-theme':'a', headerTheme:'a'};
  },

  render: function() {
    return this.transferPropsTo(React.DOM.div(null,
      JQueryMobileHeader({title:'Page ' + this.props.id, headerTheme:this.props.headerTheme}),
      JQueryMobileContent(null, this.props.children),
      JQueryMobileFooter(null)
    ));
  }
});

/** Application page one component. */
var PageOneContent = React.createClass({
  displayName: 'PageOneContent',

  render: function() {
    return React.DOM.div(null,
      React.DOM.h2(null, 'One'),
      React.DOM.p(null,
        'I have an ',
        React.DOM.code(null, 'id'),
        ' of "one" on my page container. I\'m first in the source order so I\'m shown when the page loads.'
      ),
      React.DOM.p(null, 'This is a multi-page boilerplate template that you can copy to build your first jQuery Mobile page. This template contains multiple "page" containers inside, unlike a single page template that has just one page within it.'),
      React.DOM.p(null, 'Just view the source and copy the code to get started. All the CSS and JS is linked to the jQuery CDN versions so this is super easy to set up. Remember to include a meta viewport tag in the head to set the zoom level.'),
      React.DOM.p(null,
        'You link to internal pages by referring to the ',
        React.DOM.code(null, 'id'),
        ' of the page you want to show. For example, to ',
        React.DOM.a({href:'#two'}, 'link'),
        ' to the page with an ',
        React.DOM.code(null, 'id'),
        ' of "two", my link would have a ',
        React.DOM.code(null, 'href="#two"'),
        ' in the code.'
      ),
      React.DOM.h3(null, 'Show internal pages:'),
      JQueryMobileButton({href:'#two'}, 'Show page "two"'),
      JQueryMobileButton({href:'#popup', 'data-rel':'dialog', 'data-transition':'pop'}, 'Show page "popup" (as a dialog)')
    );
  }
});

/** Application page two component. */
var PageTwoContent = React.createClass({
  displayName: 'PageTwoContent',

  render: function() {
    return React.DOM.div(null,
      React.DOM.h2(null, 'Two'),
      React.DOM.p(null, 'I have an id of "two" on my page container. I\'m the second page container in this multi-page template.'),
      React.DOM.p(null, 'Notice that the theme is different for this page because we\'ve added a few ',
        React.DOM.code(null, 'data-theme'),
        ' swatch assigments here to show off how flexible it is. You can add any content or widget to these pages, but we\'re keeping these simple.'),
      JQueryMobileButton({href:'#one', 'data-direction':'reverse', className:'ui-btn ui-shadow ui-corner-all ui-btn-b'}, 'Back to page "one"')
    );
  }
});

/** Application popup page component. */
var PagePopUpContent = React.createClass({
  displayName: 'PagePopUpContent',

  render: function() {
    return React.DOM.div(null,
      React.DOM.h2(null, 'Popup'),
      React.DOM.p(null, 'I have an id of "popup" on my page container and only look like a dialog because the link to me had a ',
        React.DOM.code(null, 'data-rel="dialog"'),
        ' attribute which gives me this inset look and a ',
        React.DOM.code(null, 'data-transition="pop"'),
        ' attribute to change the transition to pop. Without this, I\'d be styled as a normal page.'),
      JQueryMobileButton({href:'#one', 'data-rel':'back', className:'ui-btn ui-shadow ui-corner-all ui-btn-inline ui-icon-back ui-btn-icon-left'}, 'Back to page "one"')
    );
  }
});

// Render application.
React.renderComponent(App(null), document.getElementById('content'));

(function () {

  var Link0 = React.createClass({
    displayName: "Link0",

    render: function () {
      return React.createElement("a", { href: "/", className: "_5ljn", rel: undefined, onClick: function () {} });
    }
  });

  var ReactImage1 = React.createClass({
    displayName: "ReactImage1",

    render: function () {
      return React.createElement("i", { alt: "", className: "_3-99 img sp_UuU9HmrQ397 sx_7e56e9", src: null });
    }
  });

  var Link2 = React.createClass({
    displayName: "Link2",

    render: function () {
      return React.createElement(
        "a",
        { style: { "maxWidth": "200px" }, image: null, label: null, imageRight: {}, className: "_387r _55pi _2agf _387r _55pi _4jy0 _4jy3 _517h _51sy _42ft", href: "#", haschevron: true, onClick: function () {}, onToggle: function () {}, size: "medium", use: "default", borderShade: "light", suppressed: false, disabled: null, rel: undefined },
        null,
        React.createElement(
          "span",
          { className: "_55pe", style: { "maxWidth": "186px" } },
          null,
          "Dick Madanson (10149999073643408)"
        ),
        React.createElement(ReactImage1, null)
      );
    }
  });

  var AbstractButton3 = React.createClass({
    displayName: "AbstractButton3",

    render: function () {
      return React.createElement(Link2, null);
    }
  });

  var XUIButton4 = React.createClass({
    displayName: "XUIButton4",

    render: function () {
      return React.createElement(AbstractButton3, null);
    }
  });

  var AbstractPopoverButton5 = React.createClass({
    displayName: "AbstractPopoverButton5",

    render: function () {
      return React.createElement(XUIButton4, null);
    }
  });

  var ReactXUIPopoverButton6 = React.createClass({
    displayName: "ReactXUIPopoverButton6",

    render: function () {
      return React.createElement(AbstractPopoverButton5, null);
    }
  });

  var AdsPEAccountSelector7 = React.createClass({
    displayName: "AdsPEAccountSelector7",

    render: function () {
      return React.createElement(ReactXUIPopoverButton6, { ref: "button" });
    }
  });

  var AdsPEAccountSelectorContainer8 = React.createClass({
    displayName: "AdsPEAccountSelectorContainer8",

    render: function () {
      return React.createElement(AdsPEAccountSelector7, null);
    }
  });

  var AbstractButton9 = React.createClass({
    displayName: "AbstractButton9",

    render: function () {
      return React.createElement(
        "button",
        { id: "downloadButton", className: "_5lk0 _4jy0 _4jy3 _517h _51sy _42ft", label: null, onClick: function () {}, use: "default", size: "medium", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        "Download to Power Editor",
        undefined
      );
    }
  });

  var XUIButton10 = React.createClass({
    displayName: "XUIButton10",

    render: function () {
      return React.createElement(AbstractButton9, null);
    }
  });

  var DownloadUploadTimestamp11 = React.createClass({
    displayName: "DownloadUploadTimestamp11",

    render: function () {
      return React.createElement(
        "div",
        null,
        "Last downloaded",
        " ",
        React.createElement(
          "abbr",
          { className: "livetimestamp", "data-utime": 1446062352, "data-shorten": false },
          "a few seconds ago"
        )
      );
    }
  });

  var ReactImage12 = React.createClass({
    displayName: "ReactImage12",

    render: function () {
      return React.createElement("i", { alt: "", className: "_3-8_ img sp_UuU9HmrQ397 sx_dbc06a", src: null });
    }
  });

  var AbstractButton13 = React.createClass({
    displayName: "AbstractButton13",

    render: function () {
      return React.createElement(
        "button",
        { id: "uploadButton", className: "_5lk0 _4jy0 _4jy3 _517h _51sy _42ft", image: {}, use: "default", label: null, onClick: function () {}, size: "medium", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        React.createElement(ReactImage12, null),
        "Upload Changes",
        undefined
      );
    }
  });

  var XUIButton14 = React.createClass({
    displayName: "XUIButton14",

    render: function () {
      return React.createElement(AbstractButton13, null);
    }
  });

  var DownloadUploadTimestamp15 = React.createClass({
    displayName: "DownloadUploadTimestamp15",

    render: function () {
      return React.createElement("div", null);
    }
  });

  var AbstractButton16 = React.createClass({
    displayName: "AbstractButton16",

    render: function () {
      return React.createElement(
        "button",
        { className: "_5ljz _4jy0 _4jy3 _517h _51sy _42ft", label: null, onClick: function () {}, use: "default", size: "medium", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        "Help",
        undefined
      );
    }
  });

  var XUIButton17 = React.createClass({
    displayName: "XUIButton17",

    render: function () {
      return React.createElement(AbstractButton16, null);
    }
  });

  var ReactImage18 = React.createClass({
    displayName: "ReactImage18",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_d5a685" });
    }
  });

  var AbstractButton19 = React.createClass({
    displayName: "AbstractButton19",

    render: function () {
      return React.createElement(
        "button",
        { className: "_5ljw _p _4jy0 _4jy3 _517h _51sy _42ft", image: {}, use: "default", size: "medium", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage18, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton20 = React.createClass({
    displayName: "XUIButton20",

    render: function () {
      return React.createElement(AbstractButton19, null);
    }
  });

  var InlineBlock21 = React.createClass({
    displayName: "InlineBlock21",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5ljz uiPopover _6a _6b", alignh: "right", menu: {}, alignv: "middle", disabled: null, fullWidth: false },
        React.createElement(XUIButton20, { key: "/.0" })
      );
    }
  });

  var ReactPopoverMenu22 = React.createClass({
    displayName: "ReactPopoverMenu22",

    render: function () {
      return React.createElement(InlineBlock21, { ref: "root" });
    }
  });

  var XUIButtonGroup23 = React.createClass({
    displayName: "XUIButtonGroup23",

    render: function () {
      return React.createElement(
        "div",
        { className: "_13xj _51xa", id: "helpButton" },
        React.createElement(XUIButton17, null),
        React.createElement(ReactPopoverMenu22, null)
      );
    }
  });

  var AdsPEResetDialog24 = React.createClass({
    displayName: "AdsPEResetDialog24",

    render: function () {
      return React.createElement("span", null);
    }
  });

  var AdsPETopNav25 = React.createClass({
    displayName: "AdsPETopNav25",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5ljl", id: "ads_pe_top_nav" },
        React.createElement(
          "div",
          { ref: "logo", className: "_5ljm" },
          React.createElement(Link0, null),
          React.createElement(
            "div",
            { className: "_5rne" },
            React.createElement(
              "span",
              { className: "_5ljs", "data-testid": "PETopNavLogoText" },
              "Power Editor"
            )
          ),
          React.createElement(
            "span",
            { className: "_5ljt _5lju" },
            "Dick Madanson"
          )
        ),
        React.createElement(
          "div",
          { ref: "leftButtonGroup", className: "_5ljy" },
          React.createElement(
            "div",
            { ref: "accountDropdown", className: "_5ljz _5mun" },
            React.createElement(AdsPEAccountSelectorContainer8, null),
            React.createElement(
              "div",
              { className: "_5lj- _5lju" },
              "Account 10149999073643408"
            )
          ),
          React.createElement(
            "div",
            { className: "_5ljz" },
            React.createElement(
              "div",
              { className: "_5lj_" },
              React.createElement(XUIButton10, null)
            ),
            React.createElement(
              "div",
              { className: "_5lj- _5lju" },
              React.createElement(DownloadUploadTimestamp11, null)
            )
          ),
          React.createElement(
            "div",
            { className: "_5ljz" },
            React.createElement(
              "div",
              { className: "_5lj_" },
              React.createElement(XUIButton14, null)
            ),
            React.createElement(
              "div",
              { className: "_5lj- _5lju" },
              React.createElement(DownloadUploadTimestamp15, null)
            )
          )
        ),
        React.createElement(
          "div",
          { ref: "rightButtonGroup", className: "_5lk3" },
          React.createElement(XUIButtonGroup23, null)
        ),
        React.createElement(AdsPEResetDialog24, null)
      );
    }
  });

  var FluxContainer_ja_26 = React.createClass({
    displayName: "FluxContainer_ja_26",

    render: function () {
      return React.createElement(AdsPETopNav25, null);
    }
  });

  var _wrapper27 = React.createClass({
    displayName: "_wrapper27",

    render: function () {
      return React.createElement(
        "li",
        { selected: true, focused: false, tabIndex: null, hideFocusRing: true, onClick: function () {}, onMouseDown: function () {}, onFocus: function () {}, onBlur: function () {}, className: "_5vwz _5vwy _45hc _1hqh", wrapper: function () {}, shouldWrapTab: true, mockSpacebarClick: true, role: "presentation" },
        React.createElement(
          "a",
          { ref: "tab", ajaxify: undefined, href: "#", role: "tab", rel: undefined, target: undefined, tabIndex: 0, className: "", "aria-selected": true, onKeyDown: function () {} },
          React.createElement(
            "div",
            { className: "_4jq5" },
            "Manage Ads"
          ),
          React.createElement("span", { className: "_13xf" })
        )
      );
    }
  });

  var TabBarItem28 = React.createClass({
    displayName: "TabBarItem28",

    render: function () {
      return React.createElement(_wrapper27, null);
    }
  });

  var XUIPageNavigationItem29 = React.createClass({
    displayName: "XUIPageNavigationItem29",

    render: function () {
      return React.createElement(TabBarItem28, null);
    }
  });

  var TabBarItemWrapper30 = React.createClass({
    displayName: "TabBarItemWrapper30",

    render: function () {
      return React.createElement(XUIPageNavigationItem29, { key: "MANAGE_ADS" });
    }
  });

  var _wrapper31 = React.createClass({
    displayName: "_wrapper31",

    render: function () {
      return React.createElement(
        "li",
        { selected: false, focused: false, tabIndex: null, hideFocusRing: true, onClick: function () {}, onMouseDown: function () {}, onFocus: function () {}, onBlur: function () {}, className: "_5vwz _45hc", wrapper: function () {}, shouldWrapTab: true, mockSpacebarClick: true, role: "presentation" },
        React.createElement(
          "a",
          { ref: "tab", ajaxify: undefined, href: "#", role: "tab", rel: undefined, target: undefined, tabIndex: -1, className: "", "aria-selected": false, onKeyDown: function () {} },
          React.createElement(
            "div",
            { className: "_4jq5" },
            "Audiences"
          ),
          React.createElement("span", { className: "_13xf" })
        )
      );
    }
  });

  var TabBarItem32 = React.createClass({
    displayName: "TabBarItem32",

    render: function () {
      return React.createElement(_wrapper31, null);
    }
  });

  var XUIPageNavigationItem33 = React.createClass({
    displayName: "XUIPageNavigationItem33",

    render: function () {
      return React.createElement(TabBarItem32, null);
    }
  });

  var TabBarItemWrapper34 = React.createClass({
    displayName: "TabBarItemWrapper34",

    render: function () {
      return React.createElement(XUIPageNavigationItem33, { key: "AUDIENCES" });
    }
  });

  var _wrapper35 = React.createClass({
    displayName: "_wrapper35",

    render: function () {
      return React.createElement(
        "li",
        { selected: false, focused: false, tabIndex: null, hideFocusRing: true, onClick: function () {}, onMouseDown: function () {}, onFocus: function () {}, onBlur: function () {}, className: "_5vwz _45hc", wrapper: function () {}, shouldWrapTab: true, mockSpacebarClick: true, role: "presentation" },
        React.createElement(
          "a",
          { ref: "tab", ajaxify: undefined, href: "#", role: "tab", rel: undefined, target: undefined, tabIndex: -1, className: "", "aria-selected": false, onKeyDown: function () {} },
          React.createElement(
            "div",
            { className: "_4jq5" },
            "Image Library"
          ),
          React.createElement("span", { className: "_13xf" })
        )
      );
    }
  });

  var TabBarItem36 = React.createClass({
    displayName: "TabBarItem36",

    render: function () {
      return React.createElement(_wrapper35, null);
    }
  });

  var XUIPageNavigationItem37 = React.createClass({
    displayName: "XUIPageNavigationItem37",

    render: function () {
      return React.createElement(TabBarItem36, null);
    }
  });

  var TabBarItemWrapper38 = React.createClass({
    displayName: "TabBarItemWrapper38",

    render: function () {
      return React.createElement(XUIPageNavigationItem37, { key: "IMAGES" });
    }
  });

  var _wrapper39 = React.createClass({
    displayName: "_wrapper39",

    render: function () {
      return React.createElement(
        "li",
        { selected: false, focused: false, tabIndex: null, hideFocusRing: true, onClick: function () {}, onMouseDown: function () {}, onFocus: function () {}, onBlur: function () {}, className: "_5vwz _45hc", wrapper: function () {}, shouldWrapTab: true, mockSpacebarClick: true, role: "presentation" },
        React.createElement(
          "a",
          { ref: "tab", ajaxify: undefined, href: "#", role: "tab", rel: undefined, target: undefined, tabIndex: -1, className: "", "aria-selected": false, onKeyDown: function () {} },
          React.createElement(
            "div",
            { className: "_4jq5" },
            "Reporting",
            null
          ),
          React.createElement("span", { className: "_13xf" })
        )
      );
    }
  });

  var TabBarItem40 = React.createClass({
    displayName: "TabBarItem40",

    render: function () {
      return React.createElement(_wrapper39, null);
    }
  });

  var XUIPageNavigationItem41 = React.createClass({
    displayName: "XUIPageNavigationItem41",

    render: function () {
      return React.createElement(TabBarItem40, null);
    }
  });

  var TabBarItemWrapper42 = React.createClass({
    displayName: "TabBarItemWrapper42",

    render: function () {
      return React.createElement(XUIPageNavigationItem41, { key: "REPORTING" });
    }
  });

  var _wrapper43 = React.createClass({
    displayName: "_wrapper43",

    render: function () {
      return React.createElement(
        "li",
        { selected: false, focused: false, tabIndex: null, hideFocusRing: true, onClick: function () {}, onMouseDown: function () {}, onFocus: function () {}, onBlur: function () {}, className: "_5vwz _45hc", wrapper: function () {}, shouldWrapTab: true, mockSpacebarClick: true, role: "presentation" },
        React.createElement(
          "a",
          { ref: "tab", ajaxify: undefined, href: "#", role: "tab", rel: undefined, target: undefined, tabIndex: -1, className: "", "aria-selected": false, onKeyDown: function () {} },
          React.createElement(
            "div",
            { className: "_4jq5" },
            "Page Posts"
          ),
          React.createElement("span", { className: "_13xf" })
        )
      );
    }
  });

  var TabBarItem44 = React.createClass({
    displayName: "TabBarItem44",

    render: function () {
      return React.createElement(_wrapper43, null);
    }
  });

  var XUIPageNavigationItem45 = React.createClass({
    displayName: "XUIPageNavigationItem45",

    render: function () {
      return React.createElement(TabBarItem44, null);
    }
  });

  var TabBarItemWrapper46 = React.createClass({
    displayName: "TabBarItemWrapper46",

    render: function () {
      return React.createElement(XUIPageNavigationItem45, { key: "PAGES" });
    }
  });

  var TabBarItem47 = React.createClass({
    displayName: "TabBarItem47",

    render: function () {
      return React.createElement(
        "a",
        { ref: "tab", menuClassName: undefined, selected: false, focused: false, hideFocusRing: true, onMouseDown: function () {}, onFocus: function () {}, onBlur: function () {}, label: "Tools", tabComponent: function () {}, shouldWrapTab: false, className: "_45hd _45hc _p _45hc", tabIndex: -1, mockSpacebarClick: false, wrapper: function () {}, href: "#", role: "tab", "aria-selected": false },
        React.createElement(
          "span",
          { className: "_1b0" },
          "Tools",
          React.createElement(
            "span",
            { className: "accessible_elem" },
            "additional tabs menu"
          )
        )
      );
    }
  });

  var InlineBlock48 = React.createClass({
    displayName: "InlineBlock48",

    render: function () {
      return React.createElement(
        "div",
        { menu: {}, layerBehaviors: {}, alignv: "middle", className: "uiPopover _6a _6b", disabled: null, fullWidth: false },
        React.createElement(TabBarItem47, { key: "/.0" })
      );
    }
  });

  var ReactPopoverMenu49 = React.createClass({
    displayName: "ReactPopoverMenu49",

    render: function () {
      return React.createElement(InlineBlock48, { ref: "root" });
    }
  });

  var TabBarDropdownItem50 = React.createClass({
    displayName: "TabBarDropdownItem50",

    render: function () {
      return React.createElement(
        "li",
        { className: " _45hd", role: "tab" },
        React.createElement(ReactPopoverMenu49, null)
      );
    }
  });

  var TabBar51 = React.createClass({
    displayName: "TabBar51",

    render: function () {
      return React.createElement(
        "ul",
        { onTabClick: function () {}, activeTabKey: "MANAGE_ADS", onWidthCalculated: function () {}, width: null, maxTabsVisible: 5, moreLabel: "Tools", alwaysShowActive: true, dropdownTabComponent: function () {}, shouldCalculateVisibleTabs: true, className: "_43o4", role: "tablist", onKeyDown: function () {}, onKeyUp: function () {} },
        React.createElement(TabBarItemWrapper30, { key: "MANAGE_ADS" }),
        React.createElement(TabBarItemWrapper34, { key: "AUDIENCES" }),
        React.createElement(TabBarItemWrapper38, { key: "IMAGES" }),
        React.createElement(TabBarItemWrapper42, { key: "REPORTING" }),
        React.createElement(TabBarItemWrapper46, { key: "PAGES" }),
        React.createElement(TabBarDropdownItem50, { key: "_dropdown", ref: "more" })
      );
    }
  });

  var XUIPageNavigationGroup52 = React.createClass({
    displayName: "XUIPageNavigationGroup52",

    render: function () {
      return React.createElement(TabBar51, { ref: "bar" });
    }
  });

  var LeftRight53 = React.createClass({
    displayName: "LeftRight53",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5vx7 clearfix" },
        React.createElement(
          "div",
          { key: "left", className: "_ohe lfloat" },
          React.createElement(XUIPageNavigationGroup52, { key: "0", ref: "left" })
        ),
        null
      );
    }
  });

  var XUIPageNavigation54 = React.createClass({
    displayName: "XUIPageNavigation54",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5vx2 _5vx4 _5vx6 _5kkt" },
        React.createElement(LeftRight53, null)
      );
    }
  });

  var AdsPENavigationBar55 = React.createClass({
    displayName: "AdsPENavigationBar55",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5_a", id: "ads_pe_navigation_bar" },
        React.createElement(XUIPageNavigation54, null)
      );
    }
  });

  var FluxContainer_w_56 = React.createClass({
    displayName: "FluxContainer_w_56",

    render: function () {
      return React.createElement(AdsPENavigationBar55, null);
    }
  });

  var ReactImage57 = React.createClass({
    displayName: "ReactImage57",

    render: function () {
      return React.createElement(
        "i",
        { alt: "Warning", className: "_585p img sp_R48dKBxiJkP sx_aed870", src: null },
        React.createElement(
          "u",
          null,
          "Warning"
        )
      );
    }
  });

  var Link58 = React.createClass({
    displayName: "Link58",

    render: function () {
      return React.createElement(
        "a",
        { className: "_585q _50zy _50-0 _50z- _5upp _42ft", href: "#", onClick: function () {}, size: "medium", shade: "dark", type: null, label: null, title: "Remove", "aria-label": undefined, "data-hover": undefined, "data-tooltip-alignh": undefined, disabled: null, rel: undefined },
        undefined,
        "Remove",
        undefined
      );
    }
  });

  var AbstractButton59 = React.createClass({
    displayName: "AbstractButton59",

    render: function () {
      return React.createElement(Link58, null);
    }
  });

  var XUIAbstractGlyphButton60 = React.createClass({
    displayName: "XUIAbstractGlyphButton60",

    render: function () {
      return React.createElement(AbstractButton59, null);
    }
  });

  var XUICloseButton61 = React.createClass({
    displayName: "XUICloseButton61",

    render: function () {
      return React.createElement(XUIAbstractGlyphButton60, null);
    }
  });

  var XUIText62 = React.createClass({
    displayName: "XUIText62",

    render: function () {
      return React.createElement(
        "span",
        { weight: "bold", size: "inherit", display: "inline", className: " _50f7" },
        "Ads Manager"
      );
    }
  });

  var Link63 = React.createClass({
    displayName: "Link63",

    render: function () {
      return React.createElement(
        "a",
        { href: "/ads/manage/billing.php?act=10149999073643408", target: "_blank", rel: undefined, onClick: function () {} },
        React.createElement(XUIText62, null)
      );
    }
  });

  var XUINotice64 = React.createClass({
    displayName: "XUINotice64",

    render: function () {
      return React.createElement(
        "div",
        { size: "medium", className: "_585n _585o _2wdd" },
        React.createElement(ReactImage57, null),
        React.createElement(XUICloseButton61, null),
        React.createElement(
          "div",
          { className: "_585r _2i-a _50f4" },
          "Please go to ",
          React.createElement(Link63, null),
          " to set up a payment method for this ad account."
        )
      );
    }
  });

  var ReactCSSTransitionGroupChild65 = React.createClass({
    displayName: "ReactCSSTransitionGroupChild65",

    render: function () {
      return React.createElement(XUINotice64, null);
    }
  });

  var ReactTransitionGroup66 = React.createClass({
    displayName: "ReactTransitionGroup66",

    render: function () {
      return React.createElement(
        "span",
        { transitionEnterTimeout: 500, transitionLeaveTimeout: 500, transitionName: {}, transitionAppear: false, transitionEnter: true, transitionLeave: true, childFactory: function () {}, component: "span" },
        React.createElement(ReactCSSTransitionGroupChild65, { key: ".0", ref: ".0" })
      );
    }
  });

  var ReactCSSTransitionGroup67 = React.createClass({
    displayName: "ReactCSSTransitionGroup67",

    render: function () {
      return React.createElement(ReactTransitionGroup66, null);
    }
  });

  var AdsPETopError68 = React.createClass({
    displayName: "AdsPETopError68",

    render: function () {
      return React.createElement(
        "div",
        { className: "_2wdc" },
        React.createElement(ReactCSSTransitionGroup67, null)
      );
    }
  });

  var FluxContainer_r_69 = React.createClass({
    displayName: "FluxContainer_r_69",

    render: function () {
      return React.createElement(AdsPETopError68, null);
    }
  });

  var ReactImage70 = React.createClass({
    displayName: "ReactImage70",

    render: function () {
      return React.createElement("i", { className: "_3-8_ img sp_UuU9HmrQ397 sx_bae57d", src: null });
    }
  });

  var ReactImage71 = React.createClass({
    displayName: "ReactImage71",

    render: function () {
      return React.createElement("i", { alt: "", className: "_3-99 img sp_UuU9HmrQ397 sx_7e56e9", src: null });
    }
  });

  var Link72 = React.createClass({
    displayName: "Link72",

    render: function () {
      return React.createElement(
        "a",
        { style: { "maxWidth": "200px" }, image: null, label: null, imageRight: {}, className: " _5bbf _55pi _2agf  _5bbf _55pi _4jy0 _4jy4 _517h _51sy _42ft", href: "#", haschevron: true, onClick: function () {}, size: "large", use: "default", borderShade: "light", suppressed: false, disabled: null, rel: undefined },
        null,
        React.createElement(
          "span",
          { className: "_55pe", style: { "maxWidth": "186px" } },
          React.createElement(ReactImage70, null),
          "Search"
        ),
        React.createElement(ReactImage71, null)
      );
    }
  });

  var AbstractButton73 = React.createClass({
    displayName: "AbstractButton73",

    render: function () {
      return React.createElement(Link72, null);
    }
  });

  var XUIButton74 = React.createClass({
    displayName: "XUIButton74",

    render: function () {
      return React.createElement(AbstractButton73, null);
    }
  });

  var AbstractPopoverButton75 = React.createClass({
    displayName: "AbstractPopoverButton75",

    render: function () {
      return React.createElement(XUIButton74, null);
    }
  });

  var ReactXUIPopoverButton76 = React.createClass({
    displayName: "ReactXUIPopoverButton76",

    render: function () {
      return React.createElement(AbstractPopoverButton75, null);
    }
  });

  var ReactImage77 = React.createClass({
    displayName: "ReactImage77",

    render: function () {
      return React.createElement("i", { className: "_3-8_ img sp_UuU9HmrQ397 sx_81d5f0", src: null });
    }
  });

  var ReactImage78 = React.createClass({
    displayName: "ReactImage78",

    render: function () {
      return React.createElement("i", { alt: "", className: "_3-99 img sp_UuU9HmrQ397 sx_7e56e9", src: null });
    }
  });

  var Link79 = React.createClass({
    displayName: "Link79",

    render: function () {
      return React.createElement(
        "a",
        { style: { "maxWidth": "200px" }, image: null, label: null, imageRight: {}, className: " _5bbf _55pi _2agf  _5bbf _55pi _4jy0 _4jy4 _517h _51sy _42ft", href: "#", haschevron: true, onClick: function () {}, size: "large", use: "default", borderShade: "light", suppressed: false, disabled: null, rel: undefined },
        null,
        React.createElement(
          "span",
          { className: "_55pe", style: { "maxWidth": "186px" } },
          React.createElement(ReactImage77, null),
          "Filters"
        ),
        React.createElement(ReactImage78, null)
      );
    }
  });

  var AbstractButton80 = React.createClass({
    displayName: "AbstractButton80",

    render: function () {
      return React.createElement(Link79, null);
    }
  });

  var XUIButton81 = React.createClass({
    displayName: "XUIButton81",

    render: function () {
      return React.createElement(AbstractButton80, null);
    }
  });

  var AbstractPopoverButton82 = React.createClass({
    displayName: "AbstractPopoverButton82",

    render: function () {
      return React.createElement(XUIButton81, null);
    }
  });

  var ReactXUIPopoverButton83 = React.createClass({
    displayName: "ReactXUIPopoverButton83",

    render: function () {
      return React.createElement(AbstractPopoverButton82, null);
    }
  });

  var AdsPEFiltersPopover84 = React.createClass({
    displayName: "AdsPEFiltersPopover84",

    render: function () {
      return React.createElement(
        "span",
        { className: "_5b-l  _5bbe" },
        React.createElement(ReactXUIPopoverButton76, { ref: "searchButton" }),
        React.createElement(ReactXUIPopoverButton83, { ref: "filterButton" })
      );
    }
  });

  var ReactImage85 = React.createClass({
    displayName: "ReactImage85",

    render: function () {
      return React.createElement("i", { className: "_3yz6 _5whs img sp_UuU9HmrQ397 sx_5fe5c2", src: null });
    }
  });

  var AbstractButton86 = React.createClass({
    displayName: "AbstractButton86",

    render: function () {
      return React.createElement(
        "button",
        { className: "_3yz9 _1t-2 _50z_ _50zy _50zz _50z- _5upp _42ft", size: "small", onClick: function () {}, shade: "dark", type: "button", label: null, title: "Remove", "aria-label": undefined, "data-hover": undefined, "data-tooltip-alignh": undefined },
        undefined,
        "Remove",
        undefined
      );
    }
  });

  var XUIAbstractGlyphButton87 = React.createClass({
    displayName: "XUIAbstractGlyphButton87",

    render: function () {
      return React.createElement(AbstractButton86, null);
    }
  });

  var XUICloseButton88 = React.createClass({
    displayName: "XUICloseButton88",

    render: function () {
      return React.createElement(XUIAbstractGlyphButton87, null);
    }
  });

  var ReactImage89 = React.createClass({
    displayName: "ReactImage89",

    render: function () {
      return React.createElement("i", { className: "_5b5p _4gem img sp_UuU9HmrQ397 sx_5fe5c2", src: null });
    }
  });

  var ReactImage90 = React.createClass({
    displayName: "ReactImage90",

    render: function () {
      return React.createElement("i", { src: null, className: "_541d img sp_R48dKBxiJkP sx_dc2cdb" });
    }
  });

  var AdsPopoverLink91 = React.createClass({
    displayName: "AdsPopoverLink91",

    render: function () {
      return React.createElement(
        "span",
        { ref: "tipIcon", onMouseEnter: function () {}, onMouseLeave: function () {} },
        React.createElement("span", { className: "_3o_j" }),
        React.createElement(ReactImage90, null)
      );
    }
  });

  var AdsHelpLink92 = React.createClass({
    displayName: "AdsHelpLink92",

    render: function () {
      return React.createElement(AdsPopoverLink91, null);
    }
  });

  var AbstractButton93 = React.createClass({
    displayName: "AbstractButton93",

    render: function () {
      return React.createElement(
        "button",
        { className: "_5b5u _5b5v _4jy0 _4jy3 _517h _51sy _42ft", label: null, use: "default", onClick: function () {}, size: "medium", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        "Apply",
        undefined
      );
    }
  });

  var XUIButton94 = React.createClass({
    displayName: "XUIButton94",

    render: function () {
      return React.createElement(AbstractButton93, null);
    }
  });

  var BUIFilterTokenInput95 = React.createClass({
    displayName: "BUIFilterTokenInput95",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5b5o _3yz3 _4cld" },
        React.createElement(
          "div",
          { className: "_5b5t _2d2k" },
          React.createElement(ReactImage89, null),
          React.createElement(
            "div",
            { className: "_5b5r" },
            "Ads: (1)",
            React.createElement(AdsHelpLink92, null)
          )
        ),
        React.createElement(XUIButton94, null)
      );
    }
  });

  var BUIFilterToken96 = React.createClass({
    displayName: "BUIFilterToken96",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3yz1 _3yz2 _3dad" },
        React.createElement(
          "div",
          { ref: "filterToken", className: "_3yz4", "aria-hidden": false },
          React.createElement(
            "div",
            { onClick: function () {}, className: "_3yz5" },
            React.createElement(ReactImage85, null),
            React.createElement(
              "div",
              { className: "_3yz7" },
              "Ads:"
            ),
            React.createElement(
              "div",
              { className: "ellipsis _3yz8", "data-hover": "tooltip", "data-tooltip-display": "overflow" },
              "(1)"
            )
          ),
          React.createElement(XUICloseButton88, null)
        ),
        React.createElement(BUIFilterTokenInput95, { ref: "filterTokenInput" })
      );
    }
  });

  var ReactImage97 = React.createClass({
    displayName: "ReactImage97",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_158e8d" });
    }
  });

  var AbstractButton98 = React.createClass({
    displayName: "AbstractButton98",

    render: function () {
      return React.createElement(
        "button",
        { className: "_1wdf _4jy0 _517i _517h _51sy _42ft", size: "small", onClick: function () {}, image: {}, use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage97, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton99 = React.createClass({
    displayName: "XUIButton99",

    render: function () {
      return React.createElement(AbstractButton98, null);
    }
  });

  var BUIFilterTokenCreateButton100 = React.createClass({
    displayName: "BUIFilterTokenCreateButton100",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1tc" },
        React.createElement(XUIButton99, null)
      );
    }
  });

  var BUIFilterTokenizer101 = React.createClass({
    displayName: "BUIFilterTokenizer101",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5b-m _3o1v clearfix" },
        undefined,
        [],
        React.createElement(BUIFilterToken96, { key: "token0" }),
        React.createElement(BUIFilterTokenCreateButton100, null),
        null,
        React.createElement("div", { className: "_49u3" })
      );
    }
  });

  var AdsPEAmbientNUXMegaphone102 = React.createClass({
    displayName: "AdsPEAmbientNUXMegaphone102",

    render: function () {
      return React.createElement("span", { ref: "mainChild" });
    }
  });

  var AdsPEFilters103 = React.createClass({
    displayName: "AdsPEFilters103",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4rw_" },
        React.createElement(AdsPEFiltersPopover84, null),
        null,
        React.createElement(BUIFilterTokenizer101, null),
        "",
        React.createElement(AdsPEAmbientNUXMegaphone102, null)
      );
    }
  });

  var AdsPEFilterContainer104 = React.createClass({
    displayName: "AdsPEFilterContainer104",

    render: function () {
      return React.createElement(AdsPEFilters103, null);
    }
  });

  var AdsPECampaignTimeLimitNotice105 = React.createClass({
    displayName: "AdsPECampaignTimeLimitNotice105",

    render: function () {
      return React.createElement("div", null);
    }
  });

  var AdsPECampaignTimeLimitNoticeContainer106 = React.createClass({
    displayName: "AdsPECampaignTimeLimitNoticeContainer106",

    render: function () {
      return React.createElement(AdsPECampaignTimeLimitNotice105, null);
    }
  });

  var AdsPETablePager107 = React.createClass({
    displayName: "AdsPETablePager107",

    render: function () {
      return null;
    }
  });

  var AdsPEAdgroupTablePagerContainer108 = React.createClass({
    displayName: "AdsPEAdgroupTablePagerContainer108",

    render: function () {
      return React.createElement(AdsPETablePager107, null);
    }
  });

  var AdsPETablePagerContainer109 = React.createClass({
    displayName: "AdsPETablePagerContainer109",

    render: function () {
      return React.createElement(AdsPEAdgroupTablePagerContainer108, null);
    }
  });

  var ReactImage110 = React.createClass({
    displayName: "ReactImage110",

    render: function () {
      return React.createElement("i", { alt: "", className: "_3-99 img sp_UuU9HmrQ397 sx_132804", src: null });
    }
  });

  var Link111 = React.createClass({
    displayName: "Link111",

    render: function () {
      return React.createElement(
        "a",
        { style: { "maxWidth": "200px" }, image: null, label: null, imageRight: {}, className: "_55pi _2agf _55pi _4jy0 _4jy4 _517h _51sy _42ft", href: "#", disabled: null, maxwidth: undefined, size: "large", suppressed: false, chevron: {}, use: "default", borderShade: "light", onClick: function () {}, rel: undefined },
        null,
        React.createElement(
          "span",
          { className: "_55pe", style: { "maxWidth": "186px" } },
          null,
          "Lifetime"
        ),
        React.createElement(ReactImage110, null)
      );
    }
  });

  var AbstractButton112 = React.createClass({
    displayName: "AbstractButton112",

    render: function () {
      return React.createElement(Link111, null);
    }
  });

  var XUIButton113 = React.createClass({
    displayName: "XUIButton113",

    render: function () {
      return React.createElement(AbstractButton112, null);
    }
  });

  var AbstractPopoverButton114 = React.createClass({
    displayName: "AbstractPopoverButton114",

    render: function () {
      return React.createElement(XUIButton113, null);
    }
  });

  var ReactXUIPopoverButton115 = React.createClass({
    displayName: "ReactXUIPopoverButton115",

    render: function () {
      return React.createElement(AbstractPopoverButton114, null);
    }
  });

  var XUISingleSelectorButton116 = React.createClass({
    displayName: "XUISingleSelectorButton116",

    render: function () {
      return React.createElement(ReactXUIPopoverButton115, null);
    }
  });

  var InlineBlock117 = React.createClass({
    displayName: "InlineBlock117",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3c5o _3c5p _6a _6b", defaultValue: "LIFETIME", size: "large", onChange: function () {}, disabled: false, alignv: "middle", fullWidth: false },
        React.createElement("input", { type: "hidden", autoComplete: "off", name: undefined, value: "LIFETIME" }),
        React.createElement(XUISingleSelectorButton116, { ref: "button" })
      );
    }
  });

  var XUISingleSelector118 = React.createClass({
    displayName: "XUISingleSelector118",

    render: function () {
      return React.createElement(InlineBlock117, null);
    }
  });

  var ReactImage119 = React.createClass({
    displayName: "ReactImage119",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_6c732d" });
    }
  });

  var AbstractButton120 = React.createClass({
    displayName: "AbstractButton120",

    render: function () {
      return React.createElement(
        "button",
        { "aria-label": "List Settings", className: "_u_k _3c5o _1-r0 _4jy0 _4jy4 _517h _51sy _42ft", "data-hover": "tooltip", image: {}, size: "large", onClick: function () {}, use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage119, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton121 = React.createClass({
    displayName: "XUIButton121",

    render: function () {
      return React.createElement(AbstractButton120, null);
    }
  });

  var AdsPEStatRange122 = React.createClass({
    displayName: "AdsPEStatRange122",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3c5k" },
        React.createElement(
          "span",
          { className: "_3c5j" },
          "Stats:"
        ),
        React.createElement(
          "span",
          { className: "_3c5l" },
          React.createElement(XUISingleSelector118, { key: "range" }),
          null,
          React.createElement(XUIButton121, { key: "settings" })
        )
      );
    }
  });

  var AdsPEStatRangeContainer123 = React.createClass({
    displayName: "AdsPEStatRangeContainer123",

    render: function () {
      return React.createElement(AdsPEStatRange122, null);
    }
  });

  var Column124 = React.createClass({
    displayName: "Column124",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4bl8 _4bl7" },
        React.createElement(
          "div",
          { className: "_3c5f" },
          null,
          React.createElement(AdsPETablePagerContainer109, null),
          React.createElement("div", { className: "_3c5i" }),
          React.createElement(AdsPEStatRangeContainer123, null)
        )
      );
    }
  });

  var ReactImage125 = React.createClass({
    displayName: "ReactImage125",

    render: function () {
      return React.createElement("i", { alt: "", className: "_3-8_ img sp_UuU9HmrQ397 sx_158e8d", src: null });
    }
  });

  var AbstractButton126 = React.createClass({
    displayName: "AbstractButton126",

    render: function () {
      return React.createElement(
        "button",
        { className: "_u_k _4jy0 _4jy4 _517h _51sy _42ft", label: null, size: "large", onClick: function () {}, image: {}, use: "default", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        React.createElement(ReactImage125, null),
        "Create Ad",
        undefined
      );
    }
  });

  var XUIButton127 = React.createClass({
    displayName: "XUIButton127",

    render: function () {
      return React.createElement(AbstractButton126, null);
    }
  });

  var ReactImage128 = React.createClass({
    displayName: "ReactImage128",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_d5a685" });
    }
  });

  var AbstractButton129 = React.createClass({
    displayName: "AbstractButton129",

    render: function () {
      return React.createElement(
        "button",
        { className: "_u_k _p _4jy0 _4jy4 _517h _51sy _42ft", image: {}, size: "large", use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage128, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton130 = React.createClass({
    displayName: "XUIButton130",

    render: function () {
      return React.createElement(AbstractButton129, null);
    }
  });

  var InlineBlock131 = React.createClass({
    displayName: "InlineBlock131",

    render: function () {
      return React.createElement(
        "div",
        { menu: {}, alignh: "right", layerBehaviors: {}, alignv: "middle", className: "uiPopover _6a _6b", disabled: null, fullWidth: false },
        React.createElement(XUIButton130, { key: "/.0" })
      );
    }
  });

  var ReactPopoverMenu132 = React.createClass({
    displayName: "ReactPopoverMenu132",

    render: function () {
      return React.createElement(InlineBlock131, { ref: "root" });
    }
  });

  var XUIButtonGroup133 = React.createClass({
    displayName: "XUIButtonGroup133",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5n7z _51xa" },
        React.createElement(XUIButton127, null),
        React.createElement(ReactPopoverMenu132, null)
      );
    }
  });

  var ReactImage134 = React.createClass({
    displayName: "ReactImage134",

    render: function () {
      return React.createElement("i", { alt: "", className: "_3-8_ img sp_UuU9HmrQ397 sx_990b54", src: null });
    }
  });

  var AbstractButton135 = React.createClass({
    displayName: "AbstractButton135",

    render: function () {
      return React.createElement(
        "button",
        { size: "large", disabled: false, className: "_d2_ _u_k _5n7z _4jy0 _4jy4 _517h _51sy _42ft", image: {}, "data-hover": "tooltip", "aria-label": "Edit Ads (Ctrl+U)", onClick: function () {}, use: "default", label: null, borderShade: "light", suppressed: false, type: "submit", value: "1" },
        React.createElement(ReactImage134, null),
        "Edit",
        undefined
      );
    }
  });

  var XUIButton136 = React.createClass({
    displayName: "XUIButton136",

    render: function () {
      return React.createElement(AbstractButton135, null);
    }
  });

  var ReactImage137 = React.createClass({
    displayName: "ReactImage137",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_203adb" });
    }
  });

  var AbstractButton138 = React.createClass({
    displayName: "AbstractButton138",

    render: function () {
      return React.createElement(
        "button",
        { "aria-label": "Duplicate", className: "_u_k _4jy0 _4jy4 _517h _51sy _42ft", "data-hover": "tooltip", disabled: false, image: {}, size: "large", onClick: function () {}, use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage137, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton139 = React.createClass({
    displayName: "XUIButton139",

    render: function () {
      return React.createElement(AbstractButton138, null);
    }
  });

  var ReactImage140 = React.createClass({
    displayName: "ReactImage140",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_0c342e" });
    }
  });

  var AbstractButton141 = React.createClass({
    displayName: "AbstractButton141",

    render: function () {
      return React.createElement(
        "button",
        { "aria-label": "Revert", className: "_u_k _4jy0 _4jy4 _517h _51sy _42ft _42fr", "data-hover": "tooltip", disabled: true, image: {}, size: "large", onClick: function () {}, use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage140, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton142 = React.createClass({
    displayName: "XUIButton142",

    render: function () {
      return React.createElement(AbstractButton141, null);
    }
  });

  var ReactImage143 = React.createClass({
    displayName: "ReactImage143",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_0e75f5" });
    }
  });

  var AbstractButton144 = React.createClass({
    displayName: "AbstractButton144",

    render: function () {
      return React.createElement(
        "button",
        { "aria-label": "Delete", className: "_u_k _4jy0 _4jy4 _517h _51sy _42ft", image: {}, "data-hover": "tooltip", disabled: false, size: "large", onClick: function () {}, use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage143, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton145 = React.createClass({
    displayName: "XUIButton145",

    render: function () {
      return React.createElement(AbstractButton144, null);
    }
  });

  var XUIButtonGroup146 = React.createClass({
    displayName: "XUIButtonGroup146",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5n7z _51xa" },
        React.createElement(XUIButton139, { key: "duplicate" }),
        React.createElement(XUIButton142, { key: "revert" }),
        React.createElement(XUIButton145, { key: "delete" })
      );
    }
  });

  var ReactImage147 = React.createClass({
    displayName: "ReactImage147",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_8c19ae" });
    }
  });

  var AbstractButton148 = React.createClass({
    displayName: "AbstractButton148",

    render: function () {
      return React.createElement(
        "button",
        { size: "large", disabled: false, className: "_u_k _4jy0 _4jy4 _517h _51sy _42ft", image: {}, "data-hover": "tooltip", "aria-label": "Save Audience", onClick: function () {}, use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage147, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton149 = React.createClass({
    displayName: "XUIButton149",

    render: function () {
      return React.createElement(AbstractButton148, null);
    }
  });

  var ReactImage150 = React.createClass({
    displayName: "ReactImage150",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_d2b33c" });
    }
  });

  var AbstractButton151 = React.createClass({
    displayName: "AbstractButton151",

    render: function () {
      return React.createElement(
        "button",
        { size: "large", className: "_u_k noMargin _p _4jy0 _4jy4 _517h _51sy _42ft", onClick: function () {}, image: {}, "data-hover": "tooltip", "aria-label": "Export & Import", use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage150, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton152 = React.createClass({
    displayName: "XUIButton152",

    render: function () {
      return React.createElement(AbstractButton151, null);
    }
  });

  var InlineBlock153 = React.createClass({
    displayName: "InlineBlock153",

    render: function () {
      return React.createElement(
        "div",
        { menu: {}, size: "large", alignv: "middle", className: "uiPopover _6a _6b", disabled: null, fullWidth: false },
        React.createElement(XUIButton152, { key: "/.0" })
      );
    }
  });

  var ReactPopoverMenu154 = React.createClass({
    displayName: "ReactPopoverMenu154",

    render: function () {
      return React.createElement(InlineBlock153, { ref: "root" });
    }
  });

  var AdsPEExportImportMenu155 = React.createClass({
    displayName: "AdsPEExportImportMenu155",

    render: function () {
      return React.createElement(ReactPopoverMenu154, { key: "export" });
    }
  });

  var FluxContainer_x_156 = React.createClass({
    displayName: "FluxContainer_x_156",

    render: function () {
      return null;
    }
  });

  var AdsPEExportAsTextDialog157 = React.createClass({
    displayName: "AdsPEExportAsTextDialog157",

    render: function () {
      return null;
    }
  });

  var FluxContainer_q_158 = React.createClass({
    displayName: "FluxContainer_q_158",

    render: function () {
      return React.createElement(AdsPEExportAsTextDialog157, null);
    }
  });

  var AdsPEExportImportMenuContainer159 = React.createClass({
    displayName: "AdsPEExportImportMenuContainer159",

    render: function () {
      return React.createElement(
        "span",
        null,
        React.createElement(AdsPEExportImportMenu155, null),
        React.createElement(FluxContainer_x_156, null),
        React.createElement(FluxContainer_q_158, null),
        null
      );
    }
  });

  var ReactImage160 = React.createClass({
    displayName: "ReactImage160",

    render: function () {
      return React.createElement("i", { src: null, className: "img sp_UuU9HmrQ397 sx_872db1" });
    }
  });

  var AbstractButton161 = React.createClass({
    displayName: "AbstractButton161",

    render: function () {
      return React.createElement(
        "button",
        { size: "large", disabled: false, onClick: function () {}, className: "_u_k _5n7z _4jy0 _4jy4 _517h _51sy _42ft", image: {}, style: { "boxSizing": "border-box", "height": "28px", "width": "48px" }, "data-hover": "tooltip", "aria-label": "Create Report", use: "default", borderShade: "light", suppressed: false, label: null, type: "submit", value: "1" },
        React.createElement(ReactImage160, null),
        undefined,
        undefined
      );
    }
  });

  var XUIButton162 = React.createClass({
    displayName: "XUIButton162",

    render: function () {
      return React.createElement(AbstractButton161, null);
    }
  });

  var AbstractButton163 = React.createClass({
    displayName: "AbstractButton163",

    render: function () {
      return React.createElement(
        "button",
        { size: "large", disabled: true, className: "hidden_elem _5n7z _4jy0 _4jy4 _517h _51sy _42ft _42fr", label: null, onClick: function () {}, use: "default", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        "Generate Variations",
        undefined
      );
    }
  });

  var XUIButton164 = React.createClass({
    displayName: "XUIButton164",

    render: function () {
      return React.createElement(AbstractButton163, null);
    }
  });

  var XUIButtonGroup165 = React.createClass({
    displayName: "XUIButtonGroup165",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5n7z _51xa" },
        React.createElement(XUIButton149, { key: "saveAudience" }),
        React.createElement(AdsPEExportImportMenuContainer159, null),
        React.createElement(XUIButton162, { key: "createReport", ref: "ads_create_report_button" }),
        React.createElement(XUIButton164, { key: "variations" })
      );
    }
  });

  var FillColumn166 = React.createClass({
    displayName: "FillColumn166",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4bl9" },
        React.createElement(
          "span",
          { className: "_3c5e" },
          React.createElement(
            "span",
            null,
            React.createElement(XUIButtonGroup133, null),
            React.createElement(XUIButton136, { key: "edit" }),
            React.createElement(XUIButtonGroup146, null)
          ),
          React.createElement(XUIButtonGroup165, null)
        )
      );
    }
  });

  var Layout167 = React.createClass({
    displayName: "Layout167",

    render: function () {
      return React.createElement(
        "div",
        { className: "clearfix" },
        React.createElement(Column124, { key: "1" }),
        React.createElement(FillColumn166, { key: "0" })
      );
    }
  });

  var AdsPEMainPaneToolbar168 = React.createClass({
    displayName: "AdsPEMainPaneToolbar168",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3c5b clearfix" },
        React.createElement(Layout167, null)
      );
    }
  });

  var AdsPEAdgroupToolbarContainer169 = React.createClass({
    displayName: "AdsPEAdgroupToolbarContainer169",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsPEMainPaneToolbar168, null),
        null
      );
    }
  });

  var AbstractButton170 = React.createClass({
    displayName: "AbstractButton170",

    render: function () {
      return React.createElement(
        "button",
        { className: "_tm3 _tm6 _4jy0 _4jy6 _517h _51sy _42ft", label: null, "data-tooltip-position": "right", "aria-label": "Campaigns", "data-hover": "tooltip", onClick: function () {}, size: "xxlarge", use: "default", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "_tma" }),
          React.createElement("div", { className: "_tm8" }),
          React.createElement(
            "div",
            { className: "_tm9" },
            1
          )
        ),
        undefined
      );
    }
  });

  var XUIButton171 = React.createClass({
    displayName: "XUIButton171",

    render: function () {
      return React.createElement(AbstractButton170, null);
    }
  });

  var AbstractButton172 = React.createClass({
    displayName: "AbstractButton172",

    render: function () {
      return React.createElement(
        "button",
        { className: "_tm4 _tm6 _4jy0 _4jy6 _517h _51sy _42ft", label: null, "data-tooltip-position": "right", "aria-label": "Ad Sets", "data-hover": "tooltip", onClick: function () {}, size: "xxlarge", use: "default", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "_tma" }),
          React.createElement("div", { className: "_tm8" }),
          React.createElement(
            "div",
            { className: "_tm9" },
            1
          )
        ),
        undefined
      );
    }
  });

  var XUIButton173 = React.createClass({
    displayName: "XUIButton173",

    render: function () {
      return React.createElement(AbstractButton172, null);
    }
  });

  var AbstractButton174 = React.createClass({
    displayName: "AbstractButton174",

    render: function () {
      return React.createElement(
        "button",
        { className: "_tm5 _tm6 _tm7 _4jy0 _4jy6 _517h _51sy _42ft", label: null, "data-tooltip-position": "right", "aria-label": "Ads", "data-hover": "tooltip", onClick: function () {}, size: "xxlarge", use: "default", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        React.createElement(
          "div",
          null,
          React.createElement("div", { className: "_tma" }),
          React.createElement("div", { className: "_tm8" }),
          React.createElement(
            "div",
            { className: "_tm9" },
            1
          )
        ),
        undefined
      );
    }
  });

  var XUIButton175 = React.createClass({
    displayName: "XUIButton175",

    render: function () {
      return React.createElement(AbstractButton174, null);
    }
  });

  var AdsPESimpleOrganizer176 = React.createClass({
    displayName: "AdsPESimpleOrganizer176",

    render: function () {
      return React.createElement(
        "div",
        { className: "_tm2" },
        React.createElement(XUIButton171, null),
        React.createElement(XUIButton173, null),
        React.createElement(XUIButton175, null)
      );
    }
  });

  var AdsPEOrganizerContainer177 = React.createClass({
    displayName: "AdsPEOrganizerContainer177",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsPESimpleOrganizer176, null)
      );
    }
  });

  var FixedDataTableColumnResizeHandle178 = React.createClass({
    displayName: "FixedDataTableColumnResizeHandle178",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3487 _3488 _3489", style: { "width": 0, "height": 532, "left": 0 } },
        React.createElement("div", { className: "_348a", style: { "height": 532 } })
      );
    }
  });

  var ReactImage179 = React.createClass({
    displayName: "ReactImage179",

    render: function () {
      return React.createElement("i", { className: "_1cie _1cif img sp_R48dKBxiJkP sx_dc0ad2", src: null });
    }
  });

  var AdsPETableHeader180 = React.createClass({
    displayName: "AdsPETableHeader180",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _1ksv _1vd7 _4h2r" },
        React.createElement(ReactImage179, null),
        React.createElement(
          "span",
          { className: "_1cid" },
          "Ads"
        )
      );
    }
  });

  var TransitionCell181 = React.createClass({
    displayName: "TransitionCell181",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Ads", dataKey: 0, groupHeaderRenderer: function () {}, groupHeaderLabels: {}, groupHeaderData: {}, columnKey: undefined, height: 40, width: 521, rowIndex: 0, className: "_4lgc _4h2u", style: { "height": 40, "width": 521 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader180, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell182 = React.createClass({
    displayName: "FixedDataTableCell182",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 40, "width": 521, "left": 0 } },
        undefined,
        React.createElement(TransitionCell181, null)
      );
    }
  });

  var FixedDataTableCellGroupImpl183 = React.createClass({
    displayName: "FixedDataTableCellGroupImpl183",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3pzj", style: { "height": 40, "position": "absolute", "width": 521, "zIndex": 2, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" } },
        React.createElement(FixedDataTableCell182, { key: "cell_0" })
      );
    }
  });

  var FixedDataTableCellGroup184 = React.createClass({
    displayName: "FixedDataTableCellGroup184",

    render: function () {
      return React.createElement(
        "div",
        { style: { "height": 40, "left": 0 }, className: "_3pzk" },
        React.createElement(FixedDataTableCellGroupImpl183, null)
      );
    }
  });

  var AdsPETableHeader185 = React.createClass({
    displayName: "AdsPETableHeader185",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _1vd7 _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Delivery"
        )
      );
    }
  });

  var TransitionCell186 = React.createClass({
    displayName: "TransitionCell186",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Delivery", dataKey: 1, groupHeaderRenderer: function () {}, groupHeaderLabels: {}, groupHeaderData: {}, columnKey: undefined, height: 40, width: 298, rowIndex: 0, className: "_4lgc _4h2u", style: { "height": 40, "width": 298 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader185, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell187 = React.createClass({
    displayName: "FixedDataTableCell187",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 40, "width": 298, "left": 0 } },
        undefined,
        React.createElement(TransitionCell186, null)
      );
    }
  });

  var AdsPETableHeader188 = React.createClass({
    displayName: "AdsPETableHeader188",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _1vd7 _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Performance"
        )
      );
    }
  });

  var TransitionCell189 = React.createClass({
    displayName: "TransitionCell189",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Performance", dataKey: 2, groupHeaderRenderer: function () {}, groupHeaderLabels: {}, groupHeaderData: {}, columnKey: undefined, height: 40, width: 490, rowIndex: 0, className: "_4lgc _4h2u", style: { "height": 40, "width": 490 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader188, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell190 = React.createClass({
    displayName: "FixedDataTableCell190",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 40, "width": 490, "left": 298 } },
        undefined,
        React.createElement(TransitionCell189, null)
      );
    }
  });

  var AdsPETableHeader191 = React.createClass({
    displayName: "AdsPETableHeader191",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _1vd7 _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Overview"
        )
      );
    }
  });

  var TransitionCell192 = React.createClass({
    displayName: "TransitionCell192",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Overview", dataKey: 3, groupHeaderRenderer: function () {}, groupHeaderLabels: {}, groupHeaderData: {}, columnKey: undefined, height: 40, width: 972, rowIndex: 0, className: "_4lgc _4h2u", style: { "height": 40, "width": 972 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader191, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell193 = React.createClass({
    displayName: "FixedDataTableCell193",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 40, "width": 972, "left": 788 } },
        undefined,
        React.createElement(TransitionCell192, null)
      );
    }
  });

  var AdsPETableHeader194 = React.createClass({
    displayName: "AdsPETableHeader194",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _1vd7 _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Creative Assets"
        )
      );
    }
  });

  var TransitionCell195 = React.createClass({
    displayName: "TransitionCell195",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Creative Assets", dataKey: 4, groupHeaderRenderer: function () {}, groupHeaderLabels: {}, groupHeaderData: {}, columnKey: undefined, height: 40, width: 514, rowIndex: 0, className: "_4lgc _4h2u", style: { "height": 40, "width": 514 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader194, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell196 = React.createClass({
    displayName: "FixedDataTableCell196",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 40, "width": 514, "left": 1760 } },
        undefined,
        React.createElement(TransitionCell195, null)
      );
    }
  });

  var AdsPETableHeader197 = React.createClass({
    displayName: "AdsPETableHeader197",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _1vd7 _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Toplines"
        )
      );
    }
  });

  var TransitionCell198 = React.createClass({
    displayName: "TransitionCell198",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Toplines", dataKey: 5, groupHeaderRenderer: function () {}, groupHeaderLabels: {}, groupHeaderData: {}, columnKey: undefined, height: 40, width: 0, rowIndex: 0, className: "_4lgc _4h2u", style: { "height": 40, "width": 0 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader197, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell199 = React.createClass({
    displayName: "FixedDataTableCell199",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 40, "width": 0, "left": 2274 } },
        undefined,
        React.createElement(TransitionCell198, null)
      );
    }
  });

  var AdsPETableHeader200 = React.createClass({
    displayName: "AdsPETableHeader200",

    render: function () {
      return React.createElement("div", { className: "_1cig _1vd7 _4h2r" });
    }
  });

  var TransitionCell201 = React.createClass({
    displayName: "TransitionCell201",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "", dataKey: 6, groupHeaderRenderer: function () {}, groupHeaderLabels: {}, groupHeaderData: {}, columnKey: undefined, height: 40, width: 25, rowIndex: 0, className: "_4lgc _4h2u", style: { "height": 40, "width": 25 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader200, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell202 = React.createClass({
    displayName: "FixedDataTableCell202",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 40, "width": 25, "left": 2274 } },
        undefined,
        React.createElement(TransitionCell201, null)
      );
    }
  });

  var FixedDataTableCellGroupImpl203 = React.createClass({
    displayName: "FixedDataTableCellGroupImpl203",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3pzj", style: { "height": 40, "position": "absolute", "width": 2299, "zIndex": 0, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" } },
        React.createElement(FixedDataTableCell187, { key: "cell_0" }),
        React.createElement(FixedDataTableCell190, { key: "cell_1" }),
        React.createElement(FixedDataTableCell193, { key: "cell_2" }),
        React.createElement(FixedDataTableCell196, { key: "cell_3" }),
        React.createElement(FixedDataTableCell199, { key: "cell_4" }),
        React.createElement(FixedDataTableCell202, { key: "cell_5" })
      );
    }
  });

  var FixedDataTableCellGroup204 = React.createClass({
    displayName: "FixedDataTableCellGroup204",

    render: function () {
      return React.createElement(
        "div",
        { style: { "height": 40, "left": 521 }, className: "_3pzk" },
        React.createElement(FixedDataTableCellGroupImpl203, null)
      );
    }
  });

  var FixedDataTableRowImpl205 = React.createClass({
    displayName: "FixedDataTableRowImpl205",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1gd4 _4li _52no _3h1a _1mib", onClick: null, onDoubleClick: null, onMouseDown: null, onMouseEnter: null, onMouseLeave: null, style: { "width": 1083, "height": 40 } },
        React.createElement(
          "div",
          { className: "_1gd5" },
          React.createElement(FixedDataTableCellGroup184, { key: "fixed_cells" }),
          React.createElement(FixedDataTableCellGroup204, { key: "scrollable_cells" }),
          React.createElement("div", { className: "_1gd6 _1gd8", style: { "left": 521, "height": 40 } })
        )
      );
    }
  });

  var FixedDataTableRow206 = React.createClass({
    displayName: "FixedDataTableRow206",

    render: function () {
      return React.createElement(
        "div",
        { style: { "width": 1083, "height": 40, "zIndex": 1, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" }, className: "_1gda" },
        React.createElement(FixedDataTableRowImpl205, null)
      );
    }
  });

  var AbstractCheckboxInput207 = React.createClass({
    displayName: "AbstractCheckboxInput207",

    render: function () {
      return React.createElement(
        "label",
        { className: "_4h2r _55sg _kv1" },
        React.createElement("input", { checked: undefined, onChange: function () {}, className: null, type: "checkbox" }),
        React.createElement("span", { "data-hover": null, "aria-label": undefined })
      );
    }
  });

  var XUICheckboxInput208 = React.createClass({
    displayName: "XUICheckboxInput208",

    render: function () {
      return React.createElement(AbstractCheckboxInput207, null);
    }
  });

  var TransitionCell209 = React.createClass({
    displayName: "TransitionCell209",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: undefined, width: 42, dataKey: "common.id", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "common.id", height: 25, style: { "height": 25, "width": 42 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(XUICheckboxInput208, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell210 = React.createClass({
    displayName: "FixedDataTableCell210",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg6 _4h2m", style: { "height": 25, "width": 42, "left": 0 } },
        undefined,
        React.createElement(TransitionCell209, null)
      );
    }
  });

  var AdsPETableHeader211 = React.createClass({
    displayName: "AdsPETableHeader211",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Ad Name"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader212 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader212",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader211, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader213 = React.createClass({
    displayName: "FixedDataTableSortableHeader213",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader212, null);
    }
  });

  var TransitionCell214 = React.createClass({
    displayName: "TransitionCell214",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Ad Name", width: 200, dataKey: "ad.name", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.name", height: 25, style: { "height": 25, "width": 200 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader213, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell215 = React.createClass({
    displayName: "FixedDataTableCell215",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 200, "left": 42 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell214, null)
      );
    }
  });

  var ReactImage216 = React.createClass({
    displayName: "ReactImage216",

    render: function () {
      return React.createElement("i", { className: "_1cie img sp_UuU9HmrQ397 sx_844e7d", src: null });
    }
  });

  var AdsPETableHeader217 = React.createClass({
    displayName: "AdsPETableHeader217",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        React.createElement(ReactImage216, null),
        null
      );
    }
  });

  var FixedDataTableAbstractSortableHeader218 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader218",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _1kst _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader217, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader219 = React.createClass({
    displayName: "FixedDataTableSortableHeader219",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader218, null);
    }
  });

  var TransitionCell220 = React.createClass({
    displayName: "TransitionCell220",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: undefined, width: 33, dataKey: "edit_status", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "edit_status", height: 25, style: { "height": 25, "width": 33 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader219, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell221 = React.createClass({
    displayName: "FixedDataTableCell221",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 33, "left": 242 } },
        undefined,
        React.createElement(TransitionCell220, null)
      );
    }
  });

  var ReactImage222 = React.createClass({
    displayName: "ReactImage222",

    render: function () {
      return React.createElement("i", { className: "_1cie img sp_UuU9HmrQ397 sx_36dc45", src: null });
    }
  });

  var AdsPETableHeader223 = React.createClass({
    displayName: "AdsPETableHeader223",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        React.createElement(ReactImage222, null),
        null
      );
    }
  });

  var FixedDataTableAbstractSortableHeader224 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader224",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _1kst _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader223, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader225 = React.createClass({
    displayName: "FixedDataTableSortableHeader225",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader224, null);
    }
  });

  var TransitionCell226 = React.createClass({
    displayName: "TransitionCell226",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: undefined, width: 36, dataKey: "errors", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "errors", height: 25, style: { "height": 25, "width": 36 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader225, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell227 = React.createClass({
    displayName: "FixedDataTableCell227",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 36, "left": 275 } },
        undefined,
        React.createElement(TransitionCell226, null)
      );
    }
  });

  var AdsPETableHeader228 = React.createClass({
    displayName: "AdsPETableHeader228",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Status"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader229 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader229",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader228, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader230 = React.createClass({
    displayName: "FixedDataTableSortableHeader230",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader229, null);
    }
  });

  var TransitionCell231 = React.createClass({
    displayName: "TransitionCell231",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Status", width: 60, dataKey: "ad.adgroup_status", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.adgroup_status", height: 25, style: { "height": 25, "width": 60 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader230, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell232 = React.createClass({
    displayName: "FixedDataTableCell232",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 60, "left": 311 } },
        undefined,
        React.createElement(TransitionCell231, null)
      );
    }
  });

  var AdsPETableHeader233 = React.createClass({
    displayName: "AdsPETableHeader233",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Delivery"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader234 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader234",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader233, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader235 = React.createClass({
    displayName: "FixedDataTableSortableHeader235",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader234, null);
    }
  });

  var TransitionCell236 = React.createClass({
    displayName: "TransitionCell236",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Delivery", width: 150, dataKey: "ukiAdData.computed_activity_status", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ukiAdData.computed_activity_status", height: 25, style: { "height": 25, "width": 150 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader235, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell237 = React.createClass({
    displayName: "FixedDataTableCell237",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 150, "left": 371 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell236, null)
      );
    }
  });

  var FixedDataTableCellGroupImpl238 = React.createClass({
    displayName: "FixedDataTableCellGroupImpl238",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3pzj", style: { "height": 25, "position": "absolute", "width": 521, "zIndex": 2, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" } },
        React.createElement(FixedDataTableCell210, { key: "cell_0" }),
        React.createElement(FixedDataTableCell215, { key: "cell_1" }),
        React.createElement(FixedDataTableCell221, { key: "cell_2" }),
        React.createElement(FixedDataTableCell227, { key: "cell_3" }),
        React.createElement(FixedDataTableCell232, { key: "cell_4" }),
        React.createElement(FixedDataTableCell237, { key: "cell_5" })
      );
    }
  });

  var FixedDataTableCellGroup239 = React.createClass({
    displayName: "FixedDataTableCellGroup239",

    render: function () {
      return React.createElement(
        "div",
        { style: { "height": 25, "left": 0 }, className: "_3pzk" },
        React.createElement(FixedDataTableCellGroupImpl238, null)
      );
    }
  });

  var AdsPETableHeader240 = React.createClass({
    displayName: "AdsPETableHeader240",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Reach"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader241 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader241",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader240, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader242 = React.createClass({
    displayName: "FixedDataTableSortableHeader242",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader241, null);
    }
  });

  var TransitionCell243 = React.createClass({
    displayName: "TransitionCell243",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Reach", width: 60, dataKey: "stats.unique_impressions", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.unique_impressions", height: 25, style: { "height": 25, "width": 60 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader242, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell244 = React.createClass({
    displayName: "FixedDataTableCell244",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 60, "left": 0 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell243, null)
      );
    }
  });

  var AdsPETableHeader245 = React.createClass({
    displayName: "AdsPETableHeader245",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Ad Impressions"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader246 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader246",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader245, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader247 = React.createClass({
    displayName: "FixedDataTableSortableHeader247",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader246, null);
    }
  });

  var TransitionCell248 = React.createClass({
    displayName: "TransitionCell248",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Ad Impressions", width: 80, dataKey: "stats.impressions", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.impressions", height: 25, style: { "height": 25, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader247, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell249 = React.createClass({
    displayName: "FixedDataTableCell249",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 80, "left": 60 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell248, null)
      );
    }
  });

  var AdsPETableHeader250 = React.createClass({
    displayName: "AdsPETableHeader250",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Avg. CPM"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader251 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader251",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader250, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader252 = React.createClass({
    displayName: "FixedDataTableSortableHeader252",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader251, null);
    }
  });

  var TransitionCell253 = React.createClass({
    displayName: "TransitionCell253",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Avg. CPM", width: 80, dataKey: "stats.avg_cpm", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.avg_cpm", height: 25, style: { "height": 25, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader252, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell254 = React.createClass({
    displayName: "FixedDataTableCell254",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 80, "left": 140 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell253, null)
      );
    }
  });

  var AdsPETableHeader255 = React.createClass({
    displayName: "AdsPETableHeader255",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Avg. CPC"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader256 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader256",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader255, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader257 = React.createClass({
    displayName: "FixedDataTableSortableHeader257",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader256, null);
    }
  });

  var TransitionCell258 = React.createClass({
    displayName: "TransitionCell258",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Avg. CPC", width: 78, dataKey: "stats.avg_cpc", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.avg_cpc", height: 25, style: { "height": 25, "width": 78 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader257, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell259 = React.createClass({
    displayName: "FixedDataTableCell259",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 78, "left": 220 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell258, null)
      );
    }
  });

  var AdsPETableHeader260 = React.createClass({
    displayName: "AdsPETableHeader260",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Results"
        )
      );
    }
  });

  var TransitionCell261 = React.createClass({
    displayName: "TransitionCell261",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Results", width: 140, dataKey: "stats.actions", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.actions", height: 25, style: { "height": 25, "width": 140 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader260, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell262 = React.createClass({
    displayName: "FixedDataTableCell262",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 140, "left": 298 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell261, null)
      );
    }
  });

  var AdsPETableHeader263 = React.createClass({
    displayName: "AdsPETableHeader263",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Cost"
        )
      );
    }
  });

  var TransitionCell264 = React.createClass({
    displayName: "TransitionCell264",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Cost", width: 140, dataKey: "stats.cpa", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.cpa", height: 25, style: { "height": 25, "width": 140 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader263, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell265 = React.createClass({
    displayName: "FixedDataTableCell265",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 140, "left": 438 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell264, null)
      );
    }
  });

  var AdsPETableHeader266 = React.createClass({
    displayName: "AdsPETableHeader266",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Clicks"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader267 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader267",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader266, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader268 = React.createClass({
    displayName: "FixedDataTableSortableHeader268",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader267, null);
    }
  });

  var TransitionCell269 = React.createClass({
    displayName: "TransitionCell269",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Clicks", width: 60, dataKey: "stats.clicks", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.clicks", height: 25, style: { "height": 25, "width": 60 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader268, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell270 = React.createClass({
    displayName: "FixedDataTableCell270",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 60, "left": 578 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell269, null)
      );
    }
  });

  var AdsPETableHeader271 = React.createClass({
    displayName: "AdsPETableHeader271",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "CTR %"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader272 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader272",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader271, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader273 = React.createClass({
    displayName: "FixedDataTableSortableHeader273",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader272, null);
    }
  });

  var TransitionCell274 = React.createClass({
    displayName: "TransitionCell274",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "CTR %", width: 70, dataKey: "stats.ctr", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.ctr", height: 25, style: { "height": 25, "width": 70 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader273, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell275 = React.createClass({
    displayName: "FixedDataTableCell275",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 70, "left": 638 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell274, null)
      );
    }
  });

  var AdsPETableHeader276 = React.createClass({
    displayName: "AdsPETableHeader276",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Social %"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader277 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader277",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader276, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader278 = React.createClass({
    displayName: "FixedDataTableSortableHeader278",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader277, null);
    }
  });

  var TransitionCell279 = React.createClass({
    displayName: "TransitionCell279",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Social %", width: 80, dataKey: "stats.social_percent", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.social_percent", height: 25, style: { "height": 25, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader278, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell280 = React.createClass({
    displayName: "FixedDataTableCell280",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 80, "left": 708 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell279, null)
      );
    }
  });

  var AdsPETableHeader281 = React.createClass({
    displayName: "AdsPETableHeader281",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Ad Set Name"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader282 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader282",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader281, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader283 = React.createClass({
    displayName: "FixedDataTableSortableHeader283",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader282, null);
    }
  });

  var TransitionCell284 = React.createClass({
    displayName: "TransitionCell284",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Ad Set Name", width: 100, dataKey: "campaign.name", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "campaign.name", height: 25, style: { "height": 25, "width": 100 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader283, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell285 = React.createClass({
    displayName: "FixedDataTableCell285",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 100, "left": 788 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell284, null)
      );
    }
  });

  var AdsPETableHeader286 = React.createClass({
    displayName: "AdsPETableHeader286",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Campaign Name"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader287 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader287",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader286, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader288 = React.createClass({
    displayName: "FixedDataTableSortableHeader288",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader287, null);
    }
  });

  var TransitionCell289 = React.createClass({
    displayName: "TransitionCell289",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Campaign Name", width: 150, dataKey: "campaignGroup.name", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "campaignGroup.name", height: 25, style: { "height": 25, "width": 150 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader288, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell290 = React.createClass({
    displayName: "FixedDataTableCell290",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 150, "left": 888 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell289, null)
      );
    }
  });

  var AdsPETableHeader291 = React.createClass({
    displayName: "AdsPETableHeader291",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Ad ID"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader292 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader292",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader291, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader293 = React.createClass({
    displayName: "FixedDataTableSortableHeader293",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader292, null);
    }
  });

  var TransitionCell294 = React.createClass({
    displayName: "TransitionCell294",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Ad ID", width: 120, dataKey: "ad.id", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.id", height: 25, style: { "height": 25, "width": 120 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader293, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell295 = React.createClass({
    displayName: "FixedDataTableCell295",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 120, "left": 1038 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell294, null)
      );
    }
  });

  var AdsPETableHeader296 = React.createClass({
    displayName: "AdsPETableHeader296",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Objective"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader297 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader297",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader296, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader298 = React.createClass({
    displayName: "FixedDataTableSortableHeader298",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader297, null);
    }
  });

  var TransitionCell299 = React.createClass({
    displayName: "TransitionCell299",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Objective", width: 80, dataKey: "campaignGroup.objective", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "campaignGroup.objective", height: 25, style: { "height": 25, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader298, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell300 = React.createClass({
    displayName: "FixedDataTableCell300",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 80, "left": 1158 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell299, null)
      );
    }
  });

  var AdsPETableHeader301 = React.createClass({
    displayName: "AdsPETableHeader301",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Spent"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader302 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader302",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader301, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader303 = React.createClass({
    displayName: "FixedDataTableSortableHeader303",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader302, null);
    }
  });

  var TransitionCell304 = React.createClass({
    displayName: "TransitionCell304",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Spent", width: 70, dataKey: "stats.spent_100", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "stats.spent_100", height: 25, style: { "height": 25, "width": 70 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader303, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell305 = React.createClass({
    displayName: "FixedDataTableCell305",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 25, "width": 70, "left": 1238 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell304, null)
      );
    }
  });

  var AdsPETableHeader306 = React.createClass({
    displayName: "AdsPETableHeader306",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Start"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader307 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader307",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader306, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader308 = React.createClass({
    displayName: "FixedDataTableSortableHeader308",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader307, null);
    }
  });

  var TransitionCell309 = React.createClass({
    displayName: "TransitionCell309",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Start", width: 113, dataKey: "derivedCampaign.startDate", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "derivedCampaign.startDate", height: 25, style: { "height": 25, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader308, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell310 = React.createClass({
    displayName: "FixedDataTableCell310",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 113, "left": 1308 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell309, null)
      );
    }
  });

  var AdsPETableHeader311 = React.createClass({
    displayName: "AdsPETableHeader311",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "End"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader312 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader312",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader311, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader313 = React.createClass({
    displayName: "FixedDataTableSortableHeader313",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader312, null);
    }
  });

  var TransitionCell314 = React.createClass({
    displayName: "TransitionCell314",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "End", width: 113, dataKey: "derivedCampaign.endDate", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "derivedCampaign.endDate", height: 25, style: { "height": 25, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader313, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell315 = React.createClass({
    displayName: "FixedDataTableCell315",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 113, "left": 1421 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell314, null)
      );
    }
  });

  var AdsPETableHeader316 = React.createClass({
    displayName: "AdsPETableHeader316",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Date created"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader317 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader317",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader316, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader318 = React.createClass({
    displayName: "FixedDataTableSortableHeader318",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader317, null);
    }
  });

  var TransitionCell319 = React.createClass({
    displayName: "TransitionCell319",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Date created", width: 113, dataKey: "ad.created_time", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.created_time", height: 25, style: { "height": 25, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader318, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell320 = React.createClass({
    displayName: "FixedDataTableCell320",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 113, "left": 1534 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell319, null)
      );
    }
  });

  var AdsPETableHeader321 = React.createClass({
    displayName: "AdsPETableHeader321",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Date last edited"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader322 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader322",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader321, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader323 = React.createClass({
    displayName: "FixedDataTableSortableHeader323",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader322, null);
    }
  });

  var TransitionCell324 = React.createClass({
    displayName: "TransitionCell324",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Date last edited", width: 113, dataKey: "ad.updated_time", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.updated_time", height: 25, style: { "height": 25, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader323, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell325 = React.createClass({
    displayName: "FixedDataTableCell325",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 113, "left": 1647 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell324, null)
      );
    }
  });

  var AdsPETableHeader326 = React.createClass({
    displayName: "AdsPETableHeader326",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Title"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader327 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader327",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader326, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader328 = React.createClass({
    displayName: "FixedDataTableSortableHeader328",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader327, null);
    }
  });

  var TransitionCell329 = React.createClass({
    displayName: "TransitionCell329",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Title", width: 80, dataKey: "ad.title", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.title", height: 25, style: { "height": 25, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader328, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell330 = React.createClass({
    displayName: "FixedDataTableCell330",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 80, "left": 1760 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell329, null)
      );
    }
  });

  var AdsPETableHeader331 = React.createClass({
    displayName: "AdsPETableHeader331",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Body"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader332 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader332",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader331, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader333 = React.createClass({
    displayName: "FixedDataTableSortableHeader333",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader332, null);
    }
  });

  var TransitionCell334 = React.createClass({
    displayName: "TransitionCell334",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Body", width: 80, dataKey: "ad.creative.body", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.creative.body", height: 25, style: { "height": 25, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader333, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell335 = React.createClass({
    displayName: "FixedDataTableCell335",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 80, "left": 1840 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell334, null)
      );
    }
  });

  var AdsPETableHeader336 = React.createClass({
    displayName: "AdsPETableHeader336",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Destination"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader337 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader337",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader336, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader338 = React.createClass({
    displayName: "FixedDataTableSortableHeader338",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader337, null);
    }
  });

  var TransitionCell339 = React.createClass({
    displayName: "TransitionCell339",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Destination", width: 92, dataKey: "destination", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "destination", height: 25, style: { "height": 25, "width": 92 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader338, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell340 = React.createClass({
    displayName: "FixedDataTableCell340",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 92, "left": 1920 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell339, null)
      );
    }
  });

  var AdsPETableHeader341 = React.createClass({
    displayName: "AdsPETableHeader341",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Link"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader342 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader342",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader341, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader343 = React.createClass({
    displayName: "FixedDataTableSortableHeader343",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader342, null);
    }
  });

  var TransitionCell344 = React.createClass({
    displayName: "TransitionCell344",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Link", width: 70, dataKey: "ad.creative.link_url", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.creative.link_url", height: 25, style: { "height": 25, "width": 70 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader343, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell345 = React.createClass({
    displayName: "FixedDataTableCell345",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 70, "left": 2012 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell344, null)
      );
    }
  });

  var AdsPETableHeader346 = React.createClass({
    displayName: "AdsPETableHeader346",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Related Page"
        )
      );
    }
  });

  var FixedDataTableAbstractSortableHeader347 = React.createClass({
    displayName: "FixedDataTableAbstractSortableHeader347",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_54_8 _4h2r _2wzx" },
        React.createElement(
          "div",
          { className: "_2eq6" },
          null,
          React.createElement(AdsPETableHeader346, null)
        )
      );
    }
  });

  var FixedDataTableSortableHeader348 = React.createClass({
    displayName: "FixedDataTableSortableHeader348",

    render: function () {
      return React.createElement(FixedDataTableAbstractSortableHeader347, null);
    }
  });

  var TransitionCell349 = React.createClass({
    displayName: "TransitionCell349",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Related Page", width: 92, dataKey: "page", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "page", height: 25, style: { "height": 25, "width": 92 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(FixedDataTableSortableHeader348, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell350 = React.createClass({
    displayName: "FixedDataTableCell350",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 92, "left": 2082 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell349, null)
      );
    }
  });

  var AdsPETableHeader351 = React.createClass({
    displayName: "AdsPETableHeader351",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1cig _25fg _4h2r" },
        null,
        React.createElement(
          "span",
          { className: "_1cid" },
          "Preview Link"
        )
      );
    }
  });

  var TransitionCell352 = React.createClass({
    displayName: "TransitionCell352",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "Preview Link", width: 100, dataKey: "ad.demolink_hash", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "ad.demolink_hash", height: 25, style: { "height": 25, "width": 100 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader351, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell353 = React.createClass({
    displayName: "FixedDataTableCell353",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 100, "left": 2174 } },
        React.createElement(
          "div",
          { className: "_4lg9", style: { "height": 25 }, onMouseDown: function () {} },
          React.createElement("div", { className: "_4lga _4lgb", style: { "height": 25 } })
        ),
        React.createElement(TransitionCell352, null)
      );
    }
  });

  var AdsPETableHeader354 = React.createClass({
    displayName: "AdsPETableHeader354",

    render: function () {
      return React.createElement("div", { className: "_1cig _25fg _4h2r" });
    }
  });

  var TransitionCell355 = React.createClass({
    displayName: "TransitionCell355",

    render: function () {
      return React.createElement(
        "div",
        { isHeaderCell: true, label: "", width: 25, dataKey: "scrollbar_spacer", className: "_4lgc _4h2u", columnData: {}, cellRenderer: function () {}, headerDataGetter: function () {}, columnKey: "scrollbar_spacer", height: 25, style: { "height": 25, "width": 25 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsPETableHeader354, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell356 = React.createClass({
    displayName: "FixedDataTableCell356",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 25, "width": 25, "left": 2274 } },
        undefined,
        React.createElement(TransitionCell355, null)
      );
    }
  });

  var FixedDataTableCellGroupImpl357 = React.createClass({
    displayName: "FixedDataTableCellGroupImpl357",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3pzj", style: { "height": 25, "position": "absolute", "width": 2299, "zIndex": 0, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" } },
        React.createElement(FixedDataTableCell244, { key: "cell_0" }),
        React.createElement(FixedDataTableCell249, { key: "cell_1" }),
        React.createElement(FixedDataTableCell254, { key: "cell_2" }),
        React.createElement(FixedDataTableCell259, { key: "cell_3" }),
        React.createElement(FixedDataTableCell262, { key: "cell_4" }),
        React.createElement(FixedDataTableCell265, { key: "cell_5" }),
        React.createElement(FixedDataTableCell270, { key: "cell_6" }),
        React.createElement(FixedDataTableCell275, { key: "cell_7" }),
        React.createElement(FixedDataTableCell280, { key: "cell_8" }),
        React.createElement(FixedDataTableCell285, { key: "cell_9" }),
        React.createElement(FixedDataTableCell290, { key: "cell_10" }),
        React.createElement(FixedDataTableCell295, { key: "cell_11" }),
        React.createElement(FixedDataTableCell300, { key: "cell_12" }),
        React.createElement(FixedDataTableCell305, { key: "cell_13" }),
        React.createElement(FixedDataTableCell310, { key: "cell_14" }),
        React.createElement(FixedDataTableCell315, { key: "cell_15" }),
        React.createElement(FixedDataTableCell320, { key: "cell_16" }),
        React.createElement(FixedDataTableCell325, { key: "cell_17" }),
        React.createElement(FixedDataTableCell330, { key: "cell_18" }),
        React.createElement(FixedDataTableCell335, { key: "cell_19" }),
        React.createElement(FixedDataTableCell340, { key: "cell_20" }),
        React.createElement(FixedDataTableCell345, { key: "cell_21" }),
        React.createElement(FixedDataTableCell350, { key: "cell_22" }),
        React.createElement(FixedDataTableCell353, { key: "cell_23" }),
        React.createElement(FixedDataTableCell356, { key: "cell_24" })
      );
    }
  });

  var FixedDataTableCellGroup358 = React.createClass({
    displayName: "FixedDataTableCellGroup358",

    render: function () {
      return React.createElement(
        "div",
        { style: { "height": 25, "left": 521 }, className: "_3pzk" },
        React.createElement(FixedDataTableCellGroupImpl357, null)
      );
    }
  });

  var FixedDataTableRowImpl359 = React.createClass({
    displayName: "FixedDataTableRowImpl359",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1gd4 _4li _3h1a _1mib", onClick: null, onDoubleClick: null, onMouseDown: null, onMouseEnter: null, onMouseLeave: null, style: { "width": 1083, "height": 25 } },
        React.createElement(
          "div",
          { className: "_1gd5" },
          React.createElement(FixedDataTableCellGroup239, { key: "fixed_cells" }),
          React.createElement(FixedDataTableCellGroup358, { key: "scrollable_cells" }),
          React.createElement("div", { className: "_1gd6 _1gd8", style: { "left": 521, "height": 25 } })
        )
      );
    }
  });

  var FixedDataTableRow360 = React.createClass({
    displayName: "FixedDataTableRow360",

    render: function () {
      return React.createElement(
        "div",
        { style: { "width": 1083, "height": 25, "zIndex": 1, "transform": "translate3d(0px,40px,0)", "backfaceVisibility": "hidden" }, className: "_1gda" },
        React.createElement(FixedDataTableRowImpl359, null)
      );
    }
  });

  var AbstractCheckboxInput361 = React.createClass({
    displayName: "AbstractCheckboxInput361",

    render: function () {
      return React.createElement(
        "label",
        { className: "_5hhv _55sg _kv1" },
        React.createElement("input", { className: null, disabled: false, inline: true, checked: true, value: undefined, onChange: function () {}, type: "checkbox" }),
        React.createElement("span", { "data-hover": null, "aria-label": undefined })
      );
    }
  });

  var XUICheckboxInput362 = React.createClass({
    displayName: "XUICheckboxInput362",

    render: function () {
      return React.createElement(AbstractCheckboxInput361, null);
    }
  });

  var TransitionCell363 = React.createClass({
    displayName: "TransitionCell363",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "common.id", className: "_4lgc _4h2u", rowGetter: function () {}, width: 42, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "common.id", height: 32, rowIndex: 0, style: { "height": 32, "width": 42 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "span",
              { className: "_5hhu _4h2r", onMouseDown: function () {} },
              React.createElement(XUICheckboxInput362, null)
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell364 = React.createClass({
    displayName: "FixedDataTableCell364",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg6 _4h2m", style: { "height": 32, "width": 42, "left": 0 } },
        undefined,
        React.createElement(TransitionCell363, null)
      );
    }
  });

  var AdsEditableTextCellDisplay365 = React.createClass({
    displayName: "AdsEditableTextCellDisplay365",

    render: function () {
      return React.createElement(
        "div",
        { className: "_vew", onDoubleClick: function () {}, onMouseEnter: function () {}, onMouseLeave: function () {} },
        React.createElement(
          "div",
          { className: "_vex _5w6k" },
          React.createElement(
            "div",
            { className: "_vey" },
            "Test Ad"
          ),
          React.createElement("div", { className: "_5w6_" })
        )
      );
    }
  });

  var AdsEditableCell366 = React.createClass({
    displayName: "AdsEditableCell366",

    render: function () {
      return React.createElement(
        "div",
        { className: "_2d6h _2-ev _4h2r _5abb" },
        React.createElement(AdsEditableTextCellDisplay365, null)
      );
    }
  });

  var TransitionCell367 = React.createClass({
    displayName: "TransitionCell367",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.name", className: "_4lgc _4h2u", rowGetter: function () {}, width: 200, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.name", height: 32, rowIndex: 0, style: { "height": 32, "width": 200 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(AdsEditableCell366, null)
          )
        )
      );
    }
  });

  var FixedDataTableCell368 = React.createClass({
    displayName: "FixedDataTableCell368",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 200, "left": 42 } },
        undefined,
        React.createElement(TransitionCell367, null)
      );
    }
  });

  var FixedDataTableCellDefault369 = React.createClass({
    displayName: "FixedDataTableCellDefault369",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "edit_status", className: "_4lgc _4h2u", rowGetter: function () {}, width: 33, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "edit_status", height: 32, rowIndex: 0, style: { "height": 32, "width": 33 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_4h2r" },
              ""
            )
          )
        )
      );
    }
  });

  var TransitionCell370 = React.createClass({
    displayName: "TransitionCell370",

    render: function () {
      return React.createElement(FixedDataTableCellDefault369, null);
    }
  });

  var FixedDataTableCell371 = React.createClass({
    displayName: "FixedDataTableCell371",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 33, "left": 242 } },
        undefined,
        React.createElement(TransitionCell370, null)
      );
    }
  });

  var FixedDataTableCellDefault372 = React.createClass({
    displayName: "FixedDataTableCellDefault372",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "errors", className: "_4lgc _4h2u", rowGetter: function () {}, width: 36, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "errors", height: 32, rowIndex: 0, style: { "height": 32, "width": 36 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement("div", { className: "_4h2r" })
          )
        )
      );
    }
  });

  var TransitionCell373 = React.createClass({
    displayName: "TransitionCell373",

    render: function () {
      return React.createElement(FixedDataTableCellDefault372, null);
    }
  });

  var FixedDataTableCell374 = React.createClass({
    displayName: "FixedDataTableCell374",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 36, "left": 275 } },
        undefined,
        React.createElement(TransitionCell373, null)
      );
    }
  });

  var BUISwitch375 = React.createClass({
    displayName: "BUISwitch375",

    render: function () {
      return React.createElement(
        "div",
        { value: true, disabled: true, onToggle: function () {}, "data-hover": "tooltip", "data-tooltip-position": "below", "aria-label": "Currently active and you can not deactivate it.", animate: true, className: "_128j _128k _128m _128n", role: "checkbox", "aria-checked": "true" },
        React.createElement(
          "div",
          { className: "_128o", onClick: function () {}, onKeyDown: function () {}, onMouseDown: function () {}, tabIndex: "-1" },
          React.createElement("div", { className: "_128p" })
        ),
        null
      );
    }
  });

  var AdsStatusSwitchInternal376 = React.createClass({
    displayName: "AdsStatusSwitchInternal376",

    render: function () {
      return React.createElement(BUISwitch375, null);
    }
  });

  var AdsStatusSwitch377 = React.createClass({
    displayName: "AdsStatusSwitch377",

    render: function () {
      return React.createElement(AdsStatusSwitchInternal376, null);
    }
  });

  var TransitionCell378 = React.createClass({
    displayName: "TransitionCell378",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.adgroup_status", className: "_4lgc _4h2u", rowGetter: function () {}, width: 60, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.adgroup_status", height: 32, rowIndex: 0, style: { "height": 32, "width": 60 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_15si _4h2r" },
              React.createElement(AdsStatusSwitch377, null)
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell379 = React.createClass({
    displayName: "FixedDataTableCell379",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 60, "left": 311 } },
        undefined,
        React.createElement(TransitionCell378, null)
      );
    }
  });

  var ReactImage380 = React.createClass({
    displayName: "ReactImage380",

    render: function () {
      return React.createElement("i", { "aria-label": "Pending Review", "data-hover": "tooltip", className: "_4ms8 img sp_UuU9HmrQ397 sx_ced63f", src: null, width: "7", height: "7" });
    }
  });

  var AdsPEActivityStatusIndicator381 = React.createClass({
    displayName: "AdsPEActivityStatusIndicator381",

    render: function () {
      return React.createElement(
        "div",
        { className: "_k4-" },
        React.createElement(ReactImage380, null),
        "Pending Review",
        undefined
      );
    }
  });

  var TransitionCell382 = React.createClass({
    displayName: "TransitionCell382",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ukiAdData.computed_activity_status", className: "_4lgc _4h2u", rowGetter: function () {}, width: 150, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ukiAdData.computed_activity_status", height: 32, rowIndex: 0, style: { "height": 32, "width": 150 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              React.createElement(AdsPEActivityStatusIndicator381, null)
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell383 = React.createClass({
    displayName: "FixedDataTableCell383",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 150, "left": 371 } },
        undefined,
        React.createElement(TransitionCell382, null)
      );
    }
  });

  var FixedDataTableCellGroupImpl384 = React.createClass({
    displayName: "FixedDataTableCellGroupImpl384",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3pzj", style: { "height": 32, "position": "absolute", "width": 521, "zIndex": 2, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" } },
        React.createElement(FixedDataTableCell364, { key: "cell_0" }),
        React.createElement(FixedDataTableCell368, { key: "cell_1" }),
        React.createElement(FixedDataTableCell371, { key: "cell_2" }),
        React.createElement(FixedDataTableCell374, { key: "cell_3" }),
        React.createElement(FixedDataTableCell379, { key: "cell_4" }),
        React.createElement(FixedDataTableCell383, { key: "cell_5" })
      );
    }
  });

  var FixedDataTableCellGroup385 = React.createClass({
    displayName: "FixedDataTableCellGroup385",

    render: function () {
      return React.createElement(
        "div",
        { style: { "height": 32, "left": 0 }, className: "_3pzk" },
        React.createElement(FixedDataTableCellGroupImpl384, null)
      );
    }
  });

  var TransitionCell386 = React.createClass({
    displayName: "TransitionCell386",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.unique_impressions", className: "_4lgc _4h2u", rowGetter: function () {}, width: 60, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.unique_impressions", height: 32, rowIndex: 0, style: { "height": 32, "width": 60 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell387 = React.createClass({
    displayName: "FixedDataTableCell387",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 60, "left": 0 } },
        undefined,
        React.createElement(TransitionCell386, null)
      );
    }
  });

  var TransitionCell388 = React.createClass({
    displayName: "TransitionCell388",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.impressions", className: "_4lgc _4h2u", rowGetter: function () {}, width: 80, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.impressions", height: 32, rowIndex: 0, style: { "height": 32, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell389 = React.createClass({
    displayName: "FixedDataTableCell389",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 80, "left": 60 } },
        undefined,
        React.createElement(TransitionCell388, null)
      );
    }
  });

  var TransitionCell390 = React.createClass({
    displayName: "TransitionCell390",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.avg_cpm", className: "_4lgc _4h2u", rowGetter: function () {}, width: 80, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.avg_cpm", height: 32, rowIndex: 0, style: { "height": 32, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell391 = React.createClass({
    displayName: "FixedDataTableCell391",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 80, "left": 140 } },
        undefined,
        React.createElement(TransitionCell390, null)
      );
    }
  });

  var TransitionCell392 = React.createClass({
    displayName: "TransitionCell392",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.avg_cpc", className: "_4lgc _4h2u", rowGetter: function () {}, width: 78, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.avg_cpc", height: 32, rowIndex: 0, style: { "height": 32, "width": 78 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell393 = React.createClass({
    displayName: "FixedDataTableCell393",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 78, "left": 220 } },
        undefined,
        React.createElement(TransitionCell392, null)
      );
    }
  });

  var TransitionCell394 = React.createClass({
    displayName: "TransitionCell394",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.actions", className: "_4lgc _4h2u", rowGetter: function () {}, width: 140, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.actions", height: 32, rowIndex: 0, style: { "height": 32, "width": 140 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell395 = React.createClass({
    displayName: "FixedDataTableCell395",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 140, "left": 298 } },
        undefined,
        React.createElement(TransitionCell394, null)
      );
    }
  });

  var TransitionCell396 = React.createClass({
    displayName: "TransitionCell396",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.cpa", className: "_4lgc _4h2u", rowGetter: function () {}, width: 140, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.cpa", height: 32, rowIndex: 0, style: { "height": 32, "width": 140 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell397 = React.createClass({
    displayName: "FixedDataTableCell397",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 140, "left": 438 } },
        undefined,
        React.createElement(TransitionCell396, null)
      );
    }
  });

  var TransitionCell398 = React.createClass({
    displayName: "TransitionCell398",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.clicks", className: "_4lgc _4h2u", rowGetter: function () {}, width: 60, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.clicks", height: 32, rowIndex: 0, style: { "height": 32, "width": 60 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell399 = React.createClass({
    displayName: "FixedDataTableCell399",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 60, "left": 578 } },
        undefined,
        React.createElement(TransitionCell398, null)
      );
    }
  });

  var TransitionCell400 = React.createClass({
    displayName: "TransitionCell400",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.ctr", className: "_4lgc _4h2u", rowGetter: function () {}, width: 70, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.ctr", height: 32, rowIndex: 0, style: { "height": 32, "width": 70 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell401 = React.createClass({
    displayName: "FixedDataTableCell401",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 70, "left": 638 } },
        undefined,
        React.createElement(TransitionCell400, null)
      );
    }
  });

  var TransitionCell402 = React.createClass({
    displayName: "TransitionCell402",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.social_percent", className: "_4lgc _4h2u", rowGetter: function () {}, width: 80, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.social_percent", height: 32, rowIndex: 0, style: { "height": 32, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell403 = React.createClass({
    displayName: "FixedDataTableCell403",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 80, "left": 708 } },
        undefined,
        React.createElement(TransitionCell402, null)
      );
    }
  });

  var FixedDataTableCellDefault404 = React.createClass({
    displayName: "FixedDataTableCellDefault404",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "campaign.name", className: "_4lgc _4h2u", rowGetter: function () {}, width: 100, columnData: {}, cellDataGetter: function () {}, cellRenderer: undefined, columnKey: "campaign.name", height: 32, rowIndex: 0, style: { "height": 32, "width": 100 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_4h2r" },
              "Test Ad Set"
            )
          )
        )
      );
    }
  });

  var TransitionCell405 = React.createClass({
    displayName: "TransitionCell405",

    render: function () {
      return React.createElement(FixedDataTableCellDefault404, null);
    }
  });

  var FixedDataTableCell406 = React.createClass({
    displayName: "FixedDataTableCell406",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 100, "left": 788 } },
        undefined,
        React.createElement(TransitionCell405, null)
      );
    }
  });

  var FixedDataTableCellDefault407 = React.createClass({
    displayName: "FixedDataTableCellDefault407",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "campaignGroup.name", className: "_4lgc _4h2u", rowGetter: function () {}, width: 150, columnData: {}, cellDataGetter: function () {}, cellRenderer: undefined, columnKey: "campaignGroup.name", height: 32, rowIndex: 0, style: { "height": 32, "width": 150 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_4h2r" },
              "Test Campaign"
            )
          )
        )
      );
    }
  });

  var TransitionCell408 = React.createClass({
    displayName: "TransitionCell408",

    render: function () {
      return React.createElement(FixedDataTableCellDefault407, null);
    }
  });

  var FixedDataTableCell409 = React.createClass({
    displayName: "FixedDataTableCell409",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 150, "left": 888 } },
        undefined,
        React.createElement(TransitionCell408, null)
      );
    }
  });

  var TransitionCell410 = React.createClass({
    displayName: "TransitionCell410",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.id", className: "_4lgc _4h2u", rowGetter: function () {}, width: 120, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.id", height: 32, rowIndex: 0, style: { "height": 32, "width": 120 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              "98010048849345"
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell411 = React.createClass({
    displayName: "FixedDataTableCell411",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 120, "left": 1038 } },
        undefined,
        React.createElement(TransitionCell410, null)
      );
    }
  });

  var TransitionCell412 = React.createClass({
    displayName: "TransitionCell412",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "campaignGroup.objective", className: "_4lgc _4h2u", rowGetter: function () {}, width: 80, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "campaignGroup.objective", height: 32, rowIndex: 0, style: { "height": 32, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              "Clicks to Website"
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell413 = React.createClass({
    displayName: "FixedDataTableCell413",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 80, "left": 1158 } },
        undefined,
        React.createElement(TransitionCell412, null)
      );
    }
  });

  var TransitionCell414 = React.createClass({
    displayName: "TransitionCell414",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "stats.spent_100", className: "_4lgc _4h2u", rowGetter: function () {}, width: 70, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "stats.spent_100", height: 32, rowIndex: 0, style: { "height": 32, "width": 70 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _2g7x _4h2r" },
              " — "
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell415 = React.createClass({
    displayName: "FixedDataTableCell415",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4lg5 _4h2p _4h2m", style: { "height": 32, "width": 70, "left": 1238 } },
        undefined,
        React.createElement(TransitionCell414, null)
      );
    }
  });

  var ReactDate416 = React.createClass({
    displayName: "ReactDate416",

    render: function () {
      return React.createElement(
        "span",
        null,
        "10/24/2015"
      );
    }
  });

  var TransitionCell417 = React.createClass({
    displayName: "TransitionCell417",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "derivedCampaign.startDate", className: "_4lgc _4h2u", rowGetter: function () {}, width: 113, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "derivedCampaign.startDate", height: 32, rowIndex: 0, style: { "height": 32, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              React.createElement(ReactDate416, null)
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell418 = React.createClass({
    displayName: "FixedDataTableCell418",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 113, "left": 1308 } },
        undefined,
        React.createElement(TransitionCell417, null)
      );
    }
  });

  var TransitionCell419 = React.createClass({
    displayName: "TransitionCell419",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "derivedCampaign.endDate", className: "_4lgc _4h2u", rowGetter: function () {}, width: 113, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "derivedCampaign.endDate", height: 32, rowIndex: 0, style: { "height": 32, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              "Ongoing"
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell420 = React.createClass({
    displayName: "FixedDataTableCell420",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 113, "left": 1421 } },
        undefined,
        React.createElement(TransitionCell419, null)
      );
    }
  });

  var ReactDate421 = React.createClass({
    displayName: "ReactDate421",

    render: function () {
      return React.createElement(
        "span",
        null,
        "10/24/2015"
      );
    }
  });

  var TransitionCell422 = React.createClass({
    displayName: "TransitionCell422",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.created_time", className: "_4lgc _4h2u", rowGetter: function () {}, width: 113, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.created_time", height: 32, rowIndex: 0, style: { "height": 32, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              React.createElement(ReactDate421, null)
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell423 = React.createClass({
    displayName: "FixedDataTableCell423",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 113, "left": 1534 } },
        undefined,
        React.createElement(TransitionCell422, null)
      );
    }
  });

  var ReactDate424 = React.createClass({
    displayName: "ReactDate424",

    render: function () {
      return React.createElement(
        "span",
        null,
        "10/24/2015"
      );
    }
  });

  var TransitionCell425 = React.createClass({
    displayName: "TransitionCell425",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.updated_time", className: "_4lgc _4h2u", rowGetter: function () {}, width: 113, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.updated_time", height: 32, rowIndex: 0, style: { "height": 32, "width": 113 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              React.createElement(ReactDate424, null)
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell426 = React.createClass({
    displayName: "FixedDataTableCell426",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 113, "left": 1647 } },
        undefined,
        React.createElement(TransitionCell425, null)
      );
    }
  });

  var TransitionCell427 = React.createClass({
    displayName: "TransitionCell427",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.title", className: "_4lgc _4h2u", rowGetter: function () {}, width: 80, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.title", height: 32, rowIndex: 0, style: { "height": 32, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              "Example"
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell428 = React.createClass({
    displayName: "FixedDataTableCell428",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 80, "left": 1760 } },
        undefined,
        React.createElement(TransitionCell427, null)
      );
    }
  });

  var TransitionCell429 = React.createClass({
    displayName: "TransitionCell429",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.creative.body", className: "_4lgc _4h2u", rowGetter: function () {}, width: 80, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.creative.body", height: 32, rowIndex: 0, style: { "height": 32, "width": 80 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              "It's an example."
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell430 = React.createClass({
    displayName: "FixedDataTableCell430",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 80, "left": 1840 } },
        undefined,
        React.createElement(TransitionCell429, null)
      );
    }
  });

  var TransitionCell431 = React.createClass({
    displayName: "TransitionCell431",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "destination", className: "_4lgc _4h2u", rowGetter: function () {}, width: 92, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "destination", height: 32, rowIndex: 0, style: { "height": 32, "width": 92 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement("div", { className: "_2d6h _4h2r" })
          )
        )
      );
    }
  });

  var FixedDataTableCell432 = React.createClass({
    displayName: "FixedDataTableCell432",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 92, "left": 1920 } },
        undefined,
        React.createElement(TransitionCell431, null)
      );
    }
  });

  var TransitionCell433 = React.createClass({
    displayName: "TransitionCell433",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.creative.link_url", className: "_4lgc _4h2u", rowGetter: function () {}, width: 70, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.creative.link_url", height: 32, rowIndex: 0, style: { "height": 32, "width": 70 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_2d6h _4h2r" },
              "http://www.example.com/"
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell434 = React.createClass({
    displayName: "FixedDataTableCell434",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 70, "left": 2012 } },
        undefined,
        React.createElement(TransitionCell433, null)
      );
    }
  });

  var FixedDataTableCellDefault435 = React.createClass({
    displayName: "FixedDataTableCellDefault435",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "page", className: "_4lgc _4h2u", rowGetter: function () {}, width: 92, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "page", height: 32, rowIndex: 0, style: { "height": 32, "width": 92 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement("div", { className: "_4h2r" })
          )
        )
      );
    }
  });

  var TransitionCell436 = React.createClass({
    displayName: "TransitionCell436",

    render: function () {
      return React.createElement(FixedDataTableCellDefault435, null);
    }
  });

  var FixedDataTableCell437 = React.createClass({
    displayName: "FixedDataTableCell437",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 92, "left": 2082 } },
        undefined,
        React.createElement(TransitionCell436, null)
      );
    }
  });

  var Link438 = React.createClass({
    displayName: "Link438",

    render: function () {
      return React.createElement(
        "a",
        { href: "https://www.facebook.com/?demo_ad=98010048849345&h=AQA24w3temAtB-5f#pagelet_ego_pane", target: "_blank", rel: undefined, onClick: function () {} },
        "Preview Ad"
      );
    }
  });

  var ReactImage439 = React.createClass({
    displayName: "ReactImage439",

    render: function () {
      return React.createElement("i", { src: null, className: "_541d img sp_R48dKBxiJkP sx_dc2cdb" });
    }
  });

  var AdsPopoverLink440 = React.createClass({
    displayName: "AdsPopoverLink440",

    render: function () {
      return React.createElement(
        "span",
        { ref: "tipIcon", onMouseEnter: function () {}, onMouseLeave: function () {} },
        React.createElement("span", { className: "_3o_j" }),
        React.createElement(ReactImage439, null)
      );
    }
  });

  var AdsHelpLink441 = React.createClass({
    displayName: "AdsHelpLink441",

    render: function () {
      return React.createElement(AdsPopoverLink440, null);
    }
  });

  var TransitionCell442 = React.createClass({
    displayName: "TransitionCell442",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "ad.demolink_hash", className: "_4lgc _4h2u", rowGetter: function () {}, width: 100, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "ad.demolink_hash", height: 32, rowIndex: 0, style: { "height": 32, "width": 100 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement(
              "div",
              { className: "_4h2r" },
              React.createElement(Link438, null),
              React.createElement(AdsHelpLink441, null)
            )
          )
        )
      );
    }
  });

  var FixedDataTableCell443 = React.createClass({
    displayName: "FixedDataTableCell443",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 100, "left": 2174 } },
        undefined,
        React.createElement(TransitionCell442, null)
      );
    }
  });

  var TransitionCell444 = React.createClass({
    displayName: "TransitionCell444",

    render: function () {
      return React.createElement(
        "div",
        { dataKey: "scrollbar_spacer", className: "_4lgc _4h2u", rowGetter: function () {}, width: 25, columnData: {}, cellDataGetter: function () {}, cellRenderer: function () {}, columnKey: "scrollbar_spacer", height: 32, rowIndex: 0, style: { "height": 32, "width": 25 } },
        React.createElement(
          "div",
          { className: "_4lgd _4h2w" },
          React.createElement(
            "div",
            { className: "_4lge _4h2x" },
            React.createElement("div", { className: "_2d6h _4h2r" })
          )
        )
      );
    }
  });

  var FixedDataTableCell445 = React.createClass({
    displayName: "FixedDataTableCell445",

    render: function () {
      return React.createElement(
        "div",
        { className: "_4lg0 _4h2m", style: { "height": 32, "width": 25, "left": 2274 } },
        undefined,
        React.createElement(TransitionCell444, null)
      );
    }
  });

  var FixedDataTableCellGroupImpl446 = React.createClass({
    displayName: "FixedDataTableCellGroupImpl446",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3pzj", style: { "height": 32, "position": "absolute", "width": 2299, "zIndex": 0, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" } },
        React.createElement(FixedDataTableCell387, { key: "cell_0" }),
        React.createElement(FixedDataTableCell389, { key: "cell_1" }),
        React.createElement(FixedDataTableCell391, { key: "cell_2" }),
        React.createElement(FixedDataTableCell393, { key: "cell_3" }),
        React.createElement(FixedDataTableCell395, { key: "cell_4" }),
        React.createElement(FixedDataTableCell397, { key: "cell_5" }),
        React.createElement(FixedDataTableCell399, { key: "cell_6" }),
        React.createElement(FixedDataTableCell401, { key: "cell_7" }),
        React.createElement(FixedDataTableCell403, { key: "cell_8" }),
        React.createElement(FixedDataTableCell406, { key: "cell_9" }),
        React.createElement(FixedDataTableCell409, { key: "cell_10" }),
        React.createElement(FixedDataTableCell411, { key: "cell_11" }),
        React.createElement(FixedDataTableCell413, { key: "cell_12" }),
        React.createElement(FixedDataTableCell415, { key: "cell_13" }),
        React.createElement(FixedDataTableCell418, { key: "cell_14" }),
        React.createElement(FixedDataTableCell420, { key: "cell_15" }),
        React.createElement(FixedDataTableCell423, { key: "cell_16" }),
        React.createElement(FixedDataTableCell426, { key: "cell_17" }),
        React.createElement(FixedDataTableCell428, { key: "cell_18" }),
        React.createElement(FixedDataTableCell430, { key: "cell_19" }),
        React.createElement(FixedDataTableCell432, { key: "cell_20" }),
        React.createElement(FixedDataTableCell434, { key: "cell_21" }),
        React.createElement(FixedDataTableCell437, { key: "cell_22" }),
        React.createElement(FixedDataTableCell443, { key: "cell_23" }),
        React.createElement(FixedDataTableCell445, { key: "cell_24" })
      );
    }
  });

  var FixedDataTableCellGroup447 = React.createClass({
    displayName: "FixedDataTableCellGroup447",

    render: function () {
      return React.createElement(
        "div",
        { style: { "height": 32, "left": 521 }, className: "_3pzk" },
        React.createElement(FixedDataTableCellGroupImpl446, null)
      );
    }
  });

  var FixedDataTableRowImpl448 = React.createClass({
    displayName: "FixedDataTableRowImpl448",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1gd4 _4li _52no _35m0 _35m1 _3c7k _4efq _4efs", onClick: null, onDoubleClick: null, onMouseDown: function () {}, onMouseEnter: null, onMouseLeave: null, style: { "width": 1083, "height": 32 } },
        React.createElement(
          "div",
          { className: "_1gd5" },
          React.createElement(FixedDataTableCellGroup385, { key: "fixed_cells" }),
          React.createElement(FixedDataTableCellGroup447, { key: "scrollable_cells" }),
          React.createElement("div", { className: "_1gd6 _1gd8", style: { "left": 521, "height": 32 } })
        )
      );
    }
  });

  var FixedDataTableRow449 = React.createClass({
    displayName: "FixedDataTableRow449",

    render: function () {
      return React.createElement(
        "div",
        { style: { "width": 1083, "height": 32, "zIndex": 0, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" }, className: "_1gda" },
        React.createElement(FixedDataTableRowImpl448, null)
      );
    }
  });

  var FixedDataTableBufferedRows450 = React.createClass({
    displayName: "FixedDataTableBufferedRows450",

    render: function () {
      return React.createElement(
        "div",
        { style: { "position": "absolute", "pointerEvents": "auto", "transform": "translate3d(0px,65px,0)", "backfaceVisibility": "hidden" } },
        React.createElement(FixedDataTableRow449, { key: "0" })
      );
    }
  });

  var Scrollbar451 = React.createClass({
    displayName: "Scrollbar451",

    render: function () {
      return React.createElement(
        "div",
        { onFocus: function () {}, onBlur: function () {}, onKeyDown: function () {}, onMouseDown: function () {}, onWheel: function () {}, className: "_1t0r _1t0t _4jdr _1t0u", style: { "width": 1083, "zIndex": 99 }, tabIndex: 0 },
        React.createElement("div", { ref: "face", className: "_1t0w _1t0y _1t0_", style: { "width": 407.918085106383, "transform": "translate3d(4px,0px,0)", "backfaceVisibility": "hidden" } })
      );
    }
  });

  var HorizontalScrollbar452 = React.createClass({
    displayName: "HorizontalScrollbar452",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3h1k _3h1m", style: { "height": 15, "width": 1083 } },
        React.createElement(
          "div",
          { style: { "height": 15, "position": "absolute", "overflow": "hidden", "width": 1083, "transform": "translate3d(0px,0px,0)", "backfaceVisibility": "hidden" } },
          React.createElement(Scrollbar451, null)
        )
      );
    }
  });

  var FixedDataTable453 = React.createClass({
    displayName: "FixedDataTable453",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3h1i _1mie", onWheel: function () {}, style: { "height": 532, "width": 1083 } },
        React.createElement(
          "div",
          { className: "_3h1j", style: { "height": 515, "width": 1083 } },
          React.createElement(FixedDataTableColumnResizeHandle178, null),
          React.createElement(FixedDataTableRow206, { key: "group_header" }),
          React.createElement(FixedDataTableRow360, { key: "header" }),
          React.createElement(FixedDataTableBufferedRows450, null),
          null,
          undefined,
          undefined
        ),
        undefined,
        React.createElement(HorizontalScrollbar452, null)
      );
    }
  });

  var TransitionTable454 = React.createClass({
    displayName: "TransitionTable454",

    render: function () {
      return React.createElement(FixedDataTable453, null);
    }
  });

  var AdsSelectableFixedDataTable455 = React.createClass({
    displayName: "AdsSelectableFixedDataTable455",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5hht" },
        React.createElement(TransitionTable454, null)
      );
    }
  });

  var AdsDataTableKeyboardSupportDecorator456 = React.createClass({
    displayName: "AdsDataTableKeyboardSupportDecorator456",

    render: function () {
      return React.createElement(
        "div",
        { ref: "tableContainer", className: "_5d6f", tabIndex: "0", onKeyDown: function () {} },
        React.createElement(AdsSelectableFixedDataTable455, null)
      );
    }
  });

  var AdsEditableDataTableDecorator457 = React.createClass({
    displayName: "AdsEditableDataTableDecorator457",

    render: function () {
      return React.createElement(
        "div",
        { onCopy: function () {} },
        React.createElement(AdsDataTableKeyboardSupportDecorator456, { ref: "decoratedTable" })
      );
    }
  });

  var AdsPEDataTableContainer458 = React.createClass({
    displayName: "AdsPEDataTableContainer458",

    render: function () {
      return React.createElement(
        "div",
        { className: "_35l_" },
        null,
        null,
        React.createElement(AdsEditableDataTableDecorator457, null)
      );
    }
  });

  var ResponsiveBlock459 = React.createClass({
    displayName: "ResponsiveBlock459",

    render: function () {
      return React.createElement(
        "div",
        { onResize: function () {}, className: "_4u-c" },
        React.createElement(AdsPEDataTableContainer458, null),
        React.createElement(
          "div",
          { key: "sensor", className: "_4u-f" },
          React.createElement("iframe", { ref: "sensorNode", "aria-hidden": "true", className: "_4u-g", tabIndex: "-1" })
        )
      );
    }
  });

  var AdsPEAdTableContainer460 = React.createClass({
    displayName: "AdsPEAdTableContainer460",

    render: function () {
      return React.createElement(ResponsiveBlock459, null);
    }
  });

  var AdsPEManageAdsPaneContainer461 = React.createClass({
    displayName: "AdsPEManageAdsPaneContainer461",

    render: function () {
      return React.createElement(
        "div",
        { className: "_2utw" },
        null,
        React.createElement(
          "div",
          { className: "_2utx _41tt" },
          React.createElement(AdsPEFilterContainer104, null),
          React.createElement(AdsPECampaignTimeLimitNoticeContainer106, null),
          null
        ),
        React.createElement(
          "div",
          { className: " _41ts" },
          React.createElement(AdsPEAdgroupToolbarContainer169, null)
        ),
        React.createElement(
          "div",
          { className: "_2utz" },
          React.createElement(
            "div",
            { className: "_2ut-" },
            React.createElement(AdsPEOrganizerContainer177, null)
          ),
          React.createElement(
            "div",
            { className: "_2ut_" },
            React.createElement(AdsPEAdTableContainer460, null)
          )
        )
      );
    }
  });

  var AdsPEContentContainer462 = React.createClass({
    displayName: "AdsPEContentContainer462",

    render: function () {
      return React.createElement(AdsPEManageAdsPaneContainer461, null);
    }
  });

  var FluxContainer_r_463 = React.createClass({
    displayName: "FluxContainer_r_463",

    render: function () {
      return React.createElement(
        "div",
        { className: "mainWrapper", style: { "width": 1192 } },
        React.createElement(FluxContainer_r_69, null),
        React.createElement(AdsPEContentContainer462, null),
        null
      );
    }
  });

  var FluxContainer_q_464 = React.createClass({
    displayName: "FluxContainer_q_464",

    render: function () {
      return null;
    }
  });

  var AdsPEUploadDialog465 = React.createClass({
    displayName: "AdsPEUploadDialog465",

    render: function () {
      return null;
    }
  });

  var FluxContainer_y_466 = React.createClass({
    displayName: "FluxContainer_y_466",

    render: function () {
      return React.createElement(AdsPEUploadDialog465, null);
    }
  });

  var ReactImage467 = React.createClass({
    displayName: "ReactImage467",

    render: function () {
      return React.createElement("i", { className: "_1-lx img sp_UuU9HmrQ397 sx_990b54", src: null });
    }
  });

  var AdsPESideTrayTabButton468 = React.createClass({
    displayName: "AdsPESideTrayTabButton468",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: "_1-ly _59j9 _d9a" },
        React.createElement(ReactImage467, null),
        React.createElement("div", { className: "_vf7" }),
        React.createElement("div", { className: "_vf8" })
      );
    }
  });

  var AdsPEEditorTrayTabButton469 = React.createClass({
    displayName: "AdsPEEditorTrayTabButton469",

    render: function () {
      return React.createElement(AdsPESideTrayTabButton468, null);
    }
  });

  var ReactImage470 = React.createClass({
    displayName: "ReactImage470",

    render: function () {
      return React.createElement("i", { className: "_1-lx img sp_UuU9HmrQ397 sx_94017f", src: null });
    }
  });

  var AdsPESideTrayTabButton471 = React.createClass({
    displayName: "AdsPESideTrayTabButton471",

    render: function () {
      return React.createElement(
        "div",
        { onClick: function () {}, className: " _1-lz _d9a" },
        React.createElement(ReactImage470, null),
        React.createElement("div", { className: "_vf7" }),
        React.createElement("div", { className: "_vf8" })
      );
    }
  });

  var AdsPEInsightsTrayTabButton472 = React.createClass({
    displayName: "AdsPEInsightsTrayTabButton472",

    render: function () {
      return React.createElement(AdsPESideTrayTabButton471, null);
    }
  });

  var AdsPESideTrayTabButton473 = React.createClass({
    displayName: "AdsPESideTrayTabButton473",

    render: function () {
      return null;
    }
  });

  var AdsPENekoDebuggerTrayTabButton474 = React.createClass({
    displayName: "AdsPENekoDebuggerTrayTabButton474",

    render: function () {
      return React.createElement(AdsPESideTrayTabButton473, null);
    }
  });

  var FBDragHandle475 = React.createClass({
    displayName: "FBDragHandle475",

    render: function () {
      return React.createElement("div", { style: { "height": 550 }, className: "_4a2j _2ciy _2ciz", horizontal: true, onStart: function () {}, onEnd: function () {}, onChange: function () {}, initialData: function () {}, vertical: false, throttle: 25, delay: 0, threshold: 0, onMouseDown: function () {}, onMouseUp: function () {}, onMouseLeave: function () {} });
    }
  });

  var XUIText476 = React.createClass({
    displayName: "XUIText476",

    render: function () {
      return React.createElement(
        "span",
        { size: "large", weight: "bold", className: "_2x9f  _50f5 _50f7", display: "inline" },
        "Editing Ad"
      );
    }
  });

  var XUIText477 = React.createClass({
    displayName: "XUIText477",

    render: function () {
      return React.createElement(
        "span",
        { size: "large", weight: "bold", display: "inline", className: " _50f5 _50f7" },
        "Test Ad"
      );
    }
  });

  var AdsPEEditorChildLink478 = React.createClass({
    displayName: "AdsPEEditorChildLink478",

    render: function () {
      return null;
    }
  });

  var AdsPEEditorChildLinkContainer479 = React.createClass({
    displayName: "AdsPEEditorChildLinkContainer479",

    render: function () {
      return React.createElement(AdsPEEditorChildLink478, null);
    }
  });

  var AdsPEHeaderSection480 = React.createClass({
    displayName: "AdsPEHeaderSection480",

    render: function () {
      return React.createElement(
        "div",
        { className: "_yke" },
        React.createElement("div", { className: "_2x9d _pry" }),
        React.createElement(XUIText476, null),
        React.createElement(
          "div",
          { className: "_3a-a" },
          React.createElement(
            "div",
            { className: "_3a-b" },
            React.createElement(XUIText477, null)
          )
        ),
        null,
        React.createElement(AdsPEEditorChildLinkContainer479, null)
      );
    }
  });

  var AdsPEAdgroupHeaderSectionContainer481 = React.createClass({
    displayName: "AdsPEAdgroupHeaderSectionContainer481",

    render: function () {
      return React.createElement(AdsPEHeaderSection480, null);
    }
  });

  var AdsPEAdgroupDisapprovalMessage482 = React.createClass({
    displayName: "AdsPEAdgroupDisapprovalMessage482",

    render: function () {
      return null;
    }
  });

  var FluxContainer_r_483 = React.createClass({
    displayName: "FluxContainer_r_483",

    render: function () {
      return React.createElement(AdsPEAdgroupDisapprovalMessage482, null);
    }
  });

  var AdsPEAdgroupAutoNamingConfirmationContainer484 = React.createClass({
    displayName: "AdsPEAdgroupAutoNamingConfirmationContainer484",

    render: function () {
      return null;
    }
  });

  var AdsLabeledField485 = React.createClass({
    displayName: "AdsLabeledField485",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5ir9 _3bvz", label: "Ad Name", labelSize: "small" },
        React.createElement(
          "label",
          { className: "_4el4 _3qwj _3hy-", htmlFor: undefined },
          "Ad Name",
          " ",
          undefined
        ),
        null,
        React.createElement("div", { className: "_3bv-" })
      );
    }
  });

  var ReactXUIError486 = React.createClass({
    displayName: "ReactXUIError486",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5ira _2vl4 _1h18" },
        null,
        null,
        React.createElement(
          "div",
          { className: "_2vl9 _1h1f", style: { "backgroundColor": "#fff" } },
          React.createElement(
            "div",
            { className: "_2vla _1h1g" },
            React.createElement(
              "div",
              null,
              null,
              React.createElement("textarea", { ref: "input", id: undefined, disabled: undefined, onKeyDown: function () {}, onFocus: function () {}, onBlur: function () {}, onChange: function () {}, dir: "auto", maxLength: null, className: "_2vli _2vlj _1h26 _1h27", value: "Test Ad" }),
              null
            ),
            React.createElement("div", { ref: "shadowText", "aria-hidden": "true", className: "_2vlk" })
          )
        ),
        null
      );
    }
  });

  var AdsTextInput487 = React.createClass({
    displayName: "AdsTextInput487",

    render: function () {
      return React.createElement(ReactXUIError486, null);
    }
  });

  var Link488 = React.createClass({
    displayName: "Link488",

    render: function () {
      return React.createElement(
        "a",
        { className: "_5ir9", label: "Rename using available fields", onMouseDown: function () {}, href: "#", rel: undefined, onClick: function () {} },
        "Rename using available fields"
      );
    }
  });

  var AdsAutoNamingTemplateDialog489 = React.createClass({
    displayName: "AdsAutoNamingTemplateDialog489",

    render: function () {
      return React.createElement(Link488, { ref: "link" });
    }
  });

  var AdsPEAmbientNUXMegaphone490 = React.createClass({
    displayName: "AdsPEAmbientNUXMegaphone490",

    render: function () {
      return React.createElement(
        "span",
        { ref: "mainChild" },
        React.createElement(AdsAutoNamingTemplateDialog489, null)
      );
    }
  });

  var AdsLabeledField491 = React.createClass({
    displayName: "AdsLabeledField491",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5ir9 _3bvz", label: "Status", labelSize: "small" },
        React.createElement(
          "label",
          { className: "_4el4 _3qwj _3hy-", htmlFor: undefined },
          "Status",
          " ",
          undefined
        ),
        null,
        React.createElement("div", { className: "_3bv-" })
      );
    }
  });

  var BUISwitch492 = React.createClass({
    displayName: "BUISwitch492",

    render: function () {
      return React.createElement(
        "div",
        { value: true, disabled: true, onToggle: function () {}, "data-hover": "tooltip", "data-tooltip-position": "below", "aria-label": "Currently active and you can not deactivate it.", animate: true, className: "_128j _128k _128m _128n", role: "checkbox", "aria-checked": "true" },
        React.createElement(
          "div",
          { className: "_128o", onClick: function () {}, onKeyDown: function () {}, onMouseDown: function () {}, tabIndex: "-1" },
          React.createElement("div", { className: "_128p" })
        ),
        null
      );
    }
  });

  var AdsStatusSwitchInternal493 = React.createClass({
    displayName: "AdsStatusSwitchInternal493",

    render: function () {
      return React.createElement(BUISwitch492, null);
    }
  });

  var AdsStatusSwitch494 = React.createClass({
    displayName: "AdsStatusSwitch494",

    render: function () {
      return React.createElement(AdsStatusSwitchInternal493, null);
    }
  });

  var LeftRight495 = React.createClass({
    displayName: "LeftRight495",

    render: function () {
      return React.createElement(
        "div",
        { className: "clearfix" },
        React.createElement(
          "div",
          { key: "left", className: "_ohe lfloat" },
          React.createElement(
            "div",
            null,
            React.createElement(AdsLabeledField485, null),
            React.createElement(
              "span",
              { className: "_5irl" },
              React.createElement(AdsTextInput487, { key: "nameEditor98010048849345", ref: "nameTextInput" }),
              React.createElement(AdsPEAmbientNUXMegaphone490, null)
            )
          )
        ),
        React.createElement(
          "div",
          { key: "right", className: "_ohf rfloat" },
          React.createElement(
            "div",
            null,
            React.createElement(AdsLabeledField491, null),
            React.createElement(
              "div",
              { className: "_5irp" },
              React.createElement(AdsStatusSwitch494, null)
            )
          )
        )
      );
    }
  });

  var XUICard496 = React.createClass({
    displayName: "XUICard496",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5ir8 _12k2 _4-u2  _4-u8", xuiErrorPosition: "above", background: "white" },
        React.createElement(LeftRight495, null)
      );
    }
  });

  var ReactXUIError497 = React.createClass({
    displayName: "ReactXUIError497",

    render: function () {
      return React.createElement(XUICard496, null);
    }
  });

  var AdsCard498 = React.createClass({
    displayName: "AdsCard498",

    render: function () {
      return React.createElement(ReactXUIError497, null);
    }
  });

  var AdsPENameSection499 = React.createClass({
    displayName: "AdsPENameSection499",

    render: function () {
      return React.createElement(AdsCard498, null);
    }
  });

  var AdsPEAdgroupNameSectionContainer500 = React.createClass({
    displayName: "AdsPEAdgroupNameSectionContainer500",

    render: function () {
      return React.createElement(AdsPENameSection499, null);
    }
  });

  var XUICardHeaderTitle501 = React.createClass({
    displayName: "XUICardHeaderTitle501",

    render: function () {
      return React.createElement(
        "span",
        { itemComponent: "span", className: "_38my" },
        "Ad Links",
        null,
        React.createElement("span", { className: "_c1c" })
      );
    }
  });

  var XUICardSection502 = React.createClass({
    displayName: "XUICardSection502",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5dw9 _5dwa _4-u3", background: "transparent" },
        [React.createElement(XUICardHeaderTitle501, { key: "/.0" })],
        undefined,
        undefined,
        React.createElement("div", { className: "_3s3-" })
      );
    }
  });

  var XUICardHeader503 = React.createClass({
    displayName: "XUICardHeader503",

    render: function () {
      return React.createElement(XUICardSection502, null);
    }
  });

  var AdsCardHeader504 = React.createClass({
    displayName: "AdsCardHeader504",

    render: function () {
      return React.createElement(XUICardHeader503, null);
    }
  });

  var XUIText505 = React.createClass({
    displayName: "XUIText505",

    render: function () {
      return React.createElement(
        "div",
        { className: "_502s", display: "block", size: "inherit", weight: "inherit" },
        "Ad ID 98010048849345"
      );
    }
  });

  var Link506 = React.createClass({
    displayName: "Link506",

    render: function () {
      return React.createElement(
        "a",
        { target: "_blank", href: "/ads/manager/ad/?ids=98010048849345", onClick: function () {}, rel: undefined },
        "Open in Ads Manager"
      );
    }
  });

  var Link507 = React.createClass({
    displayName: "Link507",

    render: function () {
      return React.createElement(
        "a",
        { target: "_blank", href: "#", onClick: function () {}, rel: undefined },
        "Open in Ads Reporting"
      );
    }
  });

  var Link508 = React.createClass({
    displayName: "Link508",

    render: function () {
      return React.createElement(
        "a",
        { target: "_blank", href: "https://www.facebook.com/?demo_ad=98010048849345&h=AQA24w3temAtB-5f#pagelet_ego_pane", onClick: function () {}, rel: undefined },
        "View on Desktop Right Column"
      );
    }
  });

  var Link509 = React.createClass({
    displayName: "Link509",

    render: function () {
      return React.createElement(
        "a",
        { target: "_blank", href: "/ads/manage/powereditor/?act=10149999073643408&adgroup=98010048849345", onClick: function () {}, rel: undefined },
        "Open Power Editor with this ad selected"
      );
    }
  });

  var List510 = React.createClass({
    displayName: "List510",

    render: function () {
      return React.createElement(
        "ul",
        { spacing: "small", border: "none", direction: "vertical", valign: "top", className: "uiList _4kg _6-i _6-h _704" },
        null,
        React.createElement(
          "li",
          { key: "/ads/manager/ad/?ids=98010048849345" },
          React.createElement(Link506, null)
        ),
        React.createElement(
          "li",
          { key: "#" },
          React.createElement(Link507, null)
        ),
        null,
        React.createElement(
          "li",
          { key: "https://www.facebook.com/?demo_ad=98010048849345&h=AQA24w3temAtB-5f#pagelet_ego_pane" },
          React.createElement(Link508, null)
        ),
        null,
        null,
        null,
        React.createElement(
          "li",
          { key: "/ads/manage/powereditor/?act=10149999073643408&adgroup=98010048849345" },
          React.createElement(Link509, null)
        ),
        null
      );
    }
  });

  var XUICardSection511 = React.createClass({
    displayName: "XUICardSection511",

    render: function () {
      return React.createElement(
        "div",
        { className: "_12jy _4-u3", background: "transparent" },
        React.createElement(
          "div",
          { className: "_3-8j" },
          React.createElement(XUIText505, null),
          React.createElement(List510, null)
        )
      );
    }
  });

  var AdsCardSection512 = React.createClass({
    displayName: "AdsCardSection512",

    render: function () {
      return React.createElement(XUICardSection511, null);
    }
  });

  var XUICard513 = React.createClass({
    displayName: "XUICard513",

    render: function () {
      return React.createElement(
        "div",
        { xuiErrorPosition: "above", className: "_12k2 _4-u2  _4-u8", background: "white" },
        React.createElement(AdsCardHeader504, null),
        React.createElement(AdsCardSection512, null)
      );
    }
  });

  var ReactXUIError514 = React.createClass({
    displayName: "ReactXUIError514",

    render: function () {
      return React.createElement(XUICard513, null);
    }
  });

  var AdsCard515 = React.createClass({
    displayName: "AdsCard515",

    render: function () {
      return React.createElement(ReactXUIError514, null);
    }
  });

  var AdsPELinkList516 = React.createClass({
    displayName: "AdsPELinkList516",

    render: function () {
      return React.createElement(AdsCard515, null);
    }
  });

  var AdsPEAdgroupLinksSection517 = React.createClass({
    displayName: "AdsPEAdgroupLinksSection517",

    render: function () {
      return React.createElement(AdsPELinkList516, null);
    }
  });

  var AdsPEAdgroupLinksSectionContainer518 = React.createClass({
    displayName: "AdsPEAdgroupLinksSectionContainer518",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsPEAdgroupLinksSection517, null),
        null
      );
    }
  });

  var XUICardHeaderTitle519 = React.createClass({
    displayName: "XUICardHeaderTitle519",

    render: function () {
      return React.createElement(
        "span",
        { itemComponent: "span", className: "_38my" },
        "Preview",
        null,
        React.createElement("span", { className: "_c1c" })
      );
    }
  });

  var XUICardSection520 = React.createClass({
    displayName: "XUICardSection520",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5dw9 _5dwa _4-u3", background: "transparent" },
        [React.createElement(XUICardHeaderTitle519, { key: "/.0" })],
        undefined,
        undefined,
        React.createElement("div", { className: "_3s3-" })
      );
    }
  });

  var XUICardHeader521 = React.createClass({
    displayName: "XUICardHeader521",

    render: function () {
      return React.createElement(XUICardSection520, null);
    }
  });

  var AdsCardHeader522 = React.createClass({
    displayName: "AdsCardHeader522",

    render: function () {
      return React.createElement(XUICardHeader521, null);
    }
  });

  var PillButton523 = React.createClass({
    displayName: "PillButton523",

    render: function () {
      return React.createElement(
        "a",
        { label: null, selected: true, onClick: function () {}, href: "#", className: "uiPillButton uiPillButtonSelected" },
        "Desktop Right Column"
      );
    }
  });

  var List524 = React.createClass({
    displayName: "List524",

    render: function () {
      return React.createElement(
        "ul",
        { className: "uiList  _4ki _509- _6-i _6-h _704", border: "none", direction: "horizontal", spacing: "small", valign: "top" },
        React.createElement(
          "li",
          { key: "0/.$RIGHT_COLUMN_STANDARD" },
          React.createElement(PillButton523, { key: "RIGHT_COLUMN_STANDARD" })
        )
      );
    }
  });

  var PillList525 = React.createClass({
    displayName: "PillList525",

    render: function () {
      return React.createElement(List524, null);
    }
  });

  var XUICardSection526 = React.createClass({
    displayName: "XUICardSection526",

    render: function () {
      return React.createElement(
        "div",
        { background: "light-wash", className: "_14p9 _12jy _4-u3  _57d8" },
        React.createElement(
          "div",
          { className: "_3-8j" },
          React.createElement(PillList525, null)
        )
      );
    }
  });

  var AdsCardSection527 = React.createClass({
    displayName: "AdsCardSection527",

    render: function () {
      return React.createElement(XUICardSection526, null);
    }
  });

  var AdsPEPreviewPillList528 = React.createClass({
    displayName: "AdsPEPreviewPillList528",

    render: function () {
      return React.createElement(AdsCardSection527, null);
    }
  });

  var XUISpinner529 = React.createClass({
    displayName: "XUISpinner529",

    render: function () {
      return React.createElement("span", { size: "large", className: "hidden_elem img _55ym _55yq _55yo", showOnAsync: false, background: "light", "aria-label": "Loading...", "aria-busy": true });
    }
  });

  var ReactImage530 = React.createClass({
    displayName: "ReactImage530",

    render: function () {
      return React.createElement(
        "i",
        { alt: "Warning", className: "_585p img sp_R48dKBxiJkP sx_aed870", src: null },
        React.createElement(
          "u",
          null,
          "Warning"
        )
      );
    }
  });

  var XUINotice531 = React.createClass({
    displayName: "XUINotice531",

    render: function () {
      return React.createElement(
        "div",
        { size: "medium", className: "_585n _585o" },
        React.createElement(ReactImage530, null),
        null,
        React.createElement(
          "div",
          { className: "_585r _50f4" },
          "Unable to display a preview for this ad."
        )
      );
    }
  });

  var AdPreview532 = React.createClass({
    displayName: "AdPreview532",

    render: function () {
      return React.createElement(
        "div",
        { className: "_2hm6" },
        React.createElement(
          "div",
          { className: undefined },
          React.createElement(
            "div",
            { className: "_3akw" },
            React.createElement(XUISpinner529, null)
          ),
          React.createElement(
            "div",
            { className: "hidden_elem" },
            React.createElement(XUINotice531, null)
          ),
          React.createElement("div", { ref: "pageletContainer", className: "" })
        )
      );
    }
  });

  var XUICardSection533 = React.createClass({
    displayName: "XUICardSection533",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3m4g _12jy _4-u3", style: { "maxHeight": "425px" }, background: "transparent" },
        React.createElement(
          "div",
          { className: "_3-8j" },
          React.createElement(
            "div",
            { className: "_14p7" },
            React.createElement(
              "div",
              { className: "_14p8" },
              React.createElement(AdPreview532, null)
            )
          )
        )
      );
    }
  });

  var AdsCardSection534 = React.createClass({
    displayName: "AdsCardSection534",

    render: function () {
      return React.createElement(XUICardSection533, null);
    }
  });

  var AdsPEPreview535 = React.createClass({
    displayName: "AdsPEPreview535",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsPEPreviewPillList528, { ref: "pillList" }),
        undefined,
        React.createElement(AdsCardSection534, null)
      );
    }
  });

  var AdsPEStandardPreview536 = React.createClass({
    displayName: "AdsPEStandardPreview536",

    render: function () {
      return React.createElement(AdsPEPreview535, null);
    }
  });

  var AdsPEStandardPreviewContainer537 = React.createClass({
    displayName: "AdsPEStandardPreviewContainer537",

    render: function () {
      return React.createElement(AdsPEStandardPreview536, null);
    }
  });

  var XUICard538 = React.createClass({
    displayName: "XUICard538",

    render: function () {
      return React.createElement(
        "div",
        { xuiErrorPosition: "above", className: "_12k2 _4-u2  _4-u8", background: "white" },
        React.createElement(AdsCardHeader522, null),
        null,
        React.createElement(AdsPEStandardPreviewContainer537, null)
      );
    }
  });

  var ReactXUIError539 = React.createClass({
    displayName: "ReactXUIError539",

    render: function () {
      return React.createElement(XUICard538, null);
    }
  });

  var AdsCard540 = React.createClass({
    displayName: "AdsCard540",

    render: function () {
      return React.createElement(ReactXUIError539, null);
    }
  });

  var AdsPEAdgroupPreviewSection541 = React.createClass({
    displayName: "AdsPEAdgroupPreviewSection541",

    render: function () {
      return React.createElement(AdsCard540, null);
    }
  });

  var AdsPEAdgroupPreviewSectionContainer542 = React.createClass({
    displayName: "AdsPEAdgroupPreviewSectionContainer542",

    render: function () {
      return React.createElement(AdsPEAdgroupPreviewSection541, null);
    }
  });

  var AdsPEStickyArea543 = React.createClass({
    displayName: "AdsPEStickyArea543",

    render: function () {
      return React.createElement(
        "div",
        null,
        null,
        React.createElement(
          "div",
          { ref: "sticky" },
          React.createElement(AdsPEAdgroupPreviewSectionContainer542, null)
        )
      );
    }
  });

  var XUICardHeaderTitle544 = React.createClass({
    displayName: "XUICardHeaderTitle544",

    render: function () {
      return React.createElement(
        "span",
        { itemComponent: "span", className: "_38my" },
        "Facebook Page",
        null,
        React.createElement("span", { className: "_c1c" })
      );
    }
  });

  var XUICardSection545 = React.createClass({
    displayName: "XUICardSection545",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5dw9 _5dwa _4-u3", background: "transparent" },
        [React.createElement(XUICardHeaderTitle544, { key: "/.0" })],
        undefined,
        undefined,
        React.createElement("div", { className: "_3s3-" })
      );
    }
  });

  var XUICardHeader546 = React.createClass({
    displayName: "XUICardHeader546",

    render: function () {
      return React.createElement(XUICardSection545, null);
    }
  });

  var AdsCardHeader547 = React.createClass({
    displayName: "AdsCardHeader547",

    render: function () {
      return React.createElement(XUICardHeader546, null);
    }
  });

  var Link548 = React.createClass({
    displayName: "Link548",

    render: function () {
      return React.createElement(
        "a",
        { className: "fwb", onClick: function () {}, href: "#", rel: undefined },
        "Connect a Facebook Page"
      );
    }
  });

  var AdsPEWebsiteNoPageDestinationSection549 = React.createClass({
    displayName: "AdsPEWebsiteNoPageDestinationSection549",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          { className: "_3-95" },
          "This ad is not connected to a Facebook Page. It will not show in News Feed."
        ),
        React.createElement(Link548, null)
      );
    }
  });

  var AdsPEWebsiteNoPageDestinationSectionContainer550 = React.createClass({
    displayName: "AdsPEWebsiteNoPageDestinationSectionContainer550",

    render: function () {
      return React.createElement(AdsPEWebsiteNoPageDestinationSection549, null);
    }
  });

  var XUICardSection551 = React.createClass({
    displayName: "XUICardSection551",

    render: function () {
      return React.createElement(
        "div",
        { className: "_12jy _4-u3", background: "transparent" },
        React.createElement(
          "div",
          { className: "_3-8j" },
          React.createElement(AdsPEWebsiteNoPageDestinationSectionContainer550, null)
        )
      );
    }
  });

  var AdsCardSection552 = React.createClass({
    displayName: "AdsCardSection552",

    render: function () {
      return React.createElement(XUICardSection551, null);
    }
  });

  var XUICard553 = React.createClass({
    displayName: "XUICard553",

    render: function () {
      return React.createElement(
        "div",
        { xuiErrorPosition: "above", className: "_12k2 _4-u2  _4-u8", background: "white" },
        React.createElement(AdsCardHeader547, null),
        React.createElement(AdsCardSection552, null)
      );
    }
  });

  var ReactXUIError554 = React.createClass({
    displayName: "ReactXUIError554",

    render: function () {
      return React.createElement(XUICard553, null);
    }
  });

  var AdsCard555 = React.createClass({
    displayName: "AdsCard555",

    render: function () {
      return React.createElement(ReactXUIError554, null);
    }
  });

  var AdsPEAdgroupDestinationSection556 = React.createClass({
    displayName: "AdsPEAdgroupDestinationSection556",

    render: function () {
      return React.createElement(AdsCard555, null);
    }
  });

  var AdsPEAdgroupDestinationSectionContainer557 = React.createClass({
    displayName: "AdsPEAdgroupDestinationSectionContainer557",

    render: function () {
      return React.createElement(AdsPEAdgroupDestinationSection556, null);
    }
  });

  var XUICardHeaderTitle558 = React.createClass({
    displayName: "XUICardHeaderTitle558",

    render: function () {
      return React.createElement(
        "span",
        { itemComponent: "span", className: "_38my" },
        "Creative",
        null,
        React.createElement("span", { className: "_c1c" })
      );
    }
  });

  var XUICardSection559 = React.createClass({
    displayName: "XUICardSection559",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5dw9 _5dwa _4-u3", background: "transparent" },
        [React.createElement(XUICardHeaderTitle558, { key: "/.0" })],
        undefined,
        undefined,
        React.createElement("div", { className: "_3s3-" })
      );
    }
  });

  var XUICardHeader560 = React.createClass({
    displayName: "XUICardHeader560",

    render: function () {
      return React.createElement(XUICardSection559, null);
    }
  });

  var AdsCardHeader561 = React.createClass({
    displayName: "AdsCardHeader561",

    render: function () {
      return React.createElement(XUICardHeader560, null);
    }
  });

  var ReactImage562 = React.createClass({
    displayName: "ReactImage562",

    render: function () {
      return React.createElement("i", { src: null, className: "_541d img sp_R48dKBxiJkP sx_dc2cdb" });
    }
  });

  var AdsPopoverLink563 = React.createClass({
    displayName: "AdsPopoverLink563",

    render: function () {
      return React.createElement(
        "span",
        { ref: "tipIcon", onMouseEnter: function () {}, onMouseLeave: function () {} },
        React.createElement("span", { className: "_3o_j" }),
        React.createElement(ReactImage562, null)
      );
    }
  });

  var AdsHelpLink564 = React.createClass({
    displayName: "AdsHelpLink564",

    render: function () {
      return React.createElement(AdsPopoverLink563, null);
    }
  });

  var AdsLabeledField565 = React.createClass({
    displayName: "AdsLabeledField565",

    render: function () {
      return React.createElement(
        "div",
        { htmlFor: undefined, label: "Website URL", helpText: "Enter the website URL you want to promote. Ex: http://www.example.com/page", helpLinger: undefined, optional: undefined, labelSize: "small", className: "_3bvz" },
        React.createElement(
          "label",
          { className: "_4el4 _3qwj _3hy-", htmlFor: undefined },
          "Website URL",
          " ",
          undefined
        ),
        React.createElement(AdsHelpLink564, null),
        React.createElement("div", { className: "_3bv-" })
      );
    }
  });

  var ReactXUIError566 = React.createClass({
    displayName: "ReactXUIError566",

    render: function () {
      return React.createElement(
        "div",
        { className: "_gon _2vl4 _1h18" },
        React.createElement(
          "div",
          { className: "_2vln" },
          1001
        ),
        React.createElement(AdsLabeledField565, null),
        React.createElement(
          "div",
          { className: "_2vl9 _1h1f", style: { "backgroundColor": "#fff" } },
          React.createElement(
            "div",
            { className: "_2vla _1h1g" },
            React.createElement(
              "div",
              null,
              null,
              React.createElement("textarea", { ref: "input", id: undefined, disabled: undefined, onKeyDown: function () {}, onFocus: function () {}, onBlur: function () {}, onChange: function () {}, dir: "auto", maxLength: null, className: "_2vli _2vlj _1h26 _1h27", value: "http://www.example.com/" }),
              null
            ),
            React.createElement("div", { ref: "shadowText", "aria-hidden": "true", className: "_2vlk" })
          )
        ),
        null
      );
    }
  });

  var AdsTextInput567 = React.createClass({
    displayName: "AdsTextInput567",

    render: function () {
      return React.createElement(ReactXUIError566, null);
    }
  });

  var AdsBulkTextInput568 = React.createClass({
    displayName: "AdsBulkTextInput568",

    render: function () {
      return React.createElement(AdsTextInput567, null);
    }
  });

  var AdsPEWebsiteURLField569 = React.createClass({
    displayName: "AdsPEWebsiteURLField569",

    render: function () {
      return React.createElement(AdsBulkTextInput568, null);
    }
  });

  var ReactImage570 = React.createClass({
    displayName: "ReactImage570",

    render: function () {
      return React.createElement("i", { src: null, className: "_541d img sp_R48dKBxiJkP sx_dc2cdb" });
    }
  });

  var AdsPopoverLink571 = React.createClass({
    displayName: "AdsPopoverLink571",

    render: function () {
      return React.createElement(
        "span",
        { ref: "tipIcon", onMouseEnter: function () {}, onMouseLeave: function () {} },
        React.createElement("span", { className: "_3o_j" }),
        React.createElement(ReactImage570, null)
      );
    }
  });

  var AdsHelpLink572 = React.createClass({
    displayName: "AdsHelpLink572",

    render: function () {
      return React.createElement(AdsPopoverLink571, null);
    }
  });

  var AdsLabeledField573 = React.createClass({
    displayName: "AdsLabeledField573",

    render: function () {
      return React.createElement(
        "div",
        { htmlFor: undefined, label: "Headline", helpText: "Your headline text will appear differently depending on the placement of your ad. Check the previews to make sure your headline looks the way you want in the placements it appears in.", helpLinger: undefined, optional: undefined, labelSize: "small", className: "_3bvz" },
        React.createElement(
          "label",
          { className: "_4el4 _3qwj _3hy-", htmlFor: undefined },
          "Headline",
          " ",
          undefined
        ),
        React.createElement(AdsHelpLink572, null),
        React.createElement("div", { className: "_3bv-" })
      );
    }
  });

  var ReactXUIError574 = React.createClass({
    displayName: "ReactXUIError574",

    render: function () {
      return React.createElement(
        "div",
        { className: "_gon _2vl4 _1h18" },
        React.createElement(
          "div",
          { className: "_2vln" },
          18
        ),
        React.createElement(AdsLabeledField573, null),
        React.createElement(
          "div",
          { className: "_2vl9 _1h1f", style: { "backgroundColor": "#fff" } },
          React.createElement(
            "div",
            { className: "_2vla _1h1g" },
            React.createElement(
              "div",
              null,
              null,
              React.createElement("textarea", { ref: "input", id: undefined, disabled: undefined, onKeyDown: function () {}, onFocus: function () {}, onBlur: function () {}, onChange: function () {}, dir: "auto", maxLength: null, className: "_2vli _2vlj _1h26 _1h27", value: "Example" }),
              null
            ),
            React.createElement("div", { ref: "shadowText", "aria-hidden": "true", className: "_2vlk" })
          )
        ),
        null
      );
    }
  });

  var AdsTextInput575 = React.createClass({
    displayName: "AdsTextInput575",

    render: function () {
      return React.createElement(ReactXUIError574, null);
    }
  });

  var AdsBulkTextInput576 = React.createClass({
    displayName: "AdsBulkTextInput576",

    render: function () {
      return React.createElement(AdsTextInput575, null);
    }
  });

  var AdsPEHeadlineField577 = React.createClass({
    displayName: "AdsPEHeadlineField577",

    render: function () {
      return React.createElement(AdsBulkTextInput576, null);
    }
  });

  var AdsLabeledField578 = React.createClass({
    displayName: "AdsLabeledField578",

    render: function () {
      return React.createElement(
        "div",
        { htmlFor: undefined, label: "Text", helpText: undefined, helpLinger: undefined, optional: undefined, labelSize: "small", className: "_3bvz" },
        React.createElement(
          "label",
          { className: "_4el4 _3qwj _3hy-", htmlFor: undefined },
          "Text",
          " ",
          undefined
        ),
        null,
        React.createElement("div", { className: "_3bv-" })
      );
    }
  });

  var ReactXUIError579 = React.createClass({
    displayName: "ReactXUIError579",

    render: function () {
      return React.createElement(
        "div",
        { className: "_gon _2vl4 _2vl6 _1h18 _1h1a" },
        React.createElement(
          "div",
          { className: "_2vln" },
          74
        ),
        React.createElement(AdsLabeledField578, null),
        React.createElement(
          "div",
          { className: "_2vl9 _1h1f", style: { "backgroundColor": "#fff" } },
          React.createElement(
            "div",
            { className: "_2vla _1h1g" },
            React.createElement(
              "div",
              null,
              null,
              React.createElement("textarea", { ref: "input", id: undefined, disabled: undefined, onKeyDown: function () {}, onFocus: function () {}, onBlur: function () {}, onChange: function () {}, dir: "auto", maxLength: null, className: "_2vli _2vlj _1h26 _1h27", value: "It's an example." }),
              null
            ),
            React.createElement("div", { ref: "shadowText", "aria-hidden": "true", className: "_2vlk" })
          )
        ),
        null
      );
    }
  });

  var AdsTextInput580 = React.createClass({
    displayName: "AdsTextInput580",

    render: function () {
      return React.createElement(ReactXUIError579, null);
    }
  });

  var AdsBulkTextInput581 = React.createClass({
    displayName: "AdsBulkTextInput581",

    render: function () {
      return React.createElement(AdsTextInput580, null);
    }
  });

  var AdsPEMessageField582 = React.createClass({
    displayName: "AdsPEMessageField582",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsBulkTextInput581, null),
        null
      );
    }
  });

  var AbstractButton583 = React.createClass({
    displayName: "AbstractButton583",

    render: function () {
      return React.createElement(
        "button",
        { label: null, onClick: function () {}, size: "large", use: "default", borderShade: "light", suppressed: false, className: "_4jy0 _4jy4 _517h _51sy _42ft", type: "submit", value: "1" },
        undefined,
        "Change Image",
        undefined
      );
    }
  });

  var XUIButton584 = React.createClass({
    displayName: "XUIButton584",

    render: function () {
      return React.createElement(AbstractButton583, null);
    }
  });

  var BackgroundImage585 = React.createClass({
    displayName: "BackgroundImage585",

    render: function () {
      return React.createElement(
        "div",
        { src: "https://scontent.xx.fbcdn.net/hads-xap1/t45.1600-4/12124737_98010048849339_1665004369_n.png", width: 114.6, height: 60, backgroundSize: "contain", optimizeResizeSpeed: false, loadingIndicatorStyle: "none", className: "_5f0d", style: { "width": "114.6px", "height": "60px" }, onContextMenu: undefined },
        React.createElement("img", { alt: "", className: "_5i4g", style: { "width": "90px", "height": "60px", "left": "12px", "top": "0px" }, src: "https://scontent.xx.fbcdn.net/hads-xap1/t45.1600-4/12124737_98010048849339_1665004369_n.png" }),
        undefined,
        null
      );
    }
  });

  var XUIText586 = React.createClass({
    displayName: "XUIText586",

    render: function () {
      return React.createElement(
        "span",
        { shade: "light", className: "_50f8", size: "inherit", weight: "inherit", display: "inline" },
        "1000 × 667"
      );
    }
  });

  var XUIGrayText587 = React.createClass({
    displayName: "XUIGrayText587",

    render: function () {
      return React.createElement(XUIText586, null);
    }
  });

  var XUIText588 = React.createClass({
    displayName: "XUIText588",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3-95  _50f7", display: "block", weight: "bold", size: "inherit" },
        "untitled – ",
        React.createElement(XUIGrayText587, null),
        ""
      );
    }
  });

  var CenteredContainer589 = React.createClass({
    displayName: "CenteredContainer589",

    render: function () {
      return React.createElement(
        "div",
        { className: "_50vi", horizontal: false, vertical: true, fullHeight: false },
        React.createElement(
          "div",
          { className: "_3bwv" },
          React.createElement(
            "div",
            { className: "_3bwy" },
            React.createElement(
              "div",
              { key: "/.0", className: "_3bwx" },
              React.createElement(XUIText588, null)
            ),
            React.createElement("div", { key: "/.1", className: "_3bwx" })
          )
        )
      );
    }
  });

  var Link590 = React.createClass({
    displayName: "Link590",

    render: function () {
      return React.createElement(
        "a",
        { href: "/business/ads-guide/", target: "_blank", rel: undefined, onClick: function () {} },
        "Facebook Ad Guidelines"
      );
    }
  });

  var XUIText591 = React.createClass({
    displayName: "XUIText591",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3-96", display: "block", size: "inherit", weight: "inherit" },
        "For questions and more information, see the ",
        React.createElement(Link590, null),
        "."
      );
    }
  });

  var AdsImageInput592 = React.createClass({
    displayName: "AdsImageInput592",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          null,
          React.createElement(XUIButton584, null),
          undefined
        ),
        null,
        React.createElement(
          "div",
          { className: "_50vh _3-8n _2ph_" },
          React.createElement(
            "div",
            { className: "_37xq" },
            React.createElement(
              "div",
              { className: "_3-90" },
              React.createElement(
                "div",
                { className: " _1yi2", onContextMenu: undefined },
                React.createElement(BackgroundImage585, null)
              )
            ),
            React.createElement(CenteredContainer589, null)
          ),
          null
        ),
        React.createElement(XUIText591, null),
        null
      );
    }
  });

  var AdsBulkImageInput593 = React.createClass({
    displayName: "AdsBulkImageInput593",

    render: function () {
      return React.createElement(AdsImageInput592, null);
    }
  });

  var AdsLabeledField594 = React.createClass({
    displayName: "AdsLabeledField594",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3-96 _3bvz", label: "Image", labelSize: "small" },
        React.createElement(
          "label",
          { className: "_4el4 _3qwj _3hy-", htmlFor: undefined },
          "Image",
          " ",
          undefined
        ),
        null,
        React.createElement(
          "div",
          { className: "_3bv-" },
          React.createElement(AdsBulkImageInput593, null)
        )
      );
    }
  });

  var AdsPEImageSelector595 = React.createClass({
    displayName: "AdsPEImageSelector595",

    render: function () {
      return React.createElement(AdsLabeledField594, null);
    }
  });

  var AdsPEImageSelectorContainer596 = React.createClass({
    displayName: "AdsPEImageSelectorContainer596",

    render: function () {
      return React.createElement(AdsPEImageSelector595, null);
    }
  });

  var AdsPEWebsiteNoPageCreative597 = React.createClass({
    displayName: "AdsPEWebsiteNoPageCreative597",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsPEWebsiteURLField569, null),
        React.createElement(AdsPEHeadlineField577, null),
        React.createElement(AdsPEMessageField582, null),
        React.createElement(AdsPEImageSelectorContainer596, null)
      );
    }
  });

  var AdsPEWebsiteNoPageCreativeContainer598 = React.createClass({
    displayName: "AdsPEWebsiteNoPageCreativeContainer598",

    render: function () {
      return React.createElement(AdsPEWebsiteNoPageCreative597, null);
    }
  });

  var XUICardSection599 = React.createClass({
    displayName: "XUICardSection599",

    render: function () {
      return React.createElement(
        "div",
        { className: "_12jy _4-u3", background: "transparent" },
        React.createElement(
          "div",
          { className: "_3-8j" },
          React.createElement("div", null),
          React.createElement(AdsPEWebsiteNoPageCreativeContainer598, null)
        )
      );
    }
  });

  var AdsCardSection600 = React.createClass({
    displayName: "AdsCardSection600",

    render: function () {
      return React.createElement(XUICardSection599, null);
    }
  });

  var XUICard601 = React.createClass({
    displayName: "XUICard601",

    render: function () {
      return React.createElement(
        "div",
        { xuiErrorPosition: "above", className: "_12k2 _4-u2  _4-u8", background: "white" },
        React.createElement(AdsCardHeader561, null),
        React.createElement(AdsCardSection600, null)
      );
    }
  });

  var ReactXUIError602 = React.createClass({
    displayName: "ReactXUIError602",

    render: function () {
      return React.createElement(XUICard601, null);
    }
  });

  var AdsCard603 = React.createClass({
    displayName: "AdsCard603",

    render: function () {
      return React.createElement(ReactXUIError602, null);
    }
  });

  var AdsPEAdgroupCreativeSection604 = React.createClass({
    displayName: "AdsPEAdgroupCreativeSection604",

    render: function () {
      return React.createElement(AdsCard603, null);
    }
  });

  var AdsPEAdgroupCreativeSectionContainer605 = React.createClass({
    displayName: "AdsPEAdgroupCreativeSectionContainer605",

    render: function () {
      return React.createElement(AdsPEAdgroupCreativeSection604, null);
    }
  });

  var AdsPELeadGenFormSection606 = React.createClass({
    displayName: "AdsPELeadGenFormSection606",

    render: function () {
      return null;
    }
  });

  var AdsPELeadGenFormContainer607 = React.createClass({
    displayName: "AdsPELeadGenFormContainer607",

    render: function () {
      return React.createElement(AdsPELeadGenFormSection606, null);
    }
  });

  var XUICardHeaderTitle608 = React.createClass({
    displayName: "XUICardHeaderTitle608",

    render: function () {
      return React.createElement(
        "span",
        { itemComponent: "span", className: "_38my" },
        "Tracking",
        null,
        React.createElement("span", { className: "_c1c" })
      );
    }
  });

  var XUICardSection609 = React.createClass({
    displayName: "XUICardSection609",

    render: function () {
      return React.createElement(
        "div",
        { className: "_5dw9 _5dwa _4-u3", background: "transparent" },
        [React.createElement(XUICardHeaderTitle608, { key: "/.0" })],
        undefined,
        undefined,
        React.createElement("div", { className: "_3s3-" })
      );
    }
  });

  var XUICardHeader610 = React.createClass({
    displayName: "XUICardHeader610",

    render: function () {
      return React.createElement(XUICardSection609, null);
    }
  });

  var AdsCardHeader611 = React.createClass({
    displayName: "AdsCardHeader611",

    render: function () {
      return React.createElement(XUICardHeader610, null);
    }
  });

  var XUIText612 = React.createClass({
    displayName: "XUIText612",

    render: function () {
      return React.createElement(
        "span",
        { weight: "bold", className: "_3ga-  _50f7", size: "inherit", display: "inline" },
        "Conversion Tracking"
      );
    }
  });

  var ReactImage613 = React.createClass({
    displayName: "ReactImage613",

    render: function () {
      return React.createElement("i", { src: null, className: "_5s_w _541d img sp_R48dKBxiJkP sx_dc2cdb" });
    }
  });

  var AdsPopoverLink614 = React.createClass({
    displayName: "AdsPopoverLink614",

    render: function () {
      return React.createElement(
        "span",
        { ref: "tipIcon", onMouseEnter: function () {}, onMouseLeave: function () {} },
        React.createElement("span", { className: "_3o_j" }),
        React.createElement(ReactImage613, null)
      );
    }
  });

  var AdsHelpLink615 = React.createClass({
    displayName: "AdsHelpLink615",

    render: function () {
      return React.createElement(AdsPopoverLink614, null);
    }
  });

  var AdsCFHelpLink616 = React.createClass({
    displayName: "AdsCFHelpLink616",

    render: function () {
      return React.createElement(AdsHelpLink615, null);
    }
  });

  var AdsPixelTrackingLabel617 = React.createClass({
    displayName: "AdsPixelTrackingLabel617",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3gay" },
        React.createElement(XUIText612, null),
        React.createElement(AdsCFHelpLink616, null)
      );
    }
  });

  var ReactImage618 = React.createClass({
    displayName: "ReactImage618",

    render: function () {
      return React.createElement("i", { src: null, className: "img _8o _8r img sp_UuU9HmrQ397 sx_ad67ef" });
    }
  });

  var XUIText619 = React.createClass({
    displayName: "XUIText619",

    render: function () {
      return React.createElement(
        "div",
        { size: "medium", weight: "bold", shade: "medium", display: "block", className: "_3-8m  _c24  _50f4 _50f7" },
        "Facebook Pixel"
      );
    }
  });

  var XUIGrayText620 = React.createClass({
    displayName: "XUIGrayText620",

    render: function () {
      return React.createElement(XUIText619, null);
    }
  });

  var XUIText621 = React.createClass({
    displayName: "XUIText621",

    render: function () {
      return React.createElement(
        "span",
        { size: "medium", weight: "inherit", display: "inline", className: " _50f4" },
        "Learn More"
      );
    }
  });

  var Link622 = React.createClass({
    displayName: "Link622",

    render: function () {
      return React.createElement(
        "a",
        { href: "/help/336923339852238", target: "_blank", rel: undefined, onClick: function () {} },
        React.createElement(XUIText621, null)
      );
    }
  });

  var XUIText623 = React.createClass({
    displayName: "XUIText623",

    render: function () {
      return React.createElement(
        "span",
        { shade: "medium", size: "medium", className: " _c24  _50f4", weight: "inherit", display: "inline" },
        "You can now create one pixel for tracking, optimization and remarketing.",
        React.createElement(
          "span",
          { className: "_3-99" },
          React.createElement(Link622, null)
        )
      );
    }
  });

  var XUIGrayText624 = React.createClass({
    displayName: "XUIGrayText624",

    render: function () {
      return React.createElement(XUIText623, null);
    }
  });

  var AbstractButton625 = React.createClass({
    displayName: "AbstractButton625",

    render: function () {
      return React.createElement(
        "button",
        { className: "_23ng _4jy0 _4jy4 _4jy1 _51sy selected _42ft", label: null, onClick: function () {}, size: "large", use: "confirm", borderShade: "light", suppressed: false, type: "submit", value: "1" },
        undefined,
        "Create a Pixel",
        undefined
      );
    }
  });

  var XUIButton626 = React.createClass({
    displayName: "XUIButton626",

    render: function () {
      return React.createElement(AbstractButton625, null);
    }
  });

  var AdsPixelCreateButton627 = React.createClass({
    displayName: "AdsPixelCreateButton627",

    render: function () {
      return React.createElement(XUIButton626, null);
    }
  });

  var LeftRight628 = React.createClass({
    displayName: "LeftRight628",

    render: function () {
      return React.createElement(
        "div",
        { className: "_23nf clearfix", direction: "left" },
        React.createElement(
          "div",
          { key: "left", className: "_ohe lfloat" },
          React.createElement(ReactImage618, null)
        ),
        React.createElement(
          "div",
          { key: "right", className: "" },
          React.createElement(
            "div",
            { className: "_42ef _8u" },
            React.createElement(
              "div",
              null,
              React.createElement(XUIGrayText620, null),
              React.createElement(XUIGrayText624, null),
              React.createElement(
                "div",
                { className: "_3-8x" },
                React.createElement(AdsPixelCreateButton627, null)
              )
            )
          )
        )
      );
    }
  });

  var ImageBlock629 = React.createClass({
    displayName: "ImageBlock629",

    render: function () {
      return React.createElement(LeftRight628, null);
    }
  });

  var AdsPixelCreationCard630 = React.createClass({
    displayName: "AdsPixelCreationCard630",

    render: function () {
      return React.createElement(
        "div",
        { className: "_2pie", horizontal: true },
        React.createElement(
          "div",
          { className: "_23ne _4fsl" },
          React.createElement(ImageBlock629, null)
        )
      );
    }
  });

  var AdsPixelTrackingSelector631 = React.createClass({
    displayName: "AdsPixelTrackingSelector631",

    render: function () {
      return React.createElement(
        "div",
        { className: "_3-8x _4fsk" },
        React.createElement(AdsPixelCreationCard630, { key: "FacebookPixelNUX" })
      );
    }
  });

  var AdsPixelTracking632 = React.createClass({
    displayName: "AdsPixelTracking632",

    render: function () {
      return React.createElement(
        "div",
        { className: undefined },
        React.createElement(AdsPixelTrackingLabel617, null),
        React.createElement(
          "div",
          { className: "_3-8x" },
          React.createElement("div", null)
        ),
        React.createElement(AdsPixelTrackingSelector631, null)
      );
    }
  });

  var AdsPEPixelTracking633 = React.createClass({
    displayName: "AdsPEPixelTracking633",

    render: function () {
      return React.createElement(AdsPixelTracking632, { key: "tracking" });
    }
  });

  var AdsPEPixelTrackingContainer634 = React.createClass({
    displayName: "AdsPEPixelTrackingContainer634",

    render: function () {
      return React.createElement(AdsPEPixelTracking633, null);
    }
  });

  var AdsPEAdgroupAppTrackingSelectorContainer635 = React.createClass({
    displayName: "AdsPEAdgroupAppTrackingSelectorContainer635",

    render: function () {
      return null;
    }
  });

  var AdsPEStandardTrackingSection636 = React.createClass({
    displayName: "AdsPEStandardTrackingSection636",

    render: function () {
      return React.createElement(
        "div",
        null,
        null,
        React.createElement(
          "div",
          { className: "_3-96" },
          React.createElement(AdsPEPixelTrackingContainer634, null)
        ),
        React.createElement(
          "div",
          { className: "_3-96" },
          React.createElement(AdsPEAdgroupAppTrackingSelectorContainer635, null)
        ),
        null
      );
    }
  });

  var AdsPEStandardTrackingContainer637 = React.createClass({
    displayName: "AdsPEStandardTrackingContainer637",

    render: function () {
      return React.createElement(AdsPEStandardTrackingSection636, null);
    }
  });

  var XUICardSection638 = React.createClass({
    displayName: "XUICardSection638",

    render: function () {
      return React.createElement(
        "div",
        { className: "_12jy _4-u3", background: "transparent" },
        React.createElement(
          "div",
          { className: "_3-8j" },
          React.createElement(AdsPEStandardTrackingContainer637, null)
        )
      );
    }
  });

  var AdsCardSection639 = React.createClass({
    displayName: "AdsCardSection639",

    render: function () {
      return React.createElement(XUICardSection638, null);
    }
  });

  var XUICard640 = React.createClass({
    displayName: "XUICard640",

    render: function () {
      return React.createElement(
        "div",
        { xuiErrorPosition: "above", className: "_12k2 _4-u2  _4-u8", background: "white" },
        React.createElement(AdsCardHeader611, null),
        React.createElement(AdsCardSection639, null)
      );
    }
  });

  var ReactXUIError641 = React.createClass({
    displayName: "ReactXUIError641",

    render: function () {
      return React.createElement(XUICard640, null);
    }
  });

  var AdsCard642 = React.createClass({
    displayName: "AdsCard642",

    render: function () {
      return React.createElement(ReactXUIError641, null);
    }
  });

  var AdsPEAdgroupTrackingSection643 = React.createClass({
    displayName: "AdsPEAdgroupTrackingSection643",

    render: function () {
      return React.createElement(AdsCard642, null);
    }
  });

  var AdsPEAdgroupTrackingSectionContainer644 = React.createClass({
    displayName: "AdsPEAdgroupTrackingSectionContainer644",

    render: function () {
      return React.createElement(AdsPEAdgroupTrackingSection643, null);
    }
  });

  var AdsPEAdgroupIOSection645 = React.createClass({
    displayName: "AdsPEAdgroupIOSection645",

    render: function () {
      return null;
    }
  });

  var AdsPEAdgroupIOSectionContainer646 = React.createClass({
    displayName: "AdsPEAdgroupIOSectionContainer646",

    render: function () {
      return React.createElement(AdsPEAdgroupIOSection645, null);
    }
  });

  var LeftRight647 = React.createClass({
    displayName: "LeftRight647",

    render: function () {
      return React.createElement(
        "div",
        { flex: "left", direction: "right", className: "clearfix" },
        React.createElement(
          "div",
          { key: "right", className: "_ohf rfloat" },
          React.createElement(
            "div",
            { className: "_20ro _20rp" },
            React.createElement(
              "div",
              null,
              null,
              React.createElement(AdsPEAdgroupLinksSectionContainer518, null),
              React.createElement(AdsPEStickyArea543, null)
            )
          )
        ),
        React.createElement(
          "div",
          { key: "left", className: "" },
          React.createElement(
            "div",
            { className: "_42ef" },
            React.createElement(
              "div",
              null,
              React.createElement(AdsPEAdgroupDestinationSectionContainer557, null),
              React.createElement(AdsPEAdgroupCreativeSectionContainer605, null),
              React.createElement(AdsPELeadGenFormContainer607, null),
              React.createElement(AdsPEAdgroupTrackingSectionContainer644, null),
              React.createElement(AdsPEAdgroupIOSectionContainer646, null)
            )
          )
        )
      );
    }
  });

  var FlexibleBlock648 = React.createClass({
    displayName: "FlexibleBlock648",

    render: function () {
      return React.createElement(LeftRight647, null);
    }
  });

  var AdsPEMultiColumnEditor649 = React.createClass({
    displayName: "AdsPEMultiColumnEditor649",

    render: function () {
      return React.createElement(
        "div",
        { className: "_2j_c _ykd" },
        React.createElement(
          "div",
          null,
          React.createElement(FluxContainer_r_483, null),
          null,
          React.createElement(AdsPEAdgroupAutoNamingConfirmationContainer484, null),
          React.createElement(AdsPEAdgroupNameSectionContainer500, null)
        ),
        React.createElement(FlexibleBlock648, null)
      );
    }
  });

  var AdsPEAdgroupEditor650 = React.createClass({
    displayName: "AdsPEAdgroupEditor650",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsPEAdgroupHeaderSectionContainer481, null),
        React.createElement(AdsPEMultiColumnEditor649, null)
      );
    }
  });

  var AdsPEAdgroupEditorContainer651 = React.createClass({
    displayName: "AdsPEAdgroupEditorContainer651",

    render: function () {
      return React.createElement(AdsPEAdgroupEditor650, { key: "98010048849345" });
    }
  });

  var AdsPESideTrayTabContent652 = React.createClass({
    displayName: "AdsPESideTrayTabContent652",

    render: function () {
      return React.createElement(
        "div",
        { className: "_1o_8 _44ra _5cyn" },
        React.createElement(AdsPEAdgroupEditorContainer651, null)
      );
    }
  });

  var AdsPEEditorTrayTabContent653 = React.createClass({
    displayName: "AdsPEEditorTrayTabContent653",

    render: function () {
      return React.createElement(AdsPESideTrayTabContent652, null);
    }
  });

  var AdsPEMultiTabDrawer654 = React.createClass({
    displayName: "AdsPEMultiTabDrawer654",

    render: function () {
      return React.createElement(
        "div",
        { style: { "height": 550, "width": 1027 }, tabButtons: {}, tabContentPanes: {}, enableAnimation: true, showButton: true, className: "_2kev _2kew _2kex" },
        React.createElement(
          "div",
          { className: "_2kf0" },
          React.createElement(AdsPEEditorTrayTabButton469, { key: "editor_tray_button" }),
          React.createElement(AdsPEInsightsTrayTabButton472, { key: "insights_tray_button" }),
          React.createElement(AdsPENekoDebuggerTrayTabButton474, { key: "neko_debugger_tray_button" })
        ),
        React.createElement(
          "div",
          { className: "_2kf1" },
          React.createElement(FBDragHandle475, null),
          React.createElement(AdsPEEditorTrayTabContent653, { key: "EDITOR_DRAWER" }),
          null
        )
      );
    }
  });

  var FluxContainer_x_655 = React.createClass({
    displayName: "FluxContainer_x_655",

    render: function () {
      return React.createElement(AdsPEMultiTabDrawer654, null);
    }
  });

  var AdsBugReportContainer656 = React.createClass({
    displayName: "AdsBugReportContainer656",

    render: function () {
      return null;
    }
  });

  var AdsPEAudienceSplittingDialog657 = React.createClass({
    displayName: "AdsPEAudienceSplittingDialog657",

    render: function () {
      return null;
    }
  });

  var AdsPEAudienceSplittingDialogContainer658 = React.createClass({
    displayName: "AdsPEAudienceSplittingDialogContainer658",

    render: function () {
      return React.createElement(
        "div",
        null,
        React.createElement(AdsPEAudienceSplittingDialog657, null)
      );
    }
  });

  var FluxContainer_p_659 = React.createClass({
    displayName: "FluxContainer_p_659",

    render: function () {
      return null;
    }
  });

  var AdsPECreateDialogContainer660 = React.createClass({
    displayName: "AdsPECreateDialogContainer660",

    render: function () {
      return null;
    }
  });

  var AdsPEContainer661 = React.createClass({
    displayName: "AdsPEContainer661",

    render: function () {
      return React.createElement(
        "div",
        { id: "ads_pe_container" },
        null,
        React.createElement(FluxContainer_ja_26, null),
        React.createElement(FluxContainer_w_56, null),
        React.createElement(FluxContainer_r_463, null),
        React.createElement(FluxContainer_q_464, null),
        React.createElement(FluxContainer_y_466, null),
        null,
        React.createElement(FluxContainer_x_655, null),
        React.createElement(AdsBugReportContainer656, null),
        null,
        React.createElement(AdsPEAudienceSplittingDialogContainer658, null),
        null,
        null,
        null,
        React.createElement(FluxContainer_p_659, null),
        React.createElement(AdsPECreateDialogContainer660, null)
      );
    }
  });

  var Benchmark = React.createClass({
    displayName: "Benchmark",

    render: function () {
      return React.createElement(AdsPEContainer661, null);
    }
  });

  this.Benchmark = Benchmark;
})(this);


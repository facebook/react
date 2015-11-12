// Type definitions for React v0.13.3
// Project: http://facebook.github.io/react/
// Definitions by: Asana <https://asana.com>, AssureSign <http://www.assuresign.com>, Microsoft <https://microsoft.com>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare namespace __React {
    //
    // React Elements
    // ----------------------------------------------------------------------

    type ReactType = ComponentClass<any> | string;

    interface ReactElement<P> {
        type: string | ComponentClass<P>;
        props: P;
        key: string | number;
        ref: string | ((component: Component<P, any>) => any);
    }

    interface ClassicElement<P> extends ReactElement<P> {
        type: string | ClassicComponentClass<P>;
        ref: string | ((component: ClassicComponent<P, any>) => any);
    }

    interface DOMElement<P> extends ClassicElement<P> {
        type: string;
        ref: string | ((component: DOMComponent<P>) => any);
    }

    type HTMLElement = DOMElement<HTMLAttributes>;
    type SVGElement = DOMElement<SVGAttributes>;

    //
    // Factories
    // ----------------------------------------------------------------------

    interface Factory<P> {
        (props?: P, ...children: ReactNode[]): ReactElement<P>;
    }

    interface ClassicFactory<P> extends Factory<P> {
        (props?: P, ...children: ReactNode[]): ClassicElement<P>;
    }

    interface DOMFactory<P> extends ClassicFactory<P> {
        (props?: P, ...children: ReactNode[]): DOMElement<P>;
    }

    type HTMLFactory = DOMFactory<HTMLAttributes>;
    type SVGFactory = DOMFactory<SVGAttributes>;
    type SVGElementFactory = DOMFactory<SVGElementAttributes>;

    //
    // React Nodes
    // http://facebook.github.io/react/docs/glossary.html
    // ----------------------------------------------------------------------

    type ReactText = string | number;
    type ReactChild = ReactElement<any> | ReactText;

    // Should be Array<ReactNode> but type aliases cannot be recursive
    type ReactFragment = {} | Array<ReactChild | any[] | boolean>;
    type ReactNode = ReactChild | ReactFragment | boolean;

    //
    // Top Level API
    // ----------------------------------------------------------------------

    function createClass<P, S>(spec: ComponentSpec<P, S>): ClassicComponentClass<P>;

    function createFactory<P>(type: string): DOMFactory<P>;
    function createFactory<P>(type: ClassicComponentClass<P> | string): ClassicFactory<P>;
    function createFactory<P>(type: ComponentClass<P>): Factory<P>;

    function createElement<P>(
        type: string,
        props?: P,
        ...children: ReactNode[]): DOMElement<P>;
    function createElement<P>(
        type: ClassicComponentClass<P> | string,
        props?: P,
        ...children: ReactNode[]): ClassicElement<P>;
    function createElement<P>(
        type: ComponentClass<P>,
        props?: P,
        ...children: ReactNode[]): ReactElement<P>;

    function cloneElement<P>(
        element: DOMElement<P>,
        props?: P,
        ...children: ReactNode[]): DOMElement<P>;
    function cloneElement<P>(
        element: ClassicElement<P>,
        props?: P,
        ...children: ReactNode[]): ClassicElement<P>;
    function cloneElement<P>(
        element: ReactElement<P>,
        props?: P,
        ...children: ReactNode[]): ReactElement<P>;

    function render<P>(
        element: DOMElement<P>,
        container: Element,
        callback?: () => any): DOMComponent<P>;
    function render<P, S>(
        element: ClassicElement<P>,
        container: Element,
        callback?: () => any): ClassicComponent<P, S>;
    function render<P, S>(
        element: ReactElement<P>,
        container: Element,
        callback?: () => any): Component<P, S>;

    function unmountComponentAtNode(container: Element): boolean;
    function renderToString(element: ReactElement<any>): string;
    function renderToStaticMarkup(element: ReactElement<any>): string;
    function isValidElement(object: {}): boolean;
    function initializeTouchEvents(shouldUseTouch: boolean): void;

    function findDOMNode<TElement extends Element>(
        componentOrElement: Component<any, any> | Element): TElement;
    function findDOMNode(
        componentOrElement: Component<any, any> | Element): Element;

    var DOM: ReactDOM;
    var PropTypes: ReactPropTypes;
    var Children: ReactChildren;

    //
    // Component API
    // ----------------------------------------------------------------------

    // Base component for plain JS classes
    class Component<P, S> implements ComponentLifecycle<P, S> {
        constructor(props?: P, context?: any);
        setState(f: (prevState: S, props: P) => S, callback?: () => any): void;
        setState(state: S, callback?: () => any): void;
        forceUpdate(callBack?: () => any): void;
        render(): JSX.Element;
        props: P;
        state: S;
        context: {};
        refs: {
            [key: string]: Component<any, any>
        };
    }

    interface ClassicComponent<P, S> extends Component<P, S> {
        replaceState(nextState: S, callback?: () => any): void;
        getDOMNode<TElement extends Element>(): TElement;
        getDOMNode(): Element;
        isMounted(): boolean;
        getInitialState?(): S;
        setProps(nextProps: P, callback?: () => any): void;
        replaceProps(nextProps: P, callback?: () => any): void;
    }

    interface DOMComponent<P> extends ClassicComponent<P, any> {
        tagName: string;
    }

    type HTMLComponent = DOMComponent<HTMLAttributes>;
    type SVGComponent = DOMComponent<SVGAttributes>;

    interface ChildContextProvider<CC> {
        getChildContext(): CC;
    }

    //
    // Class Interfaces
    // ----------------------------------------------------------------------

    interface ComponentClass<P> {
        new(props?: P, context?: any): Component<P, any>;
        propTypes?: ValidationMap<P>;
        contextTypes?: ValidationMap<any>;
        childContextTypes?: ValidationMap<any>;
        defaultProps?: P;
    }

    interface ClassicComponentClass<P> extends ComponentClass<P> {
        new(props?: P, context?: any): ClassicComponent<P, any>;
        getDefaultProps?(): P;
        displayName?: string;
    }

    //
    // Component Specs and Lifecycle
    // ----------------------------------------------------------------------

    interface ComponentLifecycle<P, S> {
        componentWillMount?(): void;
        componentDidMount?(): void;
        componentWillReceiveProps?(nextProps: P, nextContext: any): void;
        shouldComponentUpdate?(nextProps: P, nextState: S, nextContext: any): boolean;
        componentWillUpdate?(nextProps: P, nextState: S, nextContext: any): void;
        componentDidUpdate?(prevProps: P, prevState: S, prevContext: any): void;
        componentWillUnmount?(): void;
    }

    interface Mixin<P, S> extends ComponentLifecycle<P, S> {
        mixins?: Mixin<P, S>;
        statics?: {
            [key: string]: any;
        };

        displayName?: string;
        propTypes?: ValidationMap<any>;
        contextTypes?: ValidationMap<any>;
        childContextTypes?: ValidationMap<any>

        getDefaultProps?(): P;
        getInitialState?(): S;
    }

    interface ComponentSpec<P, S> extends Mixin<P, S> {
        render(): ReactElement<any>;

        [propertyName: string]: any;
    }

    //
    // Event System
    // ----------------------------------------------------------------------

    interface SyntheticEvent {
        bubbles: boolean;
        cancelable: boolean;
        currentTarget: EventTarget;
        defaultPrevented: boolean;
        eventPhase: number;
        isTrusted: boolean;
        nativeEvent: Event;
        preventDefault(): void;
        stopPropagation(): void;
        target: EventTarget;
        timeStamp: Date;
        type: string;
    }

    interface DragEvent extends SyntheticEvent {
        dataTransfer: DataTransfer;
    }

    interface ClipboardEvent extends SyntheticEvent {
        clipboardData: DataTransfer;
    }

    interface KeyboardEvent extends SyntheticEvent {
        altKey: boolean;
        charCode: number;
        ctrlKey: boolean;
        getModifierState(key: string): boolean;
        key: string;
        keyCode: number;
        locale: string;
        location: number;
        metaKey: boolean;
        repeat: boolean;
        shiftKey: boolean;
        which: number;
    }

    interface FocusEvent extends SyntheticEvent {
        relatedTarget: EventTarget;
    }

    interface FormEvent extends SyntheticEvent {
    }

    interface MouseEvent extends SyntheticEvent {
        altKey: boolean;
        button: number;
        buttons: number;
        clientX: number;
        clientY: number;
        ctrlKey: boolean;
        getModifierState(key: string): boolean;
        metaKey: boolean;
        pageX: number;
        pageY: number;
        relatedTarget: EventTarget;
        screenX: number;
        screenY: number;
        shiftKey: boolean;
    }

    interface TouchEvent extends SyntheticEvent {
        altKey: boolean;
        changedTouches: TouchList;
        ctrlKey: boolean;
        getModifierState(key: string): boolean;
        metaKey: boolean;
        shiftKey: boolean;
        targetTouches: TouchList;
        touches: TouchList;
    }

    interface UIEvent extends SyntheticEvent {
        detail: number;
        view: AbstractView;
    }

    interface WheelEvent extends SyntheticEvent {
        deltaMode: number;
        deltaX: number;
        deltaY: number;
        deltaZ: number;
    }

    //
    // Event Handler Types
    // ----------------------------------------------------------------------

    interface EventHandler<E extends SyntheticEvent> {
        (event: E): void;
    }

    interface DragEventHandler extends EventHandler<DragEvent> {}
    interface ClipboardEventHandler extends EventHandler<ClipboardEvent> {}
    interface KeyboardEventHandler extends EventHandler<KeyboardEvent> {}
    interface FocusEventHandler extends EventHandler<FocusEvent> {}
    interface FormEventHandler extends EventHandler<FormEvent> {}
    interface MouseEventHandler extends EventHandler<MouseEvent> {}
    interface TouchEventHandler extends EventHandler<TouchEvent> {}
    interface UIEventHandler extends EventHandler<UIEvent> {}
    interface WheelEventHandler extends EventHandler<WheelEvent> {}

    //
    // Props / DOM Attributes
    // ----------------------------------------------------------------------

    interface Props<T> {
        children?: ReactNode;
        key?: string | number;
        ref?: string | ((component: T) => any);
    }

    interface DOMAttributesBase<T> extends Props<T> {
        onCopy?: ClipboardEventHandler;
        onCut?: ClipboardEventHandler;
        onPaste?: ClipboardEventHandler;
        onKeyDown?: KeyboardEventHandler;
        onKeyPress?: KeyboardEventHandler;
        onKeyUp?: KeyboardEventHandler;
        onFocus?: FocusEventHandler;
        onBlur?: FocusEventHandler;
        onChange?: FormEventHandler;
        onInput?: FormEventHandler;
        onSubmit?: FormEventHandler;
        onClick?: MouseEventHandler;
        onDoubleClick?: MouseEventHandler;
        onDrag?: DragEventHandler;
        onDragEnd?: DragEventHandler;
        onDragEnter?: DragEventHandler;
        onDragExit?: DragEventHandler;
        onDragLeave?: DragEventHandler;
        onDragOver?: DragEventHandler;
        onDragStart?: DragEventHandler;
        onDrop?: DragEventHandler;
        onMouseDown?: MouseEventHandler;
        onMouseEnter?: MouseEventHandler;
        onMouseLeave?: MouseEventHandler;
        onMouseMove?: MouseEventHandler;
        onMouseOut?: MouseEventHandler;
        onMouseOver?: MouseEventHandler;
        onMouseUp?: MouseEventHandler;
        onTouchCancel?: TouchEventHandler;
        onTouchEnd?: TouchEventHandler;
        onTouchMove?: TouchEventHandler;
        onTouchStart?: TouchEventHandler;
        onScroll?: UIEventHandler;
        onWheel?: WheelEventHandler;
        
        className?: string;
        id?: string;

        dangerouslySetInnerHTML?: {
            __html: string;
        };
    }

    interface DOMAttributes extends DOMAttributesBase<DOMComponent<any>> {
    }

    // This interface is not complete. Only properties accepting
    // unitless numbers are listed here (see CSSProperty.js in React)
    interface CSSProperties {
        boxFlex?: number;
        boxFlexGroup?: number;
        columnCount?: number;
        flex?: number | string;
        flexGrow?: number;
        flexShrink?: number;
        fontWeight?: number | string;
        lineClamp?: number;
        lineHeight?: number | string;
        opacity?: number;
        order?: number;
        orphans?: number;
        widows?: number;
        zIndex?: number;
        zoom?: number;

        fontSize?: number | string;

        // SVG-related properties
        fillOpacity?: number;
        strokeOpacity?: number;
        strokeWidth?: number;

        [propertyName: string]: any;
    }

    interface HTMLAttributesBase<T> extends DOMAttributesBase<T> {
        accept?: string;
        acceptCharset?: string;
        accessKey?: string;
        action?: string;
        allowFullScreen?: boolean;
        allowTransparency?: boolean;
        alt?: string;
        async?: boolean;
        autoComplete?: boolean;
        autoFocus?: boolean;
        autoPlay?: boolean;
        cellPadding?: number | string;
        cellSpacing?: number | string;
        charSet?: string;
        checked?: boolean;
        classID?: string;
        cols?: number;
        colSpan?: number;
        content?: string;
        contentEditable?: boolean;
        contextMenu?: string;
        controls?: any;
        coords?: string;
        crossOrigin?: string;
        data?: string;
        dateTime?: string;
        defaultChecked?: boolean;
        defaultValue?: string;
        defer?: boolean;
        dir?: string;
        disabled?: boolean;
        download?: any;
        draggable?: boolean;
        encType?: string;
        form?: string;
        formAction?: string;
        formEncType?: string;
        formMethod?: string;
        formNoValidate?: boolean;
        formTarget?: string;
        frameBorder?: number | string;
        headers?: string;
        height?: number | string;
        hidden?: boolean;
        high?: number;
        href?: string;
        hrefLang?: string;
        htmlFor?: string;
        httpEquiv?: string;
        icon?: string;
        label?: string;
        lang?: string;
        list?: string;
        loop?: boolean;
        low?: number;
        manifest?: string;
        marginHeight?: number;
        marginWidth?: number;
        max?: number | string;
        maxLength?: number;
        media?: string;
        mediaGroup?: string;
        method?: string;
        min?: number | string;
        multiple?: boolean;
        muted?: boolean;
        name?: string;
        noValidate?: boolean;
        open?: boolean;
        optimum?: number;
        pattern?: string;
        placeholder?: string;
        poster?: string;
        preload?: string;
        radioGroup?: string;
        readOnly?: boolean;
        rel?: string;
        required?: boolean;
        role?: string;
        rows?: number;
        rowSpan?: number;
        sandbox?: string;
        scope?: string;
        scoped?: boolean;
        scrolling?: string;
        seamless?: boolean;
        selected?: boolean;
        shape?: string;
        size?: number;
        sizes?: string;
        span?: number;
        spellCheck?: boolean;
        src?: string;
        srcDoc?: string;
        srcSet?: string;
        start?: number;
        step?: number | string;
        style?: CSSProperties;
        tabIndex?: number;
        target?: string;
        title?: string;
        type?: string;
        useMap?: string;
        value?: string;
        width?: number | string;
        wmode?: string;

        // Non-standard Attributes
        autoCapitalize?: boolean;
        autoCorrect?: boolean;
        property?: string;
        itemProp?: string;
        itemScope?: boolean;
        itemType?: string;
        unselectable?: boolean;
    }

    interface HTMLAttributes extends HTMLAttributesBase<HTMLComponent> {
    }

    interface SVGElementAttributes extends HTMLAttributes {
        viewBox?: string;
        preserveAspectRatio?: string;
    }

    interface SVGAttributes extends DOMAttributes {
        ref?: string | ((component: SVGComponent) => void);

        cx?: number | string;
        cy?: number | string;
        d?: string;
        dx?: number | string;
        dy?: number | string;
        fill?: string;
        fillOpacity?: number | string;
        fontFamily?: string;
        fontSize?: number | string;
        fx?: number | string;
        fy?: number | string;
        gradientTransform?: string;
        gradientUnits?: string;
        height?: number | string;
        markerEnd?: string;
        markerMid?: string;
        markerStart?: string;
        offset?: number | string;
        opacity?: number | string;
        patternContentUnits?: string;
        patternUnits?: string;
        points?: string;
        preserveAspectRatio?: string;
        r?: number | string;
        rx?: number | string;
        ry?: number | string;
        spreadMethod?: string;
        stopColor?: string;
        stopOpacity?: number | string;
        stroke?: string;
        strokeDasharray?: string;
        strokeLinecap?: string;
        strokeMiterlimit?: string;
        strokeOpacity?: number | string;
        strokeWidth?: number | string;
        textAnchor?: string;
        transform?: string;
        version?: string;
        viewBox?: string;
        width?: number | string;
        x1?: number | string;
        x2?: number | string;
        x?: number | string;
        y1?: number | string;
        y2?: number | string
        y?: number | string;
    }

    //
    // React.DOM
    // ----------------------------------------------------------------------

    interface ReactDOM {
        // HTML
        a: HTMLFactory;
        abbr: HTMLFactory;
        address: HTMLFactory;
        area: HTMLFactory;
        article: HTMLFactory;
        aside: HTMLFactory;
        audio: HTMLFactory;
        b: HTMLFactory;
        base: HTMLFactory;
        bdi: HTMLFactory;
        bdo: HTMLFactory;
        big: HTMLFactory;
        blockquote: HTMLFactory;
        body: HTMLFactory;
        br: HTMLFactory;
        button: HTMLFactory;
        canvas: HTMLFactory;
        caption: HTMLFactory;
        cite: HTMLFactory;
        code: HTMLFactory;
        col: HTMLFactory;
        colgroup: HTMLFactory;
        data: HTMLFactory;
        datalist: HTMLFactory;
        dd: HTMLFactory;
        del: HTMLFactory;
        details: HTMLFactory;
        dfn: HTMLFactory;
        dialog: HTMLFactory;
        div: HTMLFactory;
        dl: HTMLFactory;
        dt: HTMLFactory;
        em: HTMLFactory;
        embed: HTMLFactory;
        fieldset: HTMLFactory;
        figcaption: HTMLFactory;
        figure: HTMLFactory;
        footer: HTMLFactory;
        form: HTMLFactory;
        h1: HTMLFactory;
        h2: HTMLFactory;
        h3: HTMLFactory;
        h4: HTMLFactory;
        h5: HTMLFactory;
        h6: HTMLFactory;
        head: HTMLFactory;
        header: HTMLFactory;
        hr: HTMLFactory;
        html: HTMLFactory;
        i: HTMLFactory;
        iframe: HTMLFactory;
        img: HTMLFactory;
        input: HTMLFactory;
        ins: HTMLFactory;
        kbd: HTMLFactory;
        keygen: HTMLFactory;
        label: HTMLFactory;
        legend: HTMLFactory;
        li: HTMLFactory;
        link: HTMLFactory;
        main: HTMLFactory;
        map: HTMLFactory;
        mark: HTMLFactory;
        menu: HTMLFactory;
        menuitem: HTMLFactory;
        meta: HTMLFactory;
        meter: HTMLFactory;
        nav: HTMLFactory;
        noscript: HTMLFactory;
        object: HTMLFactory;
        ol: HTMLFactory;
        optgroup: HTMLFactory;
        option: HTMLFactory;
        output: HTMLFactory;
        p: HTMLFactory;
        param: HTMLFactory;
        picture: HTMLFactory;
        pre: HTMLFactory;
        progress: HTMLFactory;
        q: HTMLFactory;
        rp: HTMLFactory;
        rt: HTMLFactory;
        ruby: HTMLFactory;
        s: HTMLFactory;
        samp: HTMLFactory;
        script: HTMLFactory;
        section: HTMLFactory;
        select: HTMLFactory;
        small: HTMLFactory;
        source: HTMLFactory;
        span: HTMLFactory;
        strong: HTMLFactory;
        style: HTMLFactory;
        sub: HTMLFactory;
        summary: HTMLFactory;
        sup: HTMLFactory;
        table: HTMLFactory;
        tbody: HTMLFactory;
        td: HTMLFactory;
        textarea: HTMLFactory;
        tfoot: HTMLFactory;
        th: HTMLFactory;
        thead: HTMLFactory;
        time: HTMLFactory;
        title: HTMLFactory;
        tr: HTMLFactory;
        track: HTMLFactory;
        u: HTMLFactory;
        ul: HTMLFactory;
        "var": HTMLFactory;
        video: HTMLFactory;
        wbr: HTMLFactory;

        // SVG
        svg: SVGElementFactory;
        circle: SVGFactory;
        defs: SVGFactory;
        ellipse: SVGFactory;
        g: SVGFactory;
        line: SVGFactory;
        linearGradient: SVGFactory;
        mask: SVGFactory;
        path: SVGFactory;
        pattern: SVGFactory;
        polygon: SVGFactory;
        polyline: SVGFactory;
        radialGradient: SVGFactory;
        rect: SVGFactory;
        stop: SVGFactory;
        text: SVGFactory;
        tspan: SVGFactory;
    }

    //
    // React.PropTypes
    // ----------------------------------------------------------------------

    interface Validator<T> {
        (object: T, key: string, componentName: string): Error;
    }

    interface Requireable<T> extends Validator<T> {
        isRequired: Validator<T>;
    }

    interface ValidationMap<T> {
        [key: string]: Validator<T>;
    }

    interface ReactPropTypes {
        any: Requireable<any>;
        array: Requireable<any>;
        bool: Requireable<any>;
        func: Requireable<any>;
        number: Requireable<any>;
        object: Requireable<any>;
        string: Requireable<any>;
        node: Requireable<any>;
        element: Requireable<any>;
        instanceOf(expectedClass: {}): Requireable<any>;
        oneOf(types: any[]): Requireable<any>;
        oneOfType(types: Validator<any>[]): Requireable<any>;
        arrayOf(type: Validator<any>): Requireable<any>;
        objectOf(type: Validator<any>): Requireable<any>;
        shape(type: ValidationMap<any>): Requireable<any>;
    }

    //
    // React.Children
    // ----------------------------------------------------------------------

    interface ReactChildren {
        map<T>(children: ReactNode, fn: (child: ReactChild, index: number) => T): { [key:string]: T };
        forEach(children: ReactNode, fn: (child: ReactChild, index: number) => any): void;
        count(children: ReactNode): number;
        only(children: ReactNode): ReactChild;
    }

    //
    // Browser Interfaces
    // https://github.com/nikeee/2048-typescript/blob/master/2048/js/touch.d.ts
    // ----------------------------------------------------------------------

    interface AbstractView {
        styleMedia: StyleMedia;
        document: Document;
    }

    interface Touch {
        identifier: number;
        target: EventTarget;
        screenX: number;
        screenY: number;
        clientX: number;
        clientY: number;
        pageX: number;
        pageY: number;
    }

    interface TouchList {
        [index: number]: Touch;
        length: number;
        item(index: number): Touch;
        identifiedTouch(identifier: number): Touch;
    }
}

declare module "react" {
    export = __React;
}

declare module "react/addons" {
    //
    // React Elements
    // ----------------------------------------------------------------------

    type ReactType = ComponentClass<any> | string;

    interface ReactElement<P> {
        type: string | ComponentClass<P>;
        props: P;
        key: string | number;
        ref: string | ((component: Component<P, any>) => any);
    }

    interface ClassicElement<P> extends ReactElement<P> {
        type: string | ClassicComponentClass<P>;
        ref: string | ((component: ClassicComponent<P, any>) => any);
    }

    interface DOMElement<P> extends ClassicElement<P> {
        type: string;
        ref: string | ((component: DOMComponent<P>) => any);
    }

    type HTMLElement = DOMElement<HTMLAttributes>;
    type SVGElement = DOMElement<SVGAttributes>;

    //
    // Factories
    // ----------------------------------------------------------------------

    interface Factory<P> {
        (props?: P, ...children: ReactNode[]): ReactElement<P>;
    }

    interface ClassicFactory<P> extends Factory<P> {
        (props?: P, ...children: ReactNode[]): ClassicElement<P>;
    }

    interface DOMFactory<P> extends ClassicFactory<P> {
        (props?: P, ...children: ReactNode[]): DOMElement<P>;
    }

    type HTMLFactory = DOMFactory<HTMLAttributes>;
    type SVGFactory = DOMFactory<SVGAttributes>;
    type SVGElementFactory = DOMFactory<SVGElementAttributes>;

    //
    // React Nodes
    // http://facebook.github.io/react/docs/glossary.html
    // ----------------------------------------------------------------------

    type ReactText = string | number;
    type ReactChild = ReactElement<any> | ReactText;

    // Should be Array<ReactNode> but type aliases cannot be recursive
    type ReactFragment = {} | Array<ReactChild | any[] | boolean>;
    type ReactNode = ReactChild | ReactFragment | boolean;

    //
    // Top Level API
    // ----------------------------------------------------------------------

    function createClass<P, S>(spec: ComponentSpec<P, S>): ClassicComponentClass<P>;

    function createFactory<P>(type: string): DOMFactory<P>;
    function createFactory<P>(type: ClassicComponentClass<P> | string): ClassicFactory<P>;
    function createFactory<P>(type: ComponentClass<P>): Factory<P>;

    function createElement<P>(
        type: string,
        props?: P,
        ...children: ReactNode[]): DOMElement<P>;
    function createElement<P>(
        type: ClassicComponentClass<P> | string,
        props?: P,
        ...children: ReactNode[]): ClassicElement<P>;
    function createElement<P>(
        type: ComponentClass<P>,
        props?: P,
        ...children: ReactNode[]): ReactElement<P>;

    function cloneElement<P>(
        element: DOMElement<P>,
        props?: P,
        ...children: ReactNode[]): DOMElement<P>;
    function cloneElement<P>(
        element: ClassicElement<P>,
        props?: P,
        ...children: ReactNode[]): ClassicElement<P>;
    function cloneElement<P>(
        element: ReactElement<P>,
        props?: P,
        ...children: ReactNode[]): ReactElement<P>;

    function render<P>(
        element: DOMElement<P>,
        container: Element,
        callback?: () => any): DOMComponent<P>;
    function render<P, S>(
        element: ClassicElement<P>,
        container: Element,
        callback?: () => any): ClassicComponent<P, S>;
    function render<P, S>(
        element: ReactElement<P>,
        container: Element,
        callback?: () => any): Component<P, S>;

    function unmountComponentAtNode(container: Element): boolean;
    function renderToString(element: ReactElement<any>): string;
    function renderToStaticMarkup(element: ReactElement<any>): string;
    function isValidElement(object: {}): boolean;
    function initializeTouchEvents(shouldUseTouch: boolean): void;

    function findDOMNode<TElement extends Element>(
        componentOrElement: Component<any, any> | Element): TElement;
    function findDOMNode(
        componentOrElement: Component<any, any> | Element): Element;

    var DOM: ReactDOM;
    var PropTypes: ReactPropTypes;
    var Children: ReactChildren;

    //
    // Component API
    // ----------------------------------------------------------------------

    // Base component for plain JS classes
    class Component<P, S> implements ComponentLifecycle<P, S> {
        constructor(props?: P, context?: any);
        setState(f: (prevState: S, props: P) => S, callback?: () => any): void;
        setState(state: S, callback?: () => any): void;
        forceUpdate(callBack?: () => any): void;
        render(): JSX.Element;
        props: P;
        state: S;
        context: {};
        refs: {
            [key: string]: Component<any, any>
        };
    }

    interface ClassicComponent<P, S> extends Component<P, S> {
        replaceState(nextState: S, callback?: () => any): void;
        getDOMNode<TElement extends Element>(): TElement;
        getDOMNode(): Element;
        isMounted(): boolean;
        getInitialState?(): S;
        setProps(nextProps: P, callback?: () => any): void;
        replaceProps(nextProps: P, callback?: () => any): void;
    }

    interface DOMComponent<P> extends ClassicComponent<P, any> {
        tagName: string;
    }

    type HTMLComponent = DOMComponent<HTMLAttributes>;
    type SVGComponent = DOMComponent<SVGAttributes>;

    interface ChildContextProvider<CC> {
        getChildContext(): CC;
    }

    //
    // Class Interfaces
    // ----------------------------------------------------------------------

    interface ComponentClass<P> {
        new(props?: P, context?: any): Component<P, any>;
        propTypes?: ValidationMap<P>;
        contextTypes?: ValidationMap<any>;
        childContextTypes?: ValidationMap<any>;
        defaultProps?: P;
    }

    interface ClassicComponentClass<P> extends ComponentClass<P> {
        new(props?: P, context?: any): ClassicComponent<P, any>;
        getDefaultProps?(): P;
        displayName?: string;
    }

    //
    // Component Specs and Lifecycle
    // ----------------------------------------------------------------------

    interface ComponentLifecycle<P, S> {
        componentWillMount?(): void;
        componentDidMount?(): void;
        componentWillReceiveProps?(nextProps: P, nextContext: any): void;
        shouldComponentUpdate?(nextProps: P, nextState: S, nextContext: any): boolean;
        componentWillUpdate?(nextProps: P, nextState: S, nextContext: any): void;
        componentDidUpdate?(prevProps: P, prevState: S, prevContext: any): void;
        componentWillUnmount?(): void;
    }

    interface Mixin<P, S> extends ComponentLifecycle<P, S> {
        mixins?: Mixin<P, S>;
        statics?: {
            [key: string]: any;
        };

        displayName?: string;
        propTypes?: ValidationMap<any>;
        contextTypes?: ValidationMap<any>;
        childContextTypes?: ValidationMap<any>

        getDefaultProps?(): P;
        getInitialState?(): S;
    }

    interface ComponentSpec<P, S> extends Mixin<P, S> {
        render(): ReactElement<any>;

        [propertyName: string]: any;
    }

    //
    // Event System
    // ----------------------------------------------------------------------

    interface SyntheticEvent {
        bubbles: boolean;
        cancelable: boolean;
        currentTarget: EventTarget;
        defaultPrevented: boolean;
        eventPhase: number;
        isTrusted: boolean;
        nativeEvent: Event;
        preventDefault(): void;
        stopPropagation(): void;
        target: EventTarget;
        timeStamp: Date;
        type: string;
    }

    interface DragEvent extends SyntheticEvent {
        dataTransfer: DataTransfer;
    }

    interface ClipboardEvent extends SyntheticEvent {
        clipboardData: DataTransfer;
    }

    interface KeyboardEvent extends SyntheticEvent {
        altKey: boolean;
        charCode: number;
        ctrlKey: boolean;
        getModifierState(key: string): boolean;
        key: string;
        keyCode: number;
        locale: string;
        location: number;
        metaKey: boolean;
        repeat: boolean;
        shiftKey: boolean;
        which: number;
    }

    interface FocusEvent extends SyntheticEvent {
        relatedTarget: EventTarget;
    }

    interface FormEvent extends SyntheticEvent {
    }

    interface MouseEvent extends SyntheticEvent {
        altKey: boolean;
        button: number;
        buttons: number;
        clientX: number;
        clientY: number;
        ctrlKey: boolean;
        getModifierState(key: string): boolean;
        metaKey: boolean;
        pageX: number;
        pageY: number;
        relatedTarget: EventTarget;
        screenX: number;
        screenY: number;
        shiftKey: boolean;
    }

    interface TouchEvent extends SyntheticEvent {
        altKey: boolean;
        changedTouches: TouchList;
        ctrlKey: boolean;
        getModifierState(key: string): boolean;
        metaKey: boolean;
        shiftKey: boolean;
        targetTouches: TouchList;
        touches: TouchList;
    }

    interface UIEvent extends SyntheticEvent {
        detail: number;
        view: AbstractView;
    }

    interface WheelEvent extends SyntheticEvent {
        deltaMode: number;
        deltaX: number;
        deltaY: number;
        deltaZ: number;
    }

    //
    // Event Handler Types
    // ----------------------------------------------------------------------

    interface EventHandler<E extends SyntheticEvent> {
        (event: E): void;
    }

    interface DragEventHandler extends EventHandler<DragEvent> {}
    interface ClipboardEventHandler extends EventHandler<ClipboardEvent> {}
    interface KeyboardEventHandler extends EventHandler<KeyboardEvent> {}
    interface FocusEventHandler extends EventHandler<FocusEvent> {}
    interface FormEventHandler extends EventHandler<FormEvent> {}
    interface MouseEventHandler extends EventHandler<MouseEvent> {}
    interface TouchEventHandler extends EventHandler<TouchEvent> {}
    interface UIEventHandler extends EventHandler<UIEvent> {}
    interface WheelEventHandler extends EventHandler<WheelEvent> {}

    //
    // Props / DOM Attributes
    // ----------------------------------------------------------------------

    interface Props<T> {
        children?: ReactNode;
        key?: string | number;
        ref?: string | ((component: T) => any);
    }

    interface DOMAttributesBase<T> extends Props<T> {
        onCopy?: ClipboardEventHandler;
        onCut?: ClipboardEventHandler;
        onPaste?: ClipboardEventHandler;
        onKeyDown?: KeyboardEventHandler;
        onKeyPress?: KeyboardEventHandler;
        onKeyUp?: KeyboardEventHandler;
        onFocus?: FocusEventHandler;
        onBlur?: FocusEventHandler;
        onChange?: FormEventHandler;
        onInput?: FormEventHandler;
        onSubmit?: FormEventHandler;
        onClick?: MouseEventHandler;
        onDoubleClick?: MouseEventHandler;
        onDrag?: DragEventHandler;
        onDragEnd?: DragEventHandler;
        onDragEnter?: DragEventHandler;
        onDragExit?: DragEventHandler;
        onDragLeave?: DragEventHandler;
        onDragOver?: DragEventHandler;
        onDragStart?: DragEventHandler;
        onDrop?: DragEventHandler;
        onMouseDown?: MouseEventHandler;
        onMouseEnter?: MouseEventHandler;
        onMouseLeave?: MouseEventHandler;
        onMouseMove?: MouseEventHandler;
        onMouseOut?: MouseEventHandler;
        onMouseOver?: MouseEventHandler;
        onMouseUp?: MouseEventHandler;
        onTouchCancel?: TouchEventHandler;
        onTouchEnd?: TouchEventHandler;
        onTouchMove?: TouchEventHandler;
        onTouchStart?: TouchEventHandler;
        onScroll?: UIEventHandler;
        onWheel?: WheelEventHandler;

        className?: string;
        id?: string;

        dangerouslySetInnerHTML?: {
            __html: string;
        };
    }

    interface DOMAttributes extends DOMAttributesBase<DOMComponent<any>> {
    }

    // This interface is not complete. Only properties accepting
    // unitless numbers are listed here (see CSSProperty.js in React)
    interface CSSProperties {
        boxFlex?: number;
        boxFlexGroup?: number;
        columnCount?: number;
        flex?: number | string;
        flexGrow?: number;
        flexShrink?: number;
        fontWeight?: number | string;
        lineClamp?: number;
        lineHeight?: number | string;
        opacity?: number;
        order?: number;
        orphans?: number;
        widows?: number;
        zIndex?: number;
        zoom?: number;

        fontSize?: number | string;

        // SVG-related properties
        fillOpacity?: number;
        strokeOpacity?: number;
        strokeWidth?: number;

        [propertyName: string]: any;
    }

    interface HTMLAttributesBase<T> extends DOMAttributesBase<T> {
        accept?: string;
        acceptCharset?: string;
        accessKey?: string;
        action?: string;
        allowFullScreen?: boolean;
        allowTransparency?: boolean;
        alt?: string;
        async?: boolean;
        autoComplete?: boolean;
        autoFocus?: boolean;
        autoPlay?: boolean;
        cellPadding?: number | string;
        cellSpacing?: number | string;
        charSet?: string;
        checked?: boolean;
        classID?: string;
        cols?: number;
        colSpan?: number;
        content?: string;
        contentEditable?: boolean;
        contextMenu?: string;
        controls?: any;
        coords?: string;
        crossOrigin?: string;
        data?: string;
        dateTime?: string;
        defaultChecked?: boolean;
        defaultValue?: string;
        defer?: boolean;
        dir?: string;
        disabled?: boolean;
        download?: any;
        draggable?: boolean;
        encType?: string;
        form?: string;
        formAction?: string;
        formEncType?: string;
        formMethod?: string;
        formNoValidate?: boolean;
        formTarget?: string;
        frameBorder?: number | string;
        headers?: string;
        height?: number | string;
        hidden?: boolean;
        high?: number;
        href?: string;
        hrefLang?: string;
        htmlFor?: string;
        httpEquiv?: string;
        icon?: string;
        label?: string;
        lang?: string;
        list?: string;
        loop?: boolean;
        low?: number;
        manifest?: string;
        marginHeight?: number;
        marginWidth?: number;
        max?: number | string;
        maxLength?: number;
        media?: string;
        mediaGroup?: string;
        method?: string;
        min?: number | string;
        multiple?: boolean;
        muted?: boolean;
        name?: string;
        noValidate?: boolean;
        open?: boolean;
        optimum?: number;
        pattern?: string;
        placeholder?: string;
        poster?: string;
        preload?: string;
        radioGroup?: string;
        readOnly?: boolean;
        rel?: string;
        required?: boolean;
        role?: string;
        rows?: number;
        rowSpan?: number;
        sandbox?: string;
        scope?: string;
        scoped?: boolean;
        scrolling?: string;
        seamless?: boolean;
        selected?: boolean;
        shape?: string;
        size?: number;
        sizes?: string;
        span?: number;
        spellCheck?: boolean;
        src?: string;
        srcDoc?: string;
        srcSet?: string;
        start?: number;
        step?: number | string;
        style?: CSSProperties;
        tabIndex?: number;
        target?: string;
        title?: string;
        type?: string;
        useMap?: string;
        value?: string;
        width?: number | string;
        wmode?: string;

        // Non-standard Attributes
        autoCapitalize?: boolean;
        autoCorrect?: boolean;
        property?: string;
        itemProp?: string;
        itemScope?: boolean;
        itemType?: string;
        unselectable?: boolean;
    }

    interface HTMLAttributes extends HTMLAttributesBase<HTMLComponent> {
    }

    interface SVGElementAttributes extends HTMLAttributes {
        viewBox?: string;
        preserveAspectRatio?: string;
    }

    interface SVGAttributes extends DOMAttributes {
        ref?: string | ((component: SVGComponent) => void);

        cx?: number | string;
        cy?: number | string;
        d?: string;
        dx?: number | string;
        dy?: number | string;
        fill?: string;
        fillOpacity?: number | string;
        fontFamily?: string;
        fontSize?: number | string;
        fx?: number | string;
        fy?: number | string;
        gradientTransform?: string;
        gradientUnits?: string;
        height?: number | string;
        markerEnd?: string;
        markerMid?: string;
        markerStart?: string;
        offset?: number | string;
        opacity?: number | string;
        patternContentUnits?: string;
        patternUnits?: string;
        points?: string;
        preserveAspectRatio?: string;
        r?: number | string;
        rx?: number | string;
        ry?: number | string;
        spreadMethod?: string;
        stopColor?: string;
        stopOpacity?: number | string;
        stroke?: string;
        strokeDasharray?: string;
        strokeLinecap?: string;
        strokeMiterlimit?: string;
        strokeOpacity?: number | string;
        strokeWidth?: number | string;
        textAnchor?: string;
        transform?: string;
        version?: string;
        viewBox?: string;
        width?: number | string;
        x1?: number | string;
        x2?: number | string;
        x?: number | string;
        y1?: number | string;
        y2?: number | string
        y?: number | string;
    }

    //
    // React.DOM
    // ----------------------------------------------------------------------

    interface ReactDOM {
        // HTML
        a: HTMLFactory;
        abbr: HTMLFactory;
        address: HTMLFactory;
        area: HTMLFactory;
        article: HTMLFactory;
        aside: HTMLFactory;
        audio: HTMLFactory;
        b: HTMLFactory;
        base: HTMLFactory;
        bdi: HTMLFactory;
        bdo: HTMLFactory;
        big: HTMLFactory;
        blockquote: HTMLFactory;
        body: HTMLFactory;
        br: HTMLFactory;
        button: HTMLFactory;
        canvas: HTMLFactory;
        caption: HTMLFactory;
        cite: HTMLFactory;
        code: HTMLFactory;
        col: HTMLFactory;
        colgroup: HTMLFactory;
        data: HTMLFactory;
        datalist: HTMLFactory;
        dd: HTMLFactory;
        del: HTMLFactory;
        details: HTMLFactory;
        dfn: HTMLFactory;
        dialog: HTMLFactory;
        div: HTMLFactory;
        dl: HTMLFactory;
        dt: HTMLFactory;
        em: HTMLFactory;
        embed: HTMLFactory;
        fieldset: HTMLFactory;
        figcaption: HTMLFactory;
        figure: HTMLFactory;
        footer: HTMLFactory;
        form: HTMLFactory;
        h1: HTMLFactory;
        h2: HTMLFactory;
        h3: HTMLFactory;
        h4: HTMLFactory;
        h5: HTMLFactory;
        h6: HTMLFactory;
        head: HTMLFactory;
        header: HTMLFactory;
        hr: HTMLFactory;
        html: HTMLFactory;
        i: HTMLFactory;
        iframe: HTMLFactory;
        img: HTMLFactory;
        input: HTMLFactory;
        ins: HTMLFactory;
        kbd: HTMLFactory;
        keygen: HTMLFactory;
        label: HTMLFactory;
        legend: HTMLFactory;
        li: HTMLFactory;
        link: HTMLFactory;
        main: HTMLFactory;
        map: HTMLFactory;
        mark: HTMLFactory;
        menu: HTMLFactory;
        menuitem: HTMLFactory;
        meta: HTMLFactory;
        meter: HTMLFactory;
        nav: HTMLFactory;
        noscript: HTMLFactory;
        object: HTMLFactory;
        ol: HTMLFactory;
        optgroup: HTMLFactory;
        option: HTMLFactory;
        output: HTMLFactory;
        p: HTMLFactory;
        param: HTMLFactory;
        picture: HTMLFactory;
        pre: HTMLFactory;
        progress: HTMLFactory;
        q: HTMLFactory;
        rp: HTMLFactory;
        rt: HTMLFactory;
        ruby: HTMLFactory;
        s: HTMLFactory;
        samp: HTMLFactory;
        script: HTMLFactory;
        section: HTMLFactory;
        select: HTMLFactory;
        small: HTMLFactory;
        source: HTMLFactory;
        span: HTMLFactory;
        strong: HTMLFactory;
        style: HTMLFactory;
        sub: HTMLFactory;
        summary: HTMLFactory;
        sup: HTMLFactory;
        table: HTMLFactory;
        tbody: HTMLFactory;
        td: HTMLFactory;
        textarea: HTMLFactory;
        tfoot: HTMLFactory;
        th: HTMLFactory;
        thead: HTMLFactory;
        time: HTMLFactory;
        title: HTMLFactory;
        tr: HTMLFactory;
        track: HTMLFactory;
        u: HTMLFactory;
        ul: HTMLFactory;
        "var": HTMLFactory;
        video: HTMLFactory;
        wbr: HTMLFactory;

        // SVG
        svg: SVGElementFactory;
        circle: SVGFactory;
        defs: SVGFactory;
        ellipse: SVGFactory;
        g: SVGFactory;
        line: SVGFactory;
        linearGradient: SVGFactory;
        mask: SVGFactory;
        path: SVGFactory;
        pattern: SVGFactory;
        polygon: SVGFactory;
        polyline: SVGFactory;
        radialGradient: SVGFactory;
        rect: SVGFactory;
        stop: SVGFactory;
        text: SVGFactory;
        tspan: SVGFactory;
    }

    //
    // React.PropTypes
    // ----------------------------------------------------------------------

    interface Validator<T> {
        (object: T, key: string, componentName: string): Error;
    }

    interface Requireable<T> extends Validator<T> {
        isRequired: Validator<T>;
    }

    interface ValidationMap<T> {
        [key: string]: Validator<T>;
    }

    interface ReactPropTypes {
        any: Requireable<any>;
        array: Requireable<any>;
        bool: Requireable<any>;
        func: Requireable<any>;
        number: Requireable<any>;
        object: Requireable<any>;
        string: Requireable<any>;
        node: Requireable<any>;
        element: Requireable<any>;
        instanceOf(expectedClass: {}): Requireable<any>;
        oneOf(types: any[]): Requireable<any>;
        oneOfType(types: Validator<any>[]): Requireable<any>;
        arrayOf(type: Validator<any>): Requireable<any>;
        objectOf(type: Validator<any>): Requireable<any>;
        shape(type: ValidationMap<any>): Requireable<any>;
    }

    //
    // React.Children
    // ----------------------------------------------------------------------

    interface ReactChildren {
        map<T>(children: ReactNode, fn: (child: ReactChild, index: number) => T): { [key:string]: T };
        forEach(children: ReactNode, fn: (child: ReactChild, index: number) => any): void;
        count(children: ReactNode): number;
        only(children: ReactNode): ReactChild;
    }

    //
    // Browser Interfaces
    // https://github.com/nikeee/2048-typescript/blob/master/2048/js/touch.d.ts
    // ----------------------------------------------------------------------

    interface AbstractView {
        styleMedia: StyleMedia;
        document: Document;
    }

    interface Touch {
        identifier: number;
        target: EventTarget;
        screenX: number;
        screenY: number;
        clientX: number;
        clientY: number;
        pageX: number;
        pageY: number;
    }

    interface TouchList {
        [index: number]: Touch;
        length: number;
        item(index: number): Touch;
        identifiedTouch(identifier: number): Touch;
    }
    
    //
    // React.addons
    // ----------------------------------------------------------------------

    export module addons {
        export var CSSTransitionGroup: CSSTransitionGroup;
        export var TransitionGroup: TransitionGroup;

        export var LinkedStateMixin: LinkedStateMixin;
        export var PureRenderMixin: PureRenderMixin;

        export function batchedUpdates<A, B>(
            callback: (a: A, b: B) => any, a: A, b: B): void;
        export function batchedUpdates<A>(callback: (a: A) => any, a: A): void;
        export function batchedUpdates(callback: () => any): void;

        // deprecated: use petehunt/react-classset or JedWatson/classnames
        export function classSet(cx: { [key: string]: boolean }): string;
        export function classSet(...classList: string[]): string;

        export function cloneWithProps<P>(
            element: DOMElement<P>, props: P): DOMElement<P>;
        export function cloneWithProps<P>(
            element: ClassicElement<P>, props: P): ClassicElement<P>;
        export function cloneWithProps<P>(
            element: ReactElement<P>, props: P): ReactElement<P>;

        export function createFragment(
            object: { [key: string]: ReactNode }): ReactFragment;

        export function update(value: any[], spec: UpdateArraySpec): any[];
        export function update(value: {}, spec: UpdateSpec): any;

        // Development tools
        export import Perf = ReactPerf;
        export import TestUtils = ReactTestUtils;
    }

    //
    // React.addons (Transitions)
    // ----------------------------------------------------------------------

    interface TransitionGroupProps {
        component?: ReactType;
        childFactory?: (child: ReactElement<any>) => ReactElement<any>;
    }

    interface CSSTransitionGroupProps extends TransitionGroupProps {
        transitionName: string;
        transitionAppear?: boolean;
        transitionEnter?: boolean;
        transitionLeave?: boolean;
    }

    type CSSTransitionGroup = ComponentClass<CSSTransitionGroupProps>;
    type TransitionGroup = ComponentClass<TransitionGroupProps>;

    //
    // React.addons (Mixins)
    // ----------------------------------------------------------------------

    interface ReactLink<T> {
        value: T;
        requestChange(newValue: T): void;
    }

    interface LinkedStateMixin extends Mixin<any, any> {
        linkState<T>(key: string): ReactLink<T>;
    }

    interface PureRenderMixin extends Mixin<any, any> {
    }

    //
    // Reat.addons.update
    // ----------------------------------------------------------------------

    interface UpdateSpec {
        $set?: any;
        $merge?: {};
        $apply?(value: any): any;
        // [key: string]: UpdateSpec;
    }

    interface UpdateArraySpec extends UpdateSpec {
        $push?: any[];
        $unshift?: any[];
        $splice?: any[][];
    }

    //
    // React.addons.Perf
    // ----------------------------------------------------------------------

    interface ComponentPerfContext {
        current: string;
        owner: string;
    }

    interface NumericPerfContext {
        [key: string]: number;
    }

    interface Measurements {
        exclusive: NumericPerfContext;
        inclusive: NumericPerfContext;
        render: NumericPerfContext;
        counts: NumericPerfContext;
        writes: NumericPerfContext;
        displayNames: {
            [key: string]: ComponentPerfContext;
        };
        totalTime: number;
    }

    module ReactPerf {
        export function start(): void;
        export function stop(): void;
        export function printInclusive(measurements: Measurements[]): void;
        export function printExclusive(measurements: Measurements[]): void;
        export function printWasted(measurements: Measurements[]): void;
        export function printDOM(measurements: Measurements[]): void;
        export function getLastMeasurements(): Measurements[];
    }

    //
    // React.addons.TestUtils
    // ----------------------------------------------------------------------

    interface MockedComponentClass {
        new(): any;
    }

    module ReactTestUtils {
        export import Simulate = ReactSimulate;

        export function renderIntoDocument<P>(
            element: ReactElement<P>): Component<P, any>;
        export function renderIntoDocument<C extends Component<any, any>>(
            element: ReactElement<any>): C;

        export function mockComponent(
            mocked: MockedComponentClass, mockTagName?: string): typeof ReactTestUtils;

        export function isElementOfType(
            element: ReactElement<any>, type: ReactType): boolean;
        export function isTextComponent(instance: Component<any, any>): boolean;
        export function isDOMComponent(instance: Component<any, any>): boolean;
        export function isCompositeComponent(instance: Component<any, any>): boolean;
        export function isCompositeComponentWithType(
            instance: Component<any, any>,
            type: ComponentClass<any>): boolean;

        export function findAllInRenderedTree(
            tree: Component<any, any>,
            fn: (i: Component<any, any>) => boolean): Component<any, any>;

        export function scryRenderedDOMComponentsWithClass(
            tree: Component<any, any>,
            className: string): DOMComponent<any>[];
        export function findRenderedDOMComponentWithClass(
            tree: Component<any, any>,
            className: string): DOMComponent<any>;

        export function scryRenderedDOMComponentsWithTag(
            tree: Component<any, any>,
            tagName: string): DOMComponent<any>[];
        export function findRenderedDOMComponentWithTag(
            tree: Component<any, any>,
            tagName: string): DOMComponent<any>;

        export function scryRenderedComponentsWithType<P>(
            tree: Component<any, any>,
            type: ComponentClass<P>): Component<P, {}>[];
        export function scryRenderedComponentsWithType<C extends Component<any, any>>(
            tree: Component<any, any>,
            type: ComponentClass<any>): C[];

        export function findRenderedComponentWithType<P>(
            tree: Component<any, any>,
            type: ComponentClass<P>): Component<P, {}>;
        export function findRenderedComponentWithType<C extends Component<any, any>>(
            tree: Component<any, any>,
            type: ComponentClass<any>): C;

        export function createRenderer(): ShallowRenderer;
    }

    interface SyntheticEventData {
        altKey?: boolean;
        button?: number;
        buttons?: number;
        clientX?: number;
        clientY?: number;
        changedTouches?: TouchList;
        charCode?: boolean;
        clipboardData?: DataTransfer;
        ctrlKey?: boolean;
        deltaMode?: number;
        deltaX?: number;
        deltaY?: number;
        deltaZ?: number;
        detail?: number;
        getModifierState?(key: string): boolean;
        key?: string;
        keyCode?: number;
        locale?: string;
        location?: number;
        metaKey?: boolean;
        pageX?: number;
        pageY?: number;
        relatedTarget?: EventTarget;
        repeat?: boolean;
        screenX?: number;
        screenY?: number;
        shiftKey?: boolean;
        targetTouches?: TouchList;
        touches?: TouchList;
        view?: AbstractView;
        which?: number;
    }

    interface EventSimulator {
        (element: Element, eventData?: SyntheticEventData): void;
        (component: Component<any, any>, eventData?: SyntheticEventData): void;
    }

    module ReactSimulate {
        export var blur: EventSimulator;
        export var change: EventSimulator;
        export var click: EventSimulator;
        export var cut: EventSimulator;
        export var doubleClick: EventSimulator;
        export var drag: EventSimulator;
        export var dragEnd: EventSimulator;
        export var dragEnter: EventSimulator;
        export var dragExit: EventSimulator;
        export var dragLeave: EventSimulator;
        export var dragOver: EventSimulator;
        export var dragStart: EventSimulator;
        export var drop: EventSimulator;
        export var focus: EventSimulator;
        export var input: EventSimulator;
        export var keyDown: EventSimulator;
        export var keyPress: EventSimulator;
        export var keyUp: EventSimulator;
        export var mouseDown: EventSimulator;
        export var mouseEnter: EventSimulator;
        export var mouseLeave: EventSimulator;
        export var mouseMove: EventSimulator;
        export var mouseOut: EventSimulator;
        export var mouseOver: EventSimulator;
        export var mouseUp: EventSimulator;
        export var paste: EventSimulator;
        export var scroll: EventSimulator;
        export var submit: EventSimulator;
        export var touchCancel: EventSimulator;
        export var touchEnd: EventSimulator;
        export var touchMove: EventSimulator;
        export var touchStart: EventSimulator;
        export var wheel: EventSimulator;
    }

    class ShallowRenderer {
        getRenderOutput<E extends ReactElement<any>>(): E;
        getRenderOutput(): ReactElement<any>;
        render(element: ReactElement<any>, context?: any): void;
        unmount(): void;
    }
}

declare namespace JSX {
    import React = __React;

    interface Element extends React.ReactElement<any> { }
    interface ElementClass extends React.Component<any, any> {
        render(): JSX.Element;
    }
    interface ElementAttributesProperty { props: {}; }

    interface IntrinsicElements {
        // HTML
        a: React.HTMLAttributes;
        abbr: React.HTMLAttributes;
        address: React.HTMLAttributes;
        area: React.HTMLAttributes;
        article: React.HTMLAttributes;
        aside: React.HTMLAttributes;
        audio: React.HTMLAttributes;
        b: React.HTMLAttributes;
        base: React.HTMLAttributes;
        bdi: React.HTMLAttributes;
        bdo: React.HTMLAttributes;
        big: React.HTMLAttributes;
        blockquote: React.HTMLAttributes;
        body: React.HTMLAttributes;
        br: React.HTMLAttributes;
        button: React.HTMLAttributes;
        canvas: React.HTMLAttributes;
        caption: React.HTMLAttributes;
        cite: React.HTMLAttributes;
        code: React.HTMLAttributes;
        col: React.HTMLAttributes;
        colgroup: React.HTMLAttributes;
        data: React.HTMLAttributes;
        datalist: React.HTMLAttributes;
        dd: React.HTMLAttributes;
        del: React.HTMLAttributes;
        details: React.HTMLAttributes;
        dfn: React.HTMLAttributes;
        dialog: React.HTMLAttributes;
        div: React.HTMLAttributes;
        dl: React.HTMLAttributes;
        dt: React.HTMLAttributes;
        em: React.HTMLAttributes;
        embed: React.HTMLAttributes;
        fieldset: React.HTMLAttributes;
        figcaption: React.HTMLAttributes;
        figure: React.HTMLAttributes;
        footer: React.HTMLAttributes;
        form: React.HTMLAttributes;
        h1: React.HTMLAttributes;
        h2: React.HTMLAttributes;
        h3: React.HTMLAttributes;
        h4: React.HTMLAttributes;
        h5: React.HTMLAttributes;
        h6: React.HTMLAttributes;
        head: React.HTMLAttributes;
        header: React.HTMLAttributes;
        hr: React.HTMLAttributes;
        html: React.HTMLAttributes;
        i: React.HTMLAttributes;
        iframe: React.HTMLAttributes;
        img: React.HTMLAttributes;
        input: React.HTMLAttributes;
        ins: React.HTMLAttributes;
        kbd: React.HTMLAttributes;
        keygen: React.HTMLAttributes;
        label: React.HTMLAttributes;
        legend: React.HTMLAttributes;
        li: React.HTMLAttributes;
        link: React.HTMLAttributes;
        main: React.HTMLAttributes;
        map: React.HTMLAttributes;
        mark: React.HTMLAttributes;
        menu: React.HTMLAttributes;
        menuitem: React.HTMLAttributes;
        meta: React.HTMLAttributes;
        meter: React.HTMLAttributes;
        nav: React.HTMLAttributes;
        noscript: React.HTMLAttributes;
        object: React.HTMLAttributes;
        ol: React.HTMLAttributes;
        optgroup: React.HTMLAttributes;
        option: React.HTMLAttributes;
        output: React.HTMLAttributes;
        p: React.HTMLAttributes;
        param: React.HTMLAttributes;
        picture: React.HTMLAttributes;
        pre: React.HTMLAttributes;
        progress: React.HTMLAttributes;
        q: React.HTMLAttributes;
        rp: React.HTMLAttributes;
        rt: React.HTMLAttributes;
        ruby: React.HTMLAttributes;
        s: React.HTMLAttributes;
        samp: React.HTMLAttributes;
        script: React.HTMLAttributes;
        section: React.HTMLAttributes;
        select: React.HTMLAttributes;
        small: React.HTMLAttributes;
        source: React.HTMLAttributes;
        span: React.HTMLAttributes;
        strong: React.HTMLAttributes;
        style: React.HTMLAttributes;
        sub: React.HTMLAttributes;
        summary: React.HTMLAttributes;
        sup: React.HTMLAttributes;
        table: React.HTMLAttributes;
        tbody: React.HTMLAttributes;
        td: React.HTMLAttributes;
        textarea: React.HTMLAttributes;
        tfoot: React.HTMLAttributes;
        th: React.HTMLAttributes;
        thead: React.HTMLAttributes;
        time: React.HTMLAttributes;
        title: React.HTMLAttributes;
        tr: React.HTMLAttributes;
        track: React.HTMLAttributes;
        u: React.HTMLAttributes;
        ul: React.HTMLAttributes;
        "var": React.HTMLAttributes;
        video: React.HTMLAttributes;
        wbr: React.HTMLAttributes;

        // SVG
        svg: React.SVGElementAttributes;

        circle: React.SVGAttributes;
        defs: React.SVGAttributes;
        ellipse: React.SVGAttributes;
        g: React.SVGAttributes;
        line: React.SVGAttributes;
        linearGradient: React.SVGAttributes;
        mask: React.SVGAttributes;
        path: React.SVGAttributes;
        pattern: React.SVGAttributes;
        polygon: React.SVGAttributes;
        polyline: React.SVGAttributes;
        radialGradient: React.SVGAttributes;
        rect: React.SVGAttributes;
        stop: React.SVGAttributes;
        text: React.SVGAttributes;
        tspan: React.SVGAttributes;
    }
}

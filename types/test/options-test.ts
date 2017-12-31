import Vue, { VNode } from "../index";
import { AsyncComponent, ComponentOptions, FunctionalComponentOptions } from "../index";
import { CreateElement } from "../vue";

interface Component extends Vue {
  a: number;
}

Vue.component('sub-component', {
  components: {
    a: Vue.component(""),
    b: {}
  }
});

Vue.component('prop-component', {
  props: {
    size: Number,
    name: {
      type: String,
      default: '0',
      required: true,
    }
  },
  data() {
    return {
      fixedSize: this.size.toFixed(),
      capName: this.name.toUpperCase()
    }
  }
});

Vue.component('string-prop', {
  props: ['size', 'name'],
  data() {
    return {
      fixedSize: this.size.whatever,
      capName: this.name.isany
    }
  }
});

class User {
  private u: number
}
class Cat {
  private u: number
}

Vue.component('union-prop', {
  props: {
    primitive: [String, Number],
    object: [Cat, User],
    regex: RegExp,
    mixed: [RegExp, Array],
    union: [User, Number] as {new(): User | Number}[] // requires annotation
  },
  data() {
    this.primitive;
    this.object;
    this.union;
    this.regex.compile;
    this.mixed;
    return {
      fixedSize: this.union,
    }
  }
});

Vue.component('component', {
  data() {
    this.$mount
    this.size
    return {
      a: 1
    }
  },
  props: {
    size: Number,
    name: {
      type: String,
      default: '0',
      required: true,
    }
  },
  propsData: {
    msg: "Hello"
  },
  computed: {
    aDouble(): number {
      return this.a * 2;
    },
    aPlus: {
      get(): number {
        return this.a + 1;
      },
      set(v: number) {
        this.a = v - 1;
      },
      cache: false
    }
  },
  methods: {
    plus() {
      this.a++;
      this.aDouble.toFixed();
      this.aPlus = 1;
      this.size.toFixed();
    }
  },
  watch: {
    'a': function(val: number, oldVal: number) {
      console.log(`new: ${val}, old: ${oldVal}`);
    },
    'b': 'someMethod',
    'c': {
      handler(val, oldVal) {
        this.a = val
      },
      deep: true
    }
  },
  el: "#app",
  template: "<div>{{ message }}</div>",
  render(createElement) {
    return createElement("div", {
      attrs: {
        id: "foo"
      },
      props: {
        myProp: "bar"
      },
      domProps: {
        innerHTML: "baz"
      },
      on: {
        click: new Function
      },
      nativeOn: {
        click: new Function
      },
      class: {
        foo: true,
        bar: false
      },
      style: {
        color: 'red',
        fontSize: '14px'
      },
      key: 'myKey',
      ref: 'myRef'
    }, [
      createElement(),
      createElement("div", "message"),
      createElement(Vue.component("component")),
      createElement({} as ComponentOptions<Vue>),
      createElement({
        functional: true,
        render(c: CreateElement) {
          return createElement()
        }
      }),

      createElement(() => Vue.component("component")),
      createElement(() => ( {} as ComponentOptions<Vue> )),
      createElement((resolve, reject) => {
        resolve({} as ComponentOptions<Vue>);
        reject();
      }),

      "message",

      [createElement("div", "message")]
    ]);
  },
  staticRenderFns: [],

  beforeCreate() {
    (this as any).a = 1;
  },
  created() {},
  beforeDestroy() {},
  destroyed() {},
  beforeMount() {},
  mounted() {},
  beforeUpdate() {},
  updated() {},
  activated() {},
  deactivated() {},
  errorCaptured() {
    return true
  },

  directives: {
    a: {
      bind() {},
      inserted() {},
      update() {},
      componentUpdated() {},
      unbind() {}
    },
    b(el, binding, vnode, oldVnode) {
      el.textContent;

      binding.name;
      binding.value;
      binding.oldValue;
      binding.expression;
      binding.arg;
      binding.modifiers["modifier"];
    }
  },
  components: {
    a: Vue.component(""),
    b: {} as ComponentOptions<Vue>
  },
  transitions: {},
  filters: {
    double(value: number) {
      return value * 2;
    }
  },
  parent: new Vue,
  mixins: [Vue.component(""), ({} as ComponentOptions<Vue>)],
  name: "Component",
  extends: {} as ComponentOptions<Vue>,
  delimiters: ["${", "}"]
});

Vue.component('provide-inject', {
  provide: {
    foo: 1
  },
  inject: {
    injectFoo: 'foo',
    injectBar: Symbol(),
    injectBaz: { from: 'baz' },
    injectQux: { default: 1 },
    injectQuux: { from: 'quuz', default: () => ({ value: 1 })}
  }
})

Vue.component('provide-function', {
  provide: () => ({
    foo: 1
  })
})

Vue.component('component-with-scoped-slot', {
  render (h) {
    interface ScopedSlotProps {
      msg: string
    }

    return h('div', [
      h('child', [
        // default scoped slot as children
        (props: ScopedSlotProps) => [h('span', [props.msg])]
      ]),
      h('child', {
        scopedSlots: {
          // named scoped slot as vnode data
          item: (props: ScopedSlotProps) => [h('span', [props.msg])]
        }
      })
    ])
  },
  components: {
    child: {
      render (this: Vue, h: CreateElement) {
        return h('div', [
          this.$scopedSlots['default']({ msg: 'hi' }),
          this.$scopedSlots['item']({ msg: 'hello' })
        ])
      }
    }
  }
})

Vue.component('narrow-array-of-vnode-type', {
  render (h): VNode {
    const slot = this.$scopedSlots.default({})
    if (typeof slot !== 'string') {
      const first = slot[0]
      if (!Array.isArray(first) && typeof first !== 'string') {
        return first;
      }
    }
    return h();
  }
})

Vue.component('functional-component', {
  props: ['prop'],
  functional: true,
  inject: ['foo'],
  render(createElement, context) {
    context.props;
    context.children;
    context.slots();
    context.data;
    context.parent;
    return createElement("div", {}, context.children);
  }
});

Vue.component('functional-component-object-inject', {
  functional: true,
  inject: {
    foo: 'foo',
    bar: Symbol(),
    baz: { from: 'baz' },
    qux: { default: 1 },
    quux: { from: 'quuz', default: () => ({ value: 1 })}
  },
  render(h) {
    return h('div')
  }
})

Vue.component("async-component", ((resolve, reject) => {
  setTimeout(() => {
    resolve(Vue.component("component"));
  }, 0);
  return new Promise((resolve) => {
    resolve({
      functional: true,
      render(h: CreateElement) { return h('div') }
    });
  })
}));

Vue.component('async-es-module-component', () => import('./es-module'))

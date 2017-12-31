import Vue from "../index";

declare module "../vue" {
  // add instance property and method
  interface Vue {
    $instanceProperty: string;
    $instanceMethod(): void;
  }

  // add static property and method
  interface VueConstructor {
    staticProperty: string;
    staticMethod(): void;
  }
}

// augment ComponentOptions
declare module "../options" {
  interface ComponentOptions<V extends Vue> {
    foo?: string;
  }
}

const vm = new Vue({
  props: ["bar"],
  data: {
    a: true
  },
  foo: "foo",
  methods: {
    foo() {
      this.a = false;
    }
  },
  computed: {
    BAR(): string {
      return this.bar.toUpperCase();
    }
  }
});

vm.$instanceProperty;
vm.$instanceMethod();

Vue.staticProperty;
Vue.staticMethod();

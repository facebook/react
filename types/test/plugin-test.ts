import Vue from "../index";
import { PluginFunction, PluginObject } from "../index";

class Option {
  prefix: string;
  suffix: string;
}

const plugin: PluginObject<Option> = {
  install(Vue, option) {
    if (typeof option !== "undefined") {
      const {prefix, suffix} = option;
    }
  }
}
const installer: PluginFunction<Option> = function(Vue, option) { }

Vue.use(plugin, new Option);
Vue.use(installer, new Option);
Vue.use(installer, new Option, new Option, new Option);

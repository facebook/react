import Foo from "foo";
import * as Bar from "bar";
import { Baz } from "baz";

function Component(props) {
  let g = global;
  let y = new Array(props.count);
  let s = String("hello");
  let b = Boolean(true);
  let n = Number(0);
  let x = Math.min(props.x, props.y);
  setTimeout(() => {}, 0);
  setInterval(() => {}, 0);
  Foo;
  Bar;
  Baz;
}

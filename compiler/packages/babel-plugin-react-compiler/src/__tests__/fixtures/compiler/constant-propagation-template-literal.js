import { Stringify } from "shared-runtime";

function foo() {
  return (
    <Stringify
      value={{
        a: `` === "",
        b: `a${1}b`,
        c: ` abc \u0041\n\u000a\ŧ`,
        d: `abc${1}def`,
        e: `abc${1}def${2}`,
        f: `abc${1}def${2}ghi`,
        g: `a${1 + 3}b${``}c${"d" + `e${2 + 4}f`}`,
        h: `1${2}${Math.sin(0)}`,
      }}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

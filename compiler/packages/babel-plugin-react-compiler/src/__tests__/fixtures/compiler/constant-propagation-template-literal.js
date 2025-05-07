import {Stringify, identity} from 'shared-runtime';

function foo() {
  return (
    <Stringify
      value={[
        `` === '',
        `a${1}b`,
        ` abc \u0041\n\u000a\ŧ`,
        `abc${1}def`,
        `abc${1}def${2}`,
        `abc${1}def${2}ghi`,
        `a${1 + 3}b${``}c${'d' + `e${2 + 4}f`}`,
        `1${2}${Math.sin(0)}`,
        `${NaN}`,
        `${Infinity}`,
        `${-Infinity}`,
        `${0}123456789`,
        `123456789${0}`,
        `${0}123456789${0}`,
        `${0}1234${5}6789${0}`,
        `${0}1234${`${0}123456789${`${0}123456789${0}`}`}6789${0}`,
        `${0}1234${`${0}123456789${`${identity(0)}`}`}6789${0}`,
        `${`${`${`${0}`}`}`}`,
        `${`${`${`${""}`}`}`}`,
        `${`${`${`${identity("")}`}`}`}`,
      ]}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

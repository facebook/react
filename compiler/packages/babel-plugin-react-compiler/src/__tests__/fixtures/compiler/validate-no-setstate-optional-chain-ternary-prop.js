// @validateNoSetStateInRender
import {useState} from 'react';

function Component({data, setTotal}) {
  setTotal(data.rows?.count != null ? data.rows?.count : 0);
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{data: {rows: {count: 3}}, setTotal: () => {}}],
  isComponent: true,
};

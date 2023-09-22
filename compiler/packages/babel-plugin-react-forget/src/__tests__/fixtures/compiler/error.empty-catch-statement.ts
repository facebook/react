import { getNumber } from "shared-runtime";

function useFoo() {
  try {
    return getNumber();
  } catch {}
}
export const FIXTURE_ENTRYPONT = {
  fn: useFoo,
  params: [],
};

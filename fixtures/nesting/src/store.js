import {createStore} from 'redux';

function reducer(state = 0, action) {
  switch (action.type) {
    case 'increment':
      return state + 1;
    default:
      return state;
  }
}

// Because this file is declared above both Modern and Legacy folders,
// we can import this from either folder without duplicating the object.
export const store = createStore(reducer);

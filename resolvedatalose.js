// conceptual design
// Technical Scenarios
// Our one-page application is built on Redux+React.

// Most of the state of the component (some States maintained internally by uncontrolled components are, indeed, harder to record) is recorded in the store-maintained state of Redux.
// It is Redux, a global-based state management, that enables the "UI model" to emerge clearly.

// So as long as the state is cached in the browser's local store, you can restore the user's last interactive interface (basically).

// When to fetch
// Say when to take it first, because it's good to say.

// Assuming we have saved the state, there will be a serialized state object in the localStorage.
// Restoring state in the interface only takes place once when Redux creates the store when the application is initialized



function loadState() {
  try { // It's also possible to use other local storage if it doesn't support localStorage
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      return undefined;
    } else {
      return JSON.parse(serializedState);
    }
  } catch (err) {
    // ...error handling
    return undefined;
  }
}

let store = createStore(todoApp, loadState())


// When to save
// The way to save a state is simple 

const saveState = (state) => {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem('state', serializedState);
    } catch (err) {
      // ...error handling
    }
  };

  // One simple (silly) way to trigger a save is to persist every time a state is updated.This keeps the locally stored state up to date.

// This is also easy to do based on Redux.After the store is created, the subscribe method is called to listen for changes to the state

// createStore after

store.subscribe(() => {
    const state = store.getState();
    saveState(state);
  })

  // However, it is clear that this is unreasonable from a performance perspective (although it may be necessary in some scenarios).So the wise prospective student suggested that only on the onbeforeunload event would do.

  window.onbeforeunload = (e) => {
    const state = store.getState();
    saveState(state);
  };

  // So whenever a user refreshes or closes a page, he or she will silently record the current state.

// When to Empty
// Once you save and retrieve, the feature is implemented.Version comes online, users use it, and the state is cached locally, so there is no problem with the current application.

// pit
// But when the new version of the code is released again, the problem arises.
// The state maintained by the new code is not the same structure as before. Users will inevitably make errors when they use the new code to read their locally cached old state.
// However, no matter what the user does at this time, he will not clear the state of his local cache (not to mention in detail, mainly because of the logic of loadState and saveState above.)Bad states are saved over and over again, even if you manually clear the localStorage in developer tools)

// solution
// The solution is that state needs to be versioned, and at least one empty operation should occur when it is inconsistent with the version of the code.
// In the current project, the following scenarios are used:

// Using state directly, add a node to it to record the version.That is, to increase the corresponding action, reducer, just to maintain the value of version.

// Actions
export function versionUpdate(version = 0.1) {
    return {
      type    : VERSION_UPDATE,
      payload : version
    };
  }
  
  //The logical changes to save the state are minor, that is, each time you save, you update the version of the current code to the state.
  

  window.onbeforeunload = (e) => {
    store.dispatch({
      type: 'VERSION_UPDATE',
      payload: __VERSION__  // Code global variables, which can be handled with the project configuration.Need to update every time involved state You must update this version number.
    })
    const state = store.getState();
    saveState(state);
  }

  // When reading a state, compare the version of the code with the version of the state, and handle mismatches accordingly (emptying is when the initial state passed to createStore is undefined)

  export const loadState = () => {
    try {
      const serializedState = localStorage.getItem('state');
      if (serializedState === null) {
        return undefined;
      } else {
        let state = JSON.parse(serializedState);
        // Determine the locally stored state version and empty the state if it falls behind the code version
        if (state.version < __VERSION__) {
          return undefined;
        } else {
          return state;
        }
      }
    } catch (err) {
      // ...error handling
      return undefined;
    }
  };

  // The following is not rotated, but written by myself.

  // createStore from Redux Source
  // Understand the Redux source createStore, code directory in redux/src/createStore.

  
/**
 * This is a private action type reserved by redux.
 * For any unknown actions, you must return to the current state.
 * If the current state is undefined, you will have to return to an initial state.
 * Do not directly reference these action types in your code.
 */
export const ActionTypes = {
  INIT: '@@redux/INIT'
}

// Look at the source code to discover the createStore, which can accept a change to the state, and with redux-thunk the final code is as follows:

//2, introducing redux and introducing reducer
import {createStore, applyMiddleware, compose} from 'redux';
//import reducer from './reducers';
import rootReducer from './combineReducers';
import thunk from 'redux-thunk';

//3, Create a store

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
let store = null;

const loadState = () => {
    try {
        const serializedState = sessionStorage.getItem('state');
        if (serializedState === null) {
            return undefined;
        } else {
            return JSON.parse(serializedState);
        }
    } catch (err) {
        // Error handling
        return undefined;
    }
}
if(process.env.NODE_ENV === 'development'){
    store = createStore(rootReducer,loadState(), composeEnhancers(
        applyMiddleware(thunk)
    ));
}else{
    store = createStore(rootReducer,loadState(),applyMiddleware(thunk))
}

export default store;
 

// Since store data changes are monitored through subscribe, the data saved in session store is the latest store data at this time

// createStore is fetched from session store.Problem solving.

// During this problem solving process, you used the react-persist plugin and found that its data was synchronized to sessionStorage, but the page refreshed

// store data is gone and synchronized to sessionStorage, so we have to use the above method at last.

// If there is a better way for the little buddies you see to welcome the message to teach you.
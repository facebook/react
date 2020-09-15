import {createContext, useContext} from 'react';

const RouterContext = createContext(null);

export const RouterProvider = RouterContext.Provider;

export function useRouter() {
  return useContext(RouterContext);
}

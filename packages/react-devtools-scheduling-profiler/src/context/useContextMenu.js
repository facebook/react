/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {OnChangeFn, RegistryContextType} from './Contexts';

import {useContext, useEffect} from 'react';
import {RegistryContext} from './Contexts';

export default function useContextMenu<T>({
  data,
  id,
  onChange,
  ref,
}: {|
  data: T,
  id: string,
  onChange: OnChangeFn,
  ref: {+current: HTMLElement | null},
|}) {
  const {showMenu} = useContext<RegistryContextType>(RegistryContext);

  useEffect(() => {
    if (ref.current !== null) {
      const handleContextMenu = (event: MouseEvent | TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const pageX =
          (event: any).pageX ||
          (event.touches && (event: any).touches[0].pageX);
        const pageY =
          (event: any).pageY ||
          (event.touches && (event: any).touches[0].pageY);

        showMenu({data, id, onChange, pageX, pageY});
      };

      const trigger = ref.current;
      trigger.addEventListener('contextmenu', handleContextMenu);

      return () => {
        trigger.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [data, id, showMenu]);
}

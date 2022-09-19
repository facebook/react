/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useContext, useEffect} from 'react';
import {RegistryContext} from './Contexts';

import type {OnChangeFn, RegistryContextType} from './Contexts';
import type {ElementRef} from 'react';

export default function useContextMenu({
  data,
  id,
  onChange,
  ref,
}: {
  data: Object,
  id: string,
  onChange?: OnChangeFn,
  ref: {current: ElementRef<*> | null},
}) {
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

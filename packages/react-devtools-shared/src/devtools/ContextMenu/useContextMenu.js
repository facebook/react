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

import type {ElementRef} from 'react';

export default function useContextMenu({
  data,
  id,
  ref,
}: {|
  data: Object,
  id: string,
  ref: {current: ElementRef<'div'> | null},
|}) {
  const {showMenu} = useContext(RegistryContext);

  useEffect(() => {
    if (ref.current !== null) {
      const handleContextMenu = (event: MouseEvent | TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const pageX =
          event.pageX ||
          (event.touches && ((event: any): TouchEvent).touches[0].pageX);
        const pageY =
          event.pageY ||
          (event.touches && ((event: any): TouchEvent).touches[0].pageY);

        showMenu({data, id, pageX, pageY});
      };

      const trigger = ref.current;
      trigger.addEventListener('contextmenu', handleContextMenu);

      return () => {
        trigger.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [data, id, showMenu]);
}

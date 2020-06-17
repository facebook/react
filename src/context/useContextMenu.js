// @flow

import { useContext, useEffect, useRef } from 'react';
import { RegistryContext } from './Contexts';

import type { ElementRef } from 'react';
import type { OnChangeFn } from './Contexts';
import type { Return } from '../types';

export default function useContextMenu<T>({
  data,
  id,
  onChange,
  ref,
}: {|
  data: T,
  id: string,
  onChange: OnChangeFn,
  ref: Return<typeof useRef>,
|}) {
  const { showMenu } = useContext(RegistryContext);

  useEffect(() => {
    if (ref.current !== null) {
      const handleContextMenu: MouseEventHandler = event => {
        event.preventDefault();
        event.stopPropagation();

        const pageX: number =
          event.pageX || (event.touches && event.touches[0].pageX);
        const pageY: number =
          event.pageY || (event.touches && event.touches[0].pageY);

        showMenu({ data, id, onChange, pageX, pageY });
      };

      const trigger = ref.current;
      if (trigger) {
        trigger.addEventListener('contextmenu', handleContextMenu);
      }

      return () => {
        if (trigger) {
          trigger.removeEventListener('contextmenu', handleContextMenu);
        }
      };
    }
  }, [data, id, showMenu]);
}

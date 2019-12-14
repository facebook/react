import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {createPortal} from 'react-dom';
import {DataContext, RegistryContext} from './Contexts';

import styles from './ContextMenu.css';

function respositionToFit(element, pageX, pageY) {
  if (element !== null) {
    if (pageY + element.offsetHeight >= window.innerHeight) {
      if (pageY - element.offsetHeight > 0) {
        element.style.top = `${pageY - element.offsetHeight}px`;
      } else {
        element.style.top = '0px';
      }
    } else {
      element.style.top = `${pageY}px`;
    }

    if (pageX + element.offsetWidth >= window.innerWidth) {
      if (pageX - element.offsetWidth > 0) {
        element.style.left = `${pageX - element.offsetWidth}px`;
      } else {
        element.style.left = '0px';
      }
    } else {
      element.style.left = `${pageX}px`;
    }
  }
}

const HIDDEN_STATE = {
  data: null,
  isVisible: false,
  pageX: 0,
  pageY: 0,
};

type Props = {|
  children: React$Node,
  id: string,
|};

export default function ContextMenu({children, id}: Props) {
  const {registerMenu} = useContext(RegistryContext);

  const [state, setState] = useState(HIDDEN_STATE);

  const containerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    containerRef.current = document.createElement('div');
    document.body.appendChild(containerRef.current);
    return () => {
      document.body.removeChild(containerRef.current);
    };
  }, []);

  useEffect(
    () => {
      const showMenu = ({data, pageX, pageY}) => {
        setState({data, isVisible: true, pageX, pageY});
      };
      const hideMenu = () => setState(HIDDEN_STATE);
      return registerMenu(id, showMenu, hideMenu);
    },
    [id],
  );

  useLayoutEffect(
    () => {
      if (!state.isVisible) {
        return;
      }

      const menu = menuRef.current;

      const hide = event => {
        if (!menu.contains(event.target)) {
          setState(HIDDEN_STATE);
        }
      };

      document.addEventListener('mousedown', hide);
      document.addEventListener('touchstart', hide);
      document.addEventListener('keydown', hide);

      window.addEventListener('resize', hide);

      respositionToFit(menu, state.pageX, state.pageY);

      return () => {
        document.removeEventListener('mousedown', hide);
        document.removeEventListener('touchstart', hide);
        document.removeEventListener('keydown', hide);

        window.removeEventListener('resize', hide);
      };
    },
    [state],
  );

  if (!state.isVisible) {
    return null;
  } else {
    return createPortal(
      <div ref={menuRef} className={styles.ContextMenu}>
        <DataContext.Provider value={state.data}>
          {children}
        </DataContext.Provider>
      </div>,
      containerRef.current,
    );
  }
}

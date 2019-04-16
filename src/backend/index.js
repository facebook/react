// @flow

import type { DevToolsHook, ReactRenderer, RendererInterface } from './types';
import Agent from './agent';

import { attach } from './renderer';
import { attach as attachLegacy } from './legacy/renderer';

export function initBackend(
  hook: DevToolsHook,
  agent: Agent,
  global: Object
): void {
  const subs = [
    hook.sub(
      'renderer-attached',
      ({
        id,
        renderer,
        rendererInterface,
      }: {
        id: number,
        renderer: ReactRenderer,
        rendererInterface: RendererInterface,
      }) => {
        agent.setRendererInterface(id, rendererInterface);

        // Now that the Store and the renderer interface are connected,
        // it's time to flush the pending operation codes to the frontend.
        rendererInterface.flushInitialOperations();
      }
    ),

    hook.sub('operations', agent.onHookOperations),

    // TODO Add additional subscriptions required for profiling mode
  ];

  const attachRenderer = (id: number, renderer: ReactRenderer) => {
    let rendererInterface = hook.rendererInterfaces.get(id);

    // Inject any not-yet-injected renderers (if we didn't reload-and-profile)
    if (!rendererInterface) {
      if (typeof renderer.findFiberByHostInstance === 'function') {
        rendererInterface = attach(hook, id, renderer, global);
      } else {
        rendererInterface = attachLegacy(hook, id, renderer, global);
      }

      hook.rendererInterfaces.set(id, rendererInterface);
    }

    // Notify the DevTools frontend about new renderers.
    // This includes any that were attached early (via __REACT_DEVTOOLS_ATTACH__).
    hook.emit('renderer-attached', {
      id,
      renderer,
      rendererInterface,
    });
  };

  // Connect renderers that have already injected themselves.
  hook.renderers.forEach((renderer, id) => {
    attachRenderer(id, renderer);
  });

  // Connect any new renderers that injected themselves.
  hook.on(
    'renderer',
    ({ id, renderer }: { id: number, renderer: ReactRenderer }) => {
      attachRenderer(id, renderer);
    }
  );

  hook.emit('react-devtools', agent);
  hook.reactDevtoolsAgent = agent;
  agent.addListener('shutdown', () => {
    subs.forEach(fn => fn());
    hook.rendererInterfaces.forEach(rendererInterface => {
      rendererInterface.cleanup();
    });
    hook.reactDevtoolsAgent = null;
  });
}

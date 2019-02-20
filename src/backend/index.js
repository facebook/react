// @flow

import type { DevToolsHook, ReactRenderer, RendererInterface } from './types';
import Agent from './agent';

import { attach } from './renderer';

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
        rendererInterface.walkTree();
      }
    ),

    hook.sub('operations', agent.onHookOperations),

    // TODO Add additional subscriptions required for profiling mode
  ];

  const attachRenderer = (id: number, renderer: ReactRenderer) => {
    const rendererInterface = attach(hook, id, renderer, global);
    hook.rendererInterfaces.set(id, rendererInterface);
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

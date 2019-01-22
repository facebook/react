// @flow

import type {Hook} from './types';
import type {Bridge} from '../types';
import Agent from './agent';

import { attach } from './renderer';

export function initBackend(hook: Hook, agent: Agent): void {
  const subs = [
    hook.sub('renderer-attached', ({id, renderer, rendererInterface}) => {
      agent.setRendererInterface(id, rendererInterface);
      rendererInterface.walkTree();
    }),

    hook.sub('rootCommitted', agent.onHookRootCommitted),
    hook.sub('mount', agent.onHookMount),
    hook.sub('update', agent.onHookUpdate),
    hook.sub('unmount', agent.onHookUnmount),

    // TODO Add additional subscriptions required for profiling mode
  ];

  const attachRenderer = (id, renderer) => {
    const rendererInterface = attach(hook, id, renderer);
    hook.rendererInterfaces[id] = rendererInterface;
    hook.emit('renderer-attached', {
      id,
      renderer,
      rendererInterface
    });
  };

  // Connect renderers that have already injected themselves.
  for (let id in hook.renderers) {
    const renderer = hook.renderers[id];
    attachRenderer(id, renderer);
  }

  // Connect any new renderers that injected themselves.
  hook.on('renderer', ({id, renderer}) => {
    attachRenderer(id, renderer);
  });

  hook.emit('react-devtools', agent);
  hook.reactDevtoolsAgent = agent;
  agent.addListener('shutdown', () => {
    subs.forEach(fn => fn());
    hook.reactDevtoolsAgent = null;
  });
};

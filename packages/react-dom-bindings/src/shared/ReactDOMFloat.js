import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';

export function prefetchDNS() {
  const dispatcher = ReactDOMSharedInternals.Dispatcher.current;
  if (dispatcher) {
    dispatcher.prefetchDNS.apply(this, arguments);
  }
  // We don't error because preconnect needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

export function preconnect() {
  const dispatcher = ReactDOMSharedInternals.Dispatcher.current;
  if (dispatcher) {
    dispatcher.preconnect.apply(this, arguments);
  }
  // We don't error because preconnect needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

export function preload() {
  const dispatcher = ReactDOMSharedInternals.Dispatcher.current;
  if (dispatcher) {
    dispatcher.preload.apply(this, arguments);
  }
  // We don't error because preload needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

export function preinit() {
  const dispatcher = ReactDOMSharedInternals.Dispatcher.current;
  if (dispatcher) {
    dispatcher.preinit.apply(this, arguments);
  }
  // We don't error because preinit needs to be resilient to being called in a variety of scopes
  // and the runtime may not be capable of responding. The function is optimistic and not critical
  // so we favor silent bailout over warning or erroring.
}

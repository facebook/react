import {createContext, useState, useEffect, useContext} from 'react';

// --- Product (Server) ---

export default function Root({url}) {
  return (
    <UrlContext.Provider value={removeSlashes(url)}>
      <Frame entry="App" />
    </UrlContext.Provider>
  );
}

// Extracts data from a URL section.
// Needs to be able to re-run in isolation.
function parseAppParams(reader) {
  const path = reader.consume();
  switch (path) {
    case '':
      return {tab: 'feed'};
    case 'profile':
      const id = reader.consume();
      if (id === '') {
        throw new Error('Not found');
      }
      return {tab: 'profile', id};
    default:
      throw new Error('Not found: ' + path);
  }
}

function App() {
  const {params} = useContext(FrameContext);
  let content;
  // Read from the params we just parsed.
  switch (params[0].tab) {
    case 'feed':
      content = <Feed key="feed" />;
      break;
    case 'profile':
      const id = params[0].id;
      content = <Profile key={id} id={id} />;
      break;
    default:
      throw Error('Unknown');
  }
  return (
    <>
      <AppTabBar params={params[0]} />
      <br />
      {content}
    </>
  );
}

function AppTabBar({params}) {
  // Note we determine the active tab status manually rather than
  // letting the links do it. This let us be more accurate, e.g.
  // Profile isn't a part of Feed just because its URL is below /.
  return (
    <>
      <Link to="/" active={params.tab === 'feed'}>
        Feed
      </Link>{' '}
      <Link
        to="/profile/dan"
        active={params.tab === 'profile' && params.id === 'dan'}>
        Dan's Profile
      </Link>{' '}
      <Link
        to="/profile/seb"
        active={params.tab === 'profile' && params.id === 'seb'}>
        Seb's Profile
      </Link>
    </>
  );
}

function Feed() {
  return <h1>Feed</h1>;
}

function Profile({id}) {
  return (
    <>
      <h1>Profile {id}</h1>
      <Frame entry="ProfileTabs" />
    </>
  );
}

// Extracts the params for an inner tab.
// This, also, needs to be able to re-run in isolation.
function parseProfileTabsParams(reader) {
  const path = reader.consume();
  switch (path) {
    case '':
      return {tab: 'about'};
    case 'photos':
      return {tab: 'photos'};
    default:
      throw new Error('Not found: ' + path);
  }
}

function ProfileTabs() {
  const {params} = useContext(FrameContext);
  // Each consecutive parent is next in the params chain.
  // So params[0] is current, params[1] is parent, etc.
  const id = params[1].id;
  let content;
  switch (params[0].tab) {
    case 'about':
      content = <ProfileAbout key="about" id={id} />;
      break;
    case 'photos':
      content = <ProfilePhotos key="photos" id={id} />;
      break;
    default:
      throw Error('Unknown');
  }
  return (
    <>
      <ProfileTabBar id={id} params={params[0]} />
      <br />
      {content}
    </>
  );
}

function ProfileTabBar({id, params}) {
  return (
    <>
      <Link to={`/profile/${id}`} active={params.tab === 'about'}>
        About
      </Link>{' '}
      <Link to={`/profile/${id}/photos`} active={params.tab === 'photos'}>
        Photos
      </Link>
      <br />
      <br />
      <Link to={`/profile/dan/photos`}>Go to Dan's Photos</Link>
      <br />
      <br />
      <input placeholder="Tabbar local state" />
    </>
  );
}

function ProfileAbout({id}) {
  return (
    <>
      <h2>About {id}</h2>
    </>
  );
}

function ProfilePhotos({id}) {
  return <h2>Photos of {id}</h2>;
}

// Addressable entry points.
// These can be generated with a file convention.
const EntryPoints = {
  App: [App, parseAppParams],
  ProfileTabs: [ProfileTabs, parseProfileTabsParams],
};

// --- Infra (Server) ---

const UrlContext = createContext(null);
const defaultFrameContext = {
  // Child-first frame path
  // ["ProfileTabs", "App"]
  cursor: [],
  // Child-first parsed params
  // [{tab: "about"}, {tab: "profile", id: 3}]
  params: [],
  // How many URL characters have we consumed so far
  read: 0,
};
const FrameContext = createContext(defaultFrameContext);

function Link({to, active, children}) {
  const context = useContext(FrameContext);
  let {target, cursor} = context.match(removeSlashes(to));
  // Prove the data we give to the client Link is serializable.
  target = JSON.parse(JSON.stringify(target));
  cursor = JSON.parse(JSON.stringify(cursor));
  const content = <EntryPoint url={to} cursor={cursor} />;
  return (
    <ClientLink to={to} target={target} content={content} active={active}>
      {children}
    </ClientLink>
  );
}

// A Frame represents a server route handler.
// It provides server context to the Links and Frames below
// so that they can determine which Frame handles a URL.
function Frame({entry}) {
  const url = removeSlashes(useContext(UrlContext));
  const parentContext = useContext(FrameContext);
  const cursor = parentContext.cursor;
  const [childContext, target] = getFrameContext(url, parentContext, entry);
  return (
    <FrameContext.Provider value={childContext}>
      <ClientFrame target={target}>
        {/* Preloaded content for this frame */}
        <EntryPoint url={url} cursor={childContext.cursor} />
      </ClientFrame>
    </FrameContext.Provider>
  );
}

// An EntryPoint formalizes a server/client boundary.
// It proves that we can reset and replay contexts for
// subsequent navigations with only serializable data.
function EntryPoint({url, cursor}) {
  url = removeSlashes(url);
  const entry = cursor[0];
  const [Component] = EntryPoints[entry];
  return (
    <ResetContexts>
      <ReplayContexts data={JSON.stringify({url, cursor})}>
        <Component />
      </ReplayContexts>
    </ResetContexts>
  );
}

function ResetContexts({children}) {
  return (
    <UrlContext.Provider value={null}>
      <FrameContext.Provider value={defaultFrameContext}>
        {children}
      </FrameContext.Provider>
    </UrlContext.Provider>
  );
}

function ReplayContexts({data, children}) {
  // Only two things are necessary to replay Frame context
  // on the server: the URL and a cursor (list of entry points).
  const {url, cursor} = JSON.parse(data);
  let contexts = [
    {
      cursor: [],
      params: [],
      read: 0,
    },
  ];
  cursor
    .slice()
    .reverse()
    .forEach(entry => {
      // Use the list of entry points to regenerate Frame contexts.
      const parentContext = contexts[contexts.length - 1];
      const [childContext] = getFrameContext(url, parentContext, entry);
      contexts.push(childContext);
    });
  return (
    <UrlContext.Provider value={url}>
      {contexts.reduceRight(
        (acc, value) => (
          <FrameContext.Provider value={value}>{acc}</FrameContext.Provider>
        ),
        // At the very bottom, place the original children.
        children
      )}
    </UrlContext.Provider>
  );
}

function getFrameContext(url, parentContext, entry) {
  const consumedUrl = removeSlashes(url.slice(0, parentContext.read));
  const remainingUrl = removeSlashes(url.slice(parentContext.read));
  const [Component, parseParams] = EntryPoints[entry];
  // The client Frame will respond to navigations with this identifier:
  const target = consumedUrl.replace(/\//g, ':');
  // Call the parser function with a helper that lets us consume URLs:
  const reader = createUrlReader(remainingUrl);
  let params = parseParams(reader);
  let childContext = {
    cursor: [entry, ...parentContext.cursor],
    params: [params, ...parentContext.params],
    // The next Frame will handle the remaining part of the URL.
    read: parentContext.read + reader.getReadLength(),
    match(to) {
      const canHandle = ensureSlashes(to).startsWith(
        ensureSlashes(consumedUrl)
      );
      if (!canHandle) {
        // Delegate to the parent Frame.
        return parentContext.match(to);
      }
      return {
        target,
        cursor: childContext.cursor,
      };
    },
  };
  return [childContext, target];
}

// Helper to consume URL by parts and track how much has been read.
function createUrlReader(url) {
  let read = 0;
  return {
    getReadLength() {
      return read;
    },
    consume() {
      const nextSlash = url.indexOf('/', read);
      let result;
      if (nextSlash !== -1) {
        result = url.slice(read, nextSlash);
        read = nextSlash + 1;
      } else {
        result = url.slice(read);
        read = url.length;
      }
      return result;
    },
  };
}

function ensureSlashes(href) {
  if (href[0] !== '/') {
    href = '/' + href;
  }
  if (href[href.length - 1] !== '/') {
    href = href + '/';
  }
  return href;
}

function removeSlashes(href) {
  if (href[0] === '/') {
    href = href.slice(1);
  }
  if (href[href.length - 1] === '/') {
    href = href.slice(0, -1);
  }
  return href;
}

// --- Infra (Client) ---

const ClientFrameContext = createContext(null);

function ClientLink({to, target, content, active, children}) {
  const router = useContext(ClientFrameContext);
  return (
    <a
      href={to}
      onClick={e => {
        e.preventDefault();
        router.navigate(to, target, content);
      }}
      style={{
        textDecoration: active ? 'none' : '',
        color: active ? 'black' : '',
        fontWeight: active ? 'bold' : '',
      }}>
      {children}
    </a>
  );
}

function ClientFrame({children, target: ownTarget}) {
  const parentContext = useContext(ClientFrameContext);
  const [content, setContent] = useState(children);
  const [prevChildren, setPrevChildren] = useState(children);
  if (children !== prevChildren) {
    // An update to the parent Frame might carry different child frame content.
    // In that case, prefer it to what the child was already showing.
    setContent(children);
    setPrevChildren(children);
  }
  return (
    <ClientFrameContext.Provider
      value={{
        navigate(to, target, newContent) {
          const canHandle = target === ownTarget;
          if (!canHandle) {
            parentContext.navigate(to, target, newContent);
            return;
          }
          console.log('Frame "%s" now contains: "%s"', target, to);
          setContent(newContent);
          history.pushState(null, null, to);
          // TODO: How should the Back button work?
        },
      }}>
      {content}
    </ClientFrameContext.Provider>
  );
}

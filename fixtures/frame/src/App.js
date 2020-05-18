import {createContext, useState, useEffect, useContext} from 'react';

// --- Product (Server) ---

// Possible <Frame entry="???" /> values.
// We need a list because they need to be addressable from the client.
// This could be generated based on a convention, e.g. based on a filesystem.
const EntryPoints = {
  Shell,
  Feed,
  Profile,
  ProfileTabs,
};

export default function App({segments}) {
  return (
    <FrameContext.Provider
      value={{
        // Segments are basically url.split('/').
        segments: segments,
        parents: [],
      }}>
      <Frame entry="Shell" />
    </FrameContext.Provider>
  );
}

function Shell({path}) {
  // TODO: a way to parse parameters by name?
  // Currently each Frame gets depth++ so we "consume" URL segments one by one.
  const page = path.segments[path.depth];
  let pageContent;
  switch (page) {
    case undefined:
      pageContent = <Frame entry="Feed" key="feed" />;
      break;
    case 'profile':
      pageContent = <Frame entry="Profile" key="profile" />;
      break;
    default:
      throw new Error('Not found: ' + page);
  }
  return (
    <>
      <ShellTabBar />
      {pageContent}
    </>
  );
}

function ShellTabBar() {
  return (
    <>
      <Link to={[]} plainWhenActive={true}>
        Feed
      </Link>{' '}
      <Link to={['profile', 'dan', 'about']} plainWhenActive={true}>
        Dan's Profile
      </Link>{' '}
      <Link to={['profile', 'seb', 'about']} plainWhenActive={true}>
        Seb's Profile
      </Link>
    </>
  );
}

function Feed() {
  return <h1>Feed</h1>;
}

function Profile({path}) {
  const id = path.segments[path.depth];
  return (
    <div key={id}>
      <h1>Profile for {id}</h1>
      <Frame entry="ProfileTabs" />
    </div>
  );
}

function ProfileAbout({id}) {
  return <h1>About {id}</h1>;
}

function ProfilePhotos({id}) {
  return <h1>Photos of {id}</h1>;
}

function ProfileTabBar({id}) {
  return (
    <>
      {/* TODO: Relative links? */}
      <Link to={['profile', id, 'about']} plainWhenActive={true}>
        About
      </Link>{' '}
      <Link to={['profile', id, 'photos']} plainWhenActive={true}>
        Photos
      </Link>
      <br />
      <br />
      <Link to={['profile', 'dan', 'photos']}>Go to Dan's Photos</Link>
      <br />
      <br />
      <input placeholder="Tabbar local state" />
    </>
  );
}

function ProfileTabs({path}) {
  const tab = path.segments[path.depth];
  // TODO: Reading an unnamed segment above is awkward.
  const id = path.segments[path.depth - 1];
  let tabContent;
  switch (tab) {
    case 'about':
      tabContent = <ProfileAbout id={id} key="about" />;
      break;
    case 'photos':
      tabContent = <ProfilePhotos id={id} key="photos" />;
      break;
    default:
      throw new Error('Not found: ' + tab);
  }
  return (
    <>
      <ProfileTabBar id={id} />
      {tabContent}
    </>
  );
}

// --- Infra (Server) ---

const FrameContext = createContext(null);

function Link({to, children, plainWhenActive}) {
  const {matchRoute, segments} = useContext(FrameContext);
  // A match contains metadata we want to pass to the client.
  // It is essentially the target frame + what to render in it.
  const match = matchRoute(to);
  const isActive = to.join('/') === segments.join('/');
  return (
    <ClientLink
      match={match}
      to={to}
      isActive={isActive}
      plainWhenActive={plainWhenActive}>
      {children}
    </ClientLink>
  );
}

function Frame({entry}) {
  return (
    <ReplayableFrame entry={entry}>
      {(target, match) => (
        // Render prop because during the subsequent navigations,
        // we'll only render the context and jump over the content.
        <ClientFrame target={target} preloadedContent={match} />
      )}
    </ReplayableFrame>
  );
}

function ReplayableFrame({entry, children}) {
  // Get by name from the map.
  const Match = EntryPoints[entry];
  const {segments, parents, matchRoute: matchParent} = useContext(FrameContext);
  const depth = parents.length;
  const path = {segments, depth};
  // This is this frame's keypath.
  const target = segments.slice(0, depth).join(':');
  const nextParents = [...parents, entry];
  return (
    <FrameContext.Provider
      value={{
        segments: segments,
        parents: nextParents,
        matchRoute(to) {
          if (!isSubpathOf(to, path)) {
            // Can't handle this route. Ask the parent.
            return matchParent(to);
          }
          return {
            target: target,
            content: (
              // Pretend the match is really rendered on the server.
              // We need to restore the Frame contexts up to this point.
              <ReplayFrames segments={to} parents={nextParents}>
                <Match
                  path={{
                    segments: to,
                    depth: depth,
                  }}
                />
              </ReplayFrames>
            ),
          };
        },
      }}>
      {children(
        target,
        // Though unnecessary for a drill-down render, in our client-only
        // prototype we replay server contexts here too so that the client
        // state always line up and we don't lose it on first navigation.
        <ReplayFrames segments={segments} parents={nextParents}>
          <Match path={path} />
        </ReplayFrames>
      )}
    </FrameContext.Provider>
  );
}

function ReplayFrames({children, segments, parents}) {
  // Restore the parent router stack so Links can talk to it.
  let el = children;
  parents
    .slice()
    .reverse()
    .forEach(entry => {
      const inner = el;
      el = <ReplayableFrame entry={entry}>{() => inner}</ReplayableFrame>;
    });
  return (
    <FrameContext.Provider
      value={{
        parents: [],
        segments: segments,
      }}>
      {el}
    </FrameContext.Provider>
  );
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

function isSubpathOf(child, parent) {
  const childHref = ensureSlashes(child.join('/'));
  const parentHref = ensureSlashes(
    parent.segments.slice(0, parent.depth).join('/')
  );
  return childHref.indexOf(parentHref) === 0;
}

// --- Infra (Client) ---

const ClientFrameContext = createContext(null);

function ClientLink({match, to, children, isActive, plainWhenActive}) {
  const router = useContext(ClientFrameContext);
  const href = '/' + to.join('/');
  if (isActive && plainWhenActive) {
    return <b>{children}</b>;
  }
  return (
    <a
      href={href}
      onClick={e => {
        e.preventDefault();
        router.navigate(href, match);
      }}>
      {children}
    </a>
  );
}

function ClientFrame({preloadedContent, target}) {
  const parentContext = useContext(ClientFrameContext);
  const [content, setContent] = useState(preloadedContent);
  const [prevPreloadedContent, setPrevPreloadedContent] = useState(
    preloadedContent
  );
  if (preloadedContent !== prevPreloadedContent) {
    // An update to the parent Frame might carry different child frame content.
    // In that case, prefer it to what the child was already showing.
    setContent(preloadedContent);
    setPrevPreloadedContent(preloadedContent);
  }
  return (
    <ClientFrameContext.Provider
      value={{
        navigate(href, match) {
          if (match.target !== target) {
            parentContext.navigate(href, match);
            return;
          }
          setContent(match.content);
          history.pushState(null, null, href);
          // TODO: How should the Back button work?
        },
      }}>
      {content}
    </ClientFrameContext.Provider>
  );
}

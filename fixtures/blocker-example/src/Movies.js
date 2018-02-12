import React, {Fragment} from 'react';
import ReactDOM from 'react-dom';
import {createElement} from 'glamor/react';
/* @jsx createElement */
import {useCache} from './cache';

import Delay from './Delay';

import Img from './Img';

const TMDB_API_PATH = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = '762954999d09f9db6ffc6c0e6f37d509';

function Timeout({ms, fallback, children}) {
  return (
    <React.Timeout ms={ms}>
      {didTimeout =>
        didTimeout ? fallback : <div hidden={didTimeout}>{children}</div>
      }
    </React.Timeout>
  );
}

async function fetchConfig() {
  const response = await fetch(
    `${TMDB_API_PATH}/configuration?api_key=${TMDB_API_KEY}`
  );
  return await response.json();
}

async function searchMovies(query) {
  const response = await fetch(
    `${TMDB_API_PATH}/search/movie?api_key=${TMDB_API_KEY}&query=${
      query
    }&include_adult=false`
  );
  return await response.json();
}

async function fetchMovie(id) {
  const response = await fetch(
    `${TMDB_API_PATH}/movie/${id}?api_key=${TMDB_API_KEY}`
  );
  return await response.json();
}

class AsyncValue extends React.Component {
  state = {asyncValue: this.props.defaultValue};
  componentWillMount() {
    ReactDOM.unstable_deferredUpdates(() => {
      this.setState((state, props) => ({asyncValue: props.value}));
    });
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.value !== nextState.asyncValue) {
      ReactDOM.unstable_deferredUpdates(() => {
        this.setState((state, props) => ({asyncValue: props.value}));
      });
    }
  }
  render() {
    return this.props.children(this.state.asyncValue);
  }
}
AsyncValue.prototype.componentWillMount.__suppressDeprecationWarning = true;
AsyncValue.prototype.componentWillUpdate.__suppressDeprecationWarning = true;

function MasterDetail({header, search, results, details, showDetails}) {
  return (
    <div
      css={{
        margin: '0 auto',
        width: 500,
        overflow: 'hidden',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: 'min-content auto',
      }}>
      <div>{header}</div>
      <div
        css={[
          {
            width: 1000,
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '36px auto',
            gridTemplateAreas: `
                        'search  details'
                        'results details'
                  `,
            transition: 'transform 350ms ease-in-out',
            transform: 'translateX(0%)',
            overflow: 'hidden',
          },
          showDetails && {
            transform: 'translateX(-50%)',
          },
        ]}>
        <div css={{gridArea: 'search'}}>{search}</div>
        <div
          css={{
            gridArea: 'results',
            overflow: 'auto',
          }}>
          {results}
        </div>
        <div
          css={{
            gridArea: 'details',
            overflow: 'auto',
          }}>
          {details}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return 'Movie search';
}

function Search({cache, query, onQueryUpdate}) {
  return (
    <input
      onChange={event => onQueryUpdate(event.target.value)}
      value={query}
    />
  );
}

function Result({cache, result, onActiveResultUpdate, isActive}) {
  const config = cache.read('config', fetchConfig);
  const size = config.images.poster_sizes[0];
  const baseURL =
    document.location.protocol === 'https:'
      ? config.images.secure_base_url
      : config.images.base_url;
  const width = parseInt(size.replace(/\w/, ''), 10);
  const height = width / 27 * 40;
  return (
    <button
      onClick={() => onActiveResultUpdate(result)}
      css={[
        {
          background: 'transparent',
          textAlign: 'start',
          display: 'flex',
          width: 'auto',
          outline: 'none',
          border: '1px solid rgba(0,0,0,0.2)',
          cursor: 'pointer',
          padding: 0,
          ':not(:first-child)': {
            borderTop: 'none',
          },
          ':hover': {background: 'lightgray'},
          ':focus': {background: 'lightblue'},
        },
        isActive && {
          background: 'blue',
          ':focus': {background: 'blue'},
        },
      ]}>
      <div
        css={{
          display: 'flex',
          flexGrow: 1,
          position: 'relative',
        }}>
        <div css={{width, height}}>
          {result.poster_path !== null && (
            <PosterThumbnail src={`${baseURL}/${size}/${result.poster_path}`} />
          )}
        </div>
        <h2 css={{fontSize: 16}}>{result.title}</h2>
      </div>
    </button>
  );
}

function PosterThumbnail({src}) {
  return (
    <Timeout ms={1000} fallback={null}>
      <Delay id={src} ms={0} />
      <img src={src} css={{padding: 0, margin: 0}} />
    </Timeout>
  );
}

function Results({query, cache, onActiveResultUpdate, activeResult}) {
  if (query.trim() === '') {
    return 'Search for something';
  }
  const {results} = cache.read(`searchMovies:${query}`, () =>
    searchMovies(query)
  );
  return (
    <div css={{display: 'flex', flexDirection: 'column'}}>
      {// Only render the first 5. TMDB doesn't let us change the page size.
      results.slice(0, 5).map(result => {
        return (
          <Result
            key={result.id}
            cache={cache}
            result={result}
            onActiveResultUpdate={onActiveResultUpdate}
            isActive={activeResult !== null && activeResult.id === result.id}
          />
        );
      })}
    </div>
  );
}

function FullPoster({cache, movie}) {
  const path = movie.poster_path;
  if (path === null) {
    return null;
  }
  const config = cache.read('config', fetchConfig);
  const size = config.images.poster_sizes[2];
  const baseURL =
    document.location.protocol === 'https:'
      ? config.images.secure_base_url
      : config.images.base_url;
  const width = size.replace(/\w/, '');
  const src = `${baseURL}/${size}/${movie.poster_path}`;
  return <img width={width} src={src} />;
}

function MovieInfo({movie, cache, clearActiveResult}) {
  const fullResult = cache.read(`fetchMovie:${movie.id}`, () =>
    fetchMovie(movie.id)
  );
  return (
    <Fragment>
      <FullPoster cache={cache} movie={movie} />
      <h2>{movie.title}</h2>
      <div>{movie.overview}</div>
    </Fragment>
  );
}

function Details({result, clearActiveResult, cache}) {
  return (
    <Fragment>
      <div>
        <button onClick={() => clearActiveResult()}>Back</button>
      </div>
      <MovieInfo movie={result} cache={cache} />
    </Fragment>
  );
}

class Movies extends React.Component {
  state = {
    query: '',
    activeResult: null,
  };
  onQueryUpdate = query => this.setState({query});
  onActiveResultUpdate = activeResult => this.setState({activeResult});
  clearActiveResult = () => this.setState({activeResult: null});
  render() {
    const cache = this.props.cache;
    const state = this.state;
    return (
      <AsyncValue value={state} defaultValue={{query: '', activeResult: null}}>
        {asyncState => (
          <MasterDetail
            header={<Header />}
            search={
              <Search query={state.query} onQueryUpdate={this.onQueryUpdate} />
            }
            results={
              <Results
                query={asyncState.query}
                cache={cache}
                onActiveResultUpdate={this.onActiveResultUpdate}
                activeResult={state.activeResult}
              />
            }
            details={
              asyncState.activeResult && (
                <Details
                  cache={cache}
                  clearActiveResult={this.clearActiveResult}
                  result={asyncState.activeResult}
                />
              )
            }
            showDetails={asyncState.activeResult !== null}
          />
        )}
      </AsyncValue>
    );
  }
}

export default useCache(Movies);

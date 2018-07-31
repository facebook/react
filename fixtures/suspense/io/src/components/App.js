import { track } from 'interaction-tracking';
import React, { Fragment, Placeholder, PureComponent } from 'react';
import { unstable_deferredUpdates } from 'react-dom';
import { createResource } from 'simple-cache-provider';
import {cache} from '../cache';
import Spinner from './Spinner';
import MovieListPage from './MovieListPage';

const MoviePageResource = createResource(
  () => import('./MoviePage')
);

function MoviePageLoader(props) {
  const MoviePage = MoviePageResource.read(cache).default;
  return <MoviePage {...props} />;
}


// -------------------------------
// Main screen
// -------------------------------
export default class App extends PureComponent {
  state = {
    currentId: null,
    showDetail: false,
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.showDetail !== this.state.showDetail ||
      prevState.currentId !== this.state.currentId
    ) {
      window.scrollTo(0, 0);
    }
  }

  handleMovieClick = (id) => {
    track(`View movie ${id}`, () => {
      track(`Update button state`, () => {
        this.setState({
          currentId: id,
        });
      });
      track(`Show movie details`, () => {
        unstable_deferredUpdates(() => {
          this.setState({
            showDetail: true
          });
        });
      });
    });
  };

  handleBackClick = () => {
    track('Return to list', () =>
      this.setState({
        currentId: null,
        showDetail: false,
      }));
  };

  render() {
    const { currentId, showDetail } = this.state;
    return (
      <div className='App'>
        {showDetail
          ? this.renderDetail(currentId)
          : this.renderList(currentId)}
      </div>
    );
  }

  renderDetail(id) {
    return (
      <Fragment>
        <button
          className='App-back'
          onClick={this.handleBackClick}>
          {'👈'}
        </button>
        <Placeholder
          delayMs={2000}
          fallback={<Spinner size='large' />}
        >
          <MoviePageLoader id={id} />
        </Placeholder>
      </Fragment>
    );
  }

  renderList(loadingId) {
    return (
      <Placeholder
        delayMs={1500}
        fallback={<Spinner size='large' />}
      >
        <MovieListPage
          loadingId={loadingId}
          onMovieClick={this.handleMovieClick}
        />
      </Placeholder>
    )
  }
}

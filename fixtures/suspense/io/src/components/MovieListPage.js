import React, { Fragment } from 'react';
import { createResource } from 'simple-cache-provider';
import {cache} from '../cache';
import Spinner from './Spinner';
import { fetchMovieListJSON } from '../api';

const MovieListResource = createResource(
  fetchMovieListJSON
);

// --------------------------
// Movie list page
// --------------------------
//
// Top Box Office
// - 🍅 97% Black Panther
// - 🤢 58% Peter Rabbit
// - 🤢 12% Fifty Shades Freed
// --------------------------

export default function MovieListPage(props) {
  return (
    <Fragment>
      <h1 className='MovieListPage-header'>
        Top Box Office {'🍿'}
      </h1>
      <ul className='MovieListPage-list'>
        {MovieListResource.read(cache).map(movie =>
          <MovieListItem
            key={movie.id}
            {...movie}
            onClick={() =>
              props.onMovieClick(movie.id)
            }
            isLoading={
              props.loadingId &&
              movie.id === props.loadingId
            }
          />
        )}
      </ul>
    </Fragment>
  );
}

function MovieListItem(props) {
  const opacity = props.isLoading === false ? 0.5 : 1;
  return (
    <li
      className='MovieListItem'
      onClick={props.onClick}
      style={{ opacity }}
      tabIndex="0"
    >
      <div className='MovieListItem-freshness'>
        {props.fresh ? '🍅' : '🤢'}
      </div>
      <span className='MovieListItem-title'>
        {props.title}
      </span>
      <span className='MovieListItem-meta'>
        {props.rating} &middot; {props.gross}
      </span>
      <div className='MovieListItem-action'>
        {props.isLoading ? 
          <Spinner size='small' /> :
          <span className='MovieListItem-more'>
            {'👉'}
          </span>
        }
      </div>
    </li>  
  );
}

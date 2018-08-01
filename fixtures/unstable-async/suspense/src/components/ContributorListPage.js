import React, {Fragment} from 'react';
import {createResource} from 'simple-cache-provider';
import {cache} from '../cache';
import Spinner from './Spinner';
import {fetchCoreContributorListJSON} from '../api';

const ContributorListResource = createResource(fetchCoreContributorListJSON);

const ContributorListPage = ({loadingId, onUserClick}) => (
  <Fragment>
    <h1>React Core Team</h1>
    <ul
      style={{
        display: 'grid',
        gridGap: '0.5rem',
        gridTemplateColumns: 'repeat(auto-fill, 20rem)',
        padding: 0,
        margin: 0,
      }}>
      {ContributorListResource.read(cache).map(user => (
        <ContributorListItem
          key={user.id}
          onClick={() => onUserClick(user.id)}
          isLoading={loadingId && user.id === loadingId}
          user={user}
        />
      ))}
    </ul>
  </Fragment>
);

const ContributorListItem = ({isLoading, onClick, user}) => (
  <li
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      backgroundColor: 'var(--color-buttonBg)',
      border: '1px solid var(--color-buttonBorder)',
      borderRadius: '1rem',
      opacity: isLoading === false ? 0.5 : 1,
      cursor: isLoading ? 'default' : 'pointer',
    }}
    tabIndex="0">
    <div>
      <strong>{user.name}</strong>
      <div style={{marginTop: '0.5rem'}}>{user.id}</div>
    </div>
    {isLoading ? (
      <Spinner size="small" />
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="none" d="M0 0h24v24H0z" />
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </svg>
    )}
  </li>
);

export default ContributorListPage;

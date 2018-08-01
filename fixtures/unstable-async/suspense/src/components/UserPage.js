import React, {Fragment, Placeholder} from 'react';
import {createResource} from 'simple-cache-provider';
import Spinner from './Spinner';
import {cache} from '../cache';
import {fetchUserProfileJSON, fetchUserRepositoriesListJSON} from '../api';

export default function UserPage({id}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 20rem)',
        gridGap: '1rem',
        alignItems: 'start',
      }}>
      <UserDetails id={id} />
      <Placeholder delayMs={1000} fallback={<Spinner size="medium" />}>
        <Repositories id={id} />
      </Placeholder>
    </div>
  );
}

const UserDetailsResource = createResource(fetchUserProfileJSON);

function UserDetails({id}) {
  const user = UserDetailsResource.read(cache, id);
  return (
    <div
      style={{
        display: 'grid',
        gridGap: '0.5rem',
        width: '20rem',
        padding: '1rem',
        backgroundColor: 'var(--color-buttonBg)',
        border: '1px solid var(--color-buttonBorder)',
        borderRadius: '1rem',
      }}>
      <UserPicture source={user.image} />
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'var(--color-pageTextDark)',
        }}>
        {user.name}
      </div>
      <div style={{fontSize: '1.25rem'}}>{user.id}</div>
      {user.tagline !== null && <div>{user.tagline}</div>}
      <hr
        style={{
          width: '100%',
          height: '1px',
          border: 'none',
          backgroundColor: '#ddd',
        }}
      />
      {user.location && <Location location={user.location} />}
      {user.email && <Email email={user.email} />}
    </div>
  );
}

const Location = ({location}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
    }}>
    <svg
      viewBox="0 0 24 24"
      style={{
        width: '24px',
        height: '24px',
        marginRight: '0.5rem',
        fill: 'currentColor',
      }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
    {location}
  </div>
);

const Email = ({email}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
    }}>
    <svg
      viewBox="0 0 24 24"
      style={{
        width: '24px',
        height: '24px',
        marginRight: '0.5rem',
        fill: 'currentColor',
      }}>
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      <path d="M0 0h24v24H0z" fill="none" />
    </svg>
    <a href={`mailto:${email}`}>{email}</a>
  </div>
);

const ImageResource = createResource(
  src =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.src = src;
    })
);

function Img({src, ...rest}) {
  return <img src={ImageResource.read(cache, src)} {...rest} />;
}

function UserPicture({source}) {
  return (
    <Placeholder delayMs={1500} fallback={<img src={source} alt="poster" />}>
      <Img
        src={source}
        alt="profile picture"
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '0.5rem',
        }}
      />
    </Placeholder>
  );
}

const UserRepositoriesResource = createResource(fetchUserRepositoriesListJSON);

function Repositories({id}) {
  const reviews = UserRepositoriesResource.read(cache, id);
  return (
    <ul
      style={{
        display: 'grid',
        gridGap: '1rem',
        padding: 0,
        margin: 0,
      }}>
      {reviews.map(review => <Repository key={review.id} {...review} />)}
    </ul>
  );
}

function Repository({description, name, url}) {
  return (
    <li
      style={{
        display: 'grid',
        gridGap: '0.5rem',
        padding: '1rem',
        backgroundColor: 'var(--color-buttonBg)',
        border: '1px solid var(--color-buttonBorder)',
        borderRadius: '1rem',
      }}>
      <strong>
        <a href={url}>{name}</a>
      </strong>
      <div>{description}</div>
    </li>
  );
}

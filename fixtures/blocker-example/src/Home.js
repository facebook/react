import React, {Fragment} from 'react';
import {Link} from 'react-router-dom';

function Story() {
  return (
    <ul>
      <li>
        <Link to="/movies">Movies</Link>
      </li>
    </ul>
  );
}

function Introduction() {
  return (
    <Fragment>
      <Story />
    </Fragment>
  );
}

export default Introduction;

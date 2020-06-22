'use strict';

import React from 'react';
import { render, screen } from '@testing-library/react';
import ContextMenuItem from '../ContextMenuItem';

test('renders learn react link', () => {
  render(<ContextMenuItem />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

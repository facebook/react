/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import React from 'react';
import type {NextPage} from 'next';
import Head from 'next/head';
import {SnackbarProvider} from 'notistack';
import {Editor, Header, StoreProvider} from '../components';
import MessageSnackbar from '../components/Message';

// Add type for process if missing
declare var process: {
  env: {
    NODE_ENV: string;
  };
};

const Home: NextPage = () => {
  return (
    <StoreProvider>
      <div className="flex flex-col w-screen h-screen font-light">
        <Head>
          <title>
            {typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
              ? '[DEV] React Compiler Playground'
              : 'React Compiler Playground'}
          </title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"></meta>
          <link rel="icon" href="/favicon.ico" />
          <link rel="manifest" href="/site.webmanifest" />
          <link
            rel="preload"
            href="/fonts/Source-Code-Pro-Regular.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            href="/fonts/Optimistic_Display_W_Lt.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        </Head>
        <SnackbarProvider
          preventDuplicate
          maxSnack={10}
          Components={{message: MessageSnackbar}}>
          <Header />
          <Editor />
        </SnackbarProvider>
      </div>
    </StoreProvider>
  );
};

export default Home;

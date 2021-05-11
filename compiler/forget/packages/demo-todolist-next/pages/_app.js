import "../styles/normalize.css";
import "../styles/styles.css";

// Monkeypatch useMemoCache
import React from "react";
import { useMemoCache } from "../utils/useMemoCache";
React.useMemoCache = useMemoCache;

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;

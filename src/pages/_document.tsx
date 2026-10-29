// pages/_document.tsx
//
// No getInitialProps here: fetching data in the document would run on every
// server render (adding an API round trip to each one) and inline it into
// every page's HTML. Search data is loaded lazily by useSearchIndex instead.

import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

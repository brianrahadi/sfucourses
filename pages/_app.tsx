import React, { FC } from "react";
import { HeaderNav, Footer, Helmet } from "@components";
import { useRouter } from "next/router";
import "../styles/main.scss";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";

const MyApp: FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  return (
    <>
      <Helmet pageTitle={router.pathname} />
      <HeaderNav />
      <Component key={router.asPath}>
        {...pageProps}
        <Analytics />
      </Component>
      <Footer />
    </>
  );
};

export default MyApp;

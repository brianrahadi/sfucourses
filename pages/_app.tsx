import React, { FC } from "react";
import { HeaderNav, Footer, Helmet } from "@components";
import { useRouter } from "next/router";
import "../styles/main.scss";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const MyApp: FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  return (
    <>
      <Helmet pageTitle={router.pathname} />
      <HeaderNav />
      <Component {...pageProps} key={router.asPath} />
      <Footer />
      <Analytics />
      <SpeedInsights />
    </>
  );
};

export default MyApp;

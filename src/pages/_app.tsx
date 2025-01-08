import React, { FC } from "react";
import { HeaderNav, Footer, Helmet } from "@components";
import { useRouter } from "next/router";
import "../styles/main.scss";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const MyApp: FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Helmet pageTitle={router.pathname} />
      <HeaderNav />
      <Component {...pageProps} key={router.asPath} />
      <Footer />
      <Analytics />
      <SpeedInsights />
    </QueryClientProvider>
  );
};

export default MyApp;

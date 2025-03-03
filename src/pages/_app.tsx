import React, { FC } from "react";
import { HeaderNav, Footer, Helmet } from "@components";
import { useRouter } from "next/router";
import "../styles/main.scss";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
} from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { PopoverProvider } from "@context/PopoverContext";

const MyApp: FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  // Create a new query client for each request to avoid sharing state between users
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 60 * 1000, // 1 hour
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <PopoverProvider>
          <Helmet pageTitle={router.pathname} />
          <HeaderNav />
          <Component {...pageProps} key={router.asPath} />
          <Footer />
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </PopoverProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
};

export default MyApp;

// pages/_app.tsx - Corrected version

import React, { FC, useEffect } from "react";
import {
  HeaderNav,
  Footer,
  Helmet,
  HelpDialog,
  FeedbackForm,
} from "@components";

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

import { FormspreeProvider } from "@formspree/react";

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

  // Keyboard shortcuts for navigation
  useEffect(() => {
    let gPressed = false;
    let gTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "g") {
        e.preventDefault();
        gPressed = true;
        // Reset g state after 1 second if no number is pressed
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 1000);
      } else if (gPressed && /^[0-4]$/.test(e.key)) {
        e.preventDefault();
        clearTimeout(gTimeout);
        gPressed = false;

        const routes = {
          "0": "/",
          "1": "/explore",
          "2": "/schedule",
          "3": "/faq",
        };

        const route = routes[e.key as keyof typeof routes];
        if (route) {
          router.push(route);
        }
      } else if (gPressed) {
        // Reset if any other key is pressed after g
        gPressed = false;
        clearTimeout(gTimeout);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimeout);
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <FormspreeProvider project="2913445847263870687">
          <Helmet pageTitle={router.pathname} />
          <HeaderNav />
          <Component {...pageProps} key={router.asPath} />
          <Footer />
          <Toaster />
          <Analytics />
          <SpeedInsights />
          <HelpDialog />
          <FeedbackForm />
        </FormspreeProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
};

export default MyApp;

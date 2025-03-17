import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useSearchParams,
} from "react-router";
import { TranslationProvider } from "@mewhhaha/speakeasy";
import "./tailwind.css";
import { Suspense } from "react";
import { source } from "./languages/languages";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Speakeasy Example</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const [searchParams] = useSearchParams();
  const lng = searchParams.get("lng");

  return (
    <Suspense>
      <TranslationProvider source={source} defaultLocale={lng ?? "en"}>
        <Outlet />
      </TranslationProvider>
    </Suspense>
  );
}

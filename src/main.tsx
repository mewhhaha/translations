import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { TranslationProvider } from "./languages/context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense>
      <TranslationProvider defaultLocale="en">
        <App />
      </TranslationProvider>
    </Suspense>
  </StrictMode>,
);

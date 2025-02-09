import { use, useCallback, useState, useTransition } from "react";
import { Context, TFunction } from "./use-translation";

const source = import.meta.glob("./*.json", { eager: false }) as Record<
  string,
  () => Promise<{ default: Record<string, string> }>
>;

const pull = async (locale: string) => {
  const r = await source[`./${getLanguage(locale)}.json`]();
  return r.default;
};

const getLanguage = (locale: string) => {
  return locale.split(/[^a-z]+/)[0]?.toLocaleLowerCase();
};

export const TranslationProvider = ({
  children,
  defaultLocale: defaultLocaleOrLanguage,
}: {
  children: React.ReactNode;
  defaultLocale: string;
}) => {
  const [, startTransition] = useTransition();
  const defaultLanguage = getLanguage(defaultLocaleOrLanguage);

  const [language, setLanguage] = useState(defaultLocaleOrLanguage);
  const [state, setState] = useState<
    Record<string, Promise<Record<string, string>>>
  >(() => ({
    [defaultLanguage]: pull(defaultLanguage),
  }));

  const setLocale = useCallback((locale: string) => {
    const language = getLanguage(locale);
    startTransition(() => {
      console.debug("Changing language", locale);
      setState((prev) => {
        if (prev[language] !== undefined) {
          return prev;
        }
        return {
          ...prev,
          [language]: pull(language),
        };
      });
      setLanguage(language);
    });
  }, []);

  const translations = use(state[language]);

  const t = useCallback<TFunction>(
    (key: string, args?: Record<string, string | number>) => {
      let translation = translations[key] ?? key;

      if (args && "count" in args) {
        const count = args.count;

        console.log(translation, count);

        let variant: string | undefined;
        if (count === 0) {
          variant = translations[`${key}_zero`];
        } else if (count === 1) {
          variant = translations[`${key}_one`];
        } else if (count === 2) {
          variant = translations[`${key}_two`];
        } else if (count === 3) {
          variant = translations[`${key}_few`];
        } else if (count === 4) {
          variant = translations[`${key}_many`];
        } else {
          variant = translations[`${key}_other`];
        }

        if (variant) {
          translation = variant;
        } else if (count !== 1) {
          translation = translations[`${key}_other`] ?? translation;
        }

        translation = translation.replace("{{count}}", count.toString());
      }

      for (const key in args) {
        if (key === "count") {
          continue;
        }
        if (typeof args[key] === "string") {
          translation = translation.replace(`{{${key}}}`, args[key]);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return translation as any;
    },
    [translations],
  );
  return <Context value={{ language, setLocale, t }}>{children}</Context>;
};

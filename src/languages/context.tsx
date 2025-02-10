import { use, useCallback, useMemo, useState, useTransition } from "react";
import { Context, TFunction } from "./use-translation";

const source = import.meta.glob("./*.json", { eager: false }) as Record<
  string,
  () => Promise<{ default: Record<string, string> }>
>;

const pull = async (language: string) => {
  console.log("Pulling", language);
  const r = await source[`./${language}.json`]();
  return r.default;
};

const getLanguage = (locale: string) => {
  return locale.split(/[^a-z]+/)[0]?.toLocaleLowerCase();
};

const cache: Record<string, Promise<Record<string, string>>> = {};

export const TranslationProvider = ({
  children,
  defaultLocale,
}: {
  children: React.ReactNode;
  defaultLocale: string;
}) => {
  const [, startTransition] = useTransition();

  const [locale, setInternalLocale] = useState(
    Intl.getCanonicalLocales(defaultLocale)[0],
  );

  console.log(locale);
  const language = getLanguage(locale);

  if (cache[language] === undefined) {
    console.log(cache[language]);
    cache[language] = pull(language);
  }

  const setLocale = useCallback((locale: string) => {
    startTransition(() => {
      console.debug(
        "Changing language to",
        Intl.getCanonicalLocales(locale)[0],
      );
      setInternalLocale(Intl.getCanonicalLocales(locale)[0]);
    });
  }, []);

  const translations = use(cache[language]);

  const t = useCallback<TFunction>(
    (key: string, args?: Record<string, string | number>) => {
      let translation = translations[key] ?? key;

      if (args && "count" in args) {
        const count = args.count;

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
      }

      translation = translation.replaceAll(/{{[^}]+}}/g, (match) => {
        return args?.[match.slice(2, -2)]?.toString() ?? match;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return translation as any;
    },
    [translations],
  );
  return (
    <Context
      value={useMemo(
        () => ({ language, locale, setLocale, t }),
        [language, locale, setLocale, t],
      )}
    >
      {children}
    </Context>
  );
};

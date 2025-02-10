import { use, useCallback, useMemo, useState, useTransition } from "react";
import { Context, TFunction } from "./use-translation";

const source = import.meta.glob("./*.json", { eager: false }) as Record<
  string,
  () => Promise<{ default: Record<string, string> }>
>;

const pull = async (language: string) => {
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

  const language = getLanguage(locale);

  if (cache[language] === undefined) {
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

  const t = useMemo<TFunction>(() => {
    const pluralRules = new Intl.PluralRules(locale);

    return (key: string, args?: Record<string, string | number>) => {
      let translation = translations[key] ?? key;

      if (args && "count" in args && typeof args.count === "number") {
        const count = args.count;

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules
        const select = pluralRules.select(count);

        translation = translations[`${key}_${select}`] ?? translation;
      }

      translation = translation.replaceAll(/{{[^}]+}}/g, (match) => {
        return args?.[match.slice(2, -2)]?.toString() ?? match;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return translation as any;
    };
  }, [locale, translations]);
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

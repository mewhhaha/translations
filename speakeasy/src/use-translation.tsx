import {
  createContext,
  use,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  JSX,
  ReactNode,
} from "react";

const s = Symbol();

const Context = createContext<
  | {
      locale: string;
      language: string;
      setLocale: (locale: string) => void;
      t: TFunction;
      transition: boolean;
    }
  | typeof s
>(s);

/**
 * The expected resulting value for unknown is Record<string, string> or { default: Record<string, string> }
 */
export type Source = Record<string, unknown | (() => Promise<unknown>)>;

const pull = async (source: Source | undefined, language: string) => {
  if (source === undefined) {
    return {};
  }

  const value = source[`./${language}.json`];
  const resolved = typeof value !== "function" ? value : await value();
  if (!resolved) {
    return {};
  }

  if ("default" in resolved) {
    return resolved.default as Record<string, string>;
  }
  return resolved as Record<string, string>;
};

const caches: Record<
  string,
  Record<string, Promise<Record<string, string>>>
> = {};

// Assume the language is en-US, en-GB, etc.
// and then extract the language part.
const getLanguage = (locale: string) => {
  return locale.split(/[^a-z]+/)[0]?.toLocaleLowerCase();
};

type TranslationProviderProps = {
  children: ReactNode;
  source?: Source;
  namespace?: string;
  defaultLocale: string;
  fallback?: Record<string, string>;
};

/** TranslationProvider will throw to Suspense if the first language isn't loaded yet,
 * however any subsequent language changes will be done in a transition.
 */
export const TranslationProvider = ({
  children,
  source,
  namespace = "translation",
  defaultLocale,
  fallback,
}: TranslationProviderProps): JSX.Element => {
  const [transition, startTransition] = useTransition();

  const [locale, setInternalLocale] = useState(
    Intl.getCanonicalLocales(defaultLocale)[0],
  );

  const language = getLanguage(locale);

  if (caches[namespace] === undefined) {
    caches[namespace] = {};
  }

  const cache = caches[namespace];

  if (cache[language] === undefined) {
    cache[language] = pull(source, language);
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
      let translation = translations[key] ?? fallback?.[key] ?? key;

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
        () => ({ language, locale, setLocale, t, transition }),
        [language, locale, setLocale, t, transition],
      )}
    >
      {children}
    </Context>
  );
};

export const useTranslation = (): {
  locale: string;
  language: string;
  setLocale: (locale: string) => void;
  t: TFunction;
  transition: boolean;
} => {
  const value = useContext(Context);
  if (value === s) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return value;
};

export interface Translation {
  default: Record<string, string>;
}

export interface TFunction {
  <Key extends string>(
    key: Key extends ValidKey<Translation["default"]>
      ? Key
      : NoInfer<
          Extract<ValidKey<Translation["default"]>, `${string}${Key}${string}`>
        >,
    ...args: Interpolated<Key> extends never
      ? []
      : [
          values: {
            [k in Interpolated<Key>]: [k] extends ["count"] ? number : string;
          },
        ]
  ): Key;
}

type ValidKey<t extends Record<string, string>> = Exclude<
  keyof t,
  | `${string}_one`
  | `${string}_zero`
  | `${string}_two`
  | `${string}_few`
  | `${string}_many`
  | `${string}_other`
  | number
  | symbol
>;

type Interpolated<T extends string> =
  T extends `${string}{{${infer R}}}${infer rest}`
    ? R | Interpolated<rest>
    : never;

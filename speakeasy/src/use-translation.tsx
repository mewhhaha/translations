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
export type Source = (language: string) => Promise<unknown>;

const pull = async (
  source: Source | undefined,
  language: string,
): Promise<Record<string, string>> => {
  if (source === undefined) {
    return {};
  }

  const value = await source(language);
  if (!value) {
    return {};
  }
  return value as Record<string, string>;
};

const cache: Record<string, Promise<Record<string, string>>> = {};

// Assume the language is en-US, en-GB, etc.
// and then extract the language part.
const getLanguage = (locale: string) => {
  return locale.split(/[^a-z]+/)[0]?.toLocaleLowerCase();
};

type TranslationProviderProps = {
  children: ReactNode;
  source?: Source;
  defaultLocale: string;
};

/** TranslationProvider will throw to Suspense if the first language isn't loaded yet,
 * however any subsequent language changes will be done in a transition.
 */
export const TranslationProvider = ({
  children,
  source,
  defaultLocale,
}: TranslationProviderProps): JSX.Element => {
  const [transition, startTransition] = useTransition();

  const [locale, setInternalLocale] = useState(
    Intl.getCanonicalLocales(defaultLocale)[0],
  );

  const language = getLanguage(locale);

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
    const cardinalRules = new Intl.PluralRules(locale);
    const ordinalRules = new Intl.PluralRules(locale, { type: "ordinal" });

    return (key: string, args?: Record<string, string | number>) => {
      let translation = translations[key] ?? key;

      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules

      // Count by cardinal
      if (args && "count" in args && typeof args.count === "number") {
        const select = cardinalRules.select(args.count);
        translation = translations[`${key}_${select}`] ?? translation;
      }

      // Count by ordinal
      if (
        args &&
        "count_ordinal" in args &&
        typeof args.count_ordinal === "number"
      ) {
        const select = ordinalRules.select(args.count_ordinal);
        translation = translations[`${key}_ordinal_${select}`] ?? translation;
      }

      // Count by range
      if (
        args &&
        "count_from" in args &&
        "count_to" in args &&
        typeof args.count_from === "number" &&
        typeof args.count_to === "number"
      ) {
        const select = cardinalRules.selectRange(
          args.count_from,
          args.count_to,
        );
        translation = translations[`${key}_range_${select}`] ?? translation;
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
  // override the "default" key with your translation
  [key: string]: never;
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
            [k in Interpolated<Key>]: [k] extends
              | ["count"]
              | ["count_cardinal"]
              | ["count_from"]
              | ["count_to"]
              ? number
              : string;
          },
        ]
  ): Key;
}

type ValidKey<t extends Record<string, string>> = Exclude<
  keyof t,
  | `${string}_zero`
  | `${string}_one`
  | `${string}_two`
  | `${string}_few`
  | `${string}_many`
  | `${string}_other`
  | `${string}_ordinal_zero`
  | `${string}_ordinal_one`
  | `${string}_ordinal_two`
  | `${string}_ordinal_few`
  | `${string}_ordinal_many`
  | `${string}_ordinal_other`
  | `${string}_range_zero`
  | `${string}_range_one`
  | `${string}_range_two`
  | `${string}_range_few`
  | `${string}_range_many`
  | `${string}_range_other`
  | number
  | symbol
>;

type Interpolated<T extends string> =
  T extends `${string}{{${infer R}}}${infer rest}`
    ? R | Interpolated<rest>
    : never;

// I don't know why this type doesn't exist
declare global {
  namespace Intl {
    interface PluralRules {
      selectRange(start: number, end: number): Intl.LDMLPluralRule;
    }
  }
}

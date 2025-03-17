import { createContext, use, useContext, useMemo, JSX, ReactNode } from "react";

const s = Symbol();

const Context = createContext<
  | {
      // The canonical locale of the locale that you passed in
      locale: string;
      // The language that we are currently using (using the canonical locale)
      language: string;
      // The translation function
      t: TFunction;
    }
  | typeof s
>(s);

/**
 * The expected resulting value for unknown is Record<string, string> or { default: Record<string, string> }
 */
export type Source = (language: string) => Promise<unknown>;

const pull = async (source: Source | undefined, language: string) => {
  const value = (await source?.(language)) ?? {};
  return value as Record<string, string>;
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
  locale: string;
};

/** TranslationProvider will throw to Suspense if the first language isn't loaded yet,
 * however any subsequent language changes will be done in a transition.
 */
export const TranslationProvider = ({
  children,
  source,
  namespace = "translation",
  locale,
}: TranslationProviderProps): JSX.Element => {
  const canonicalLocale = Intl.getCanonicalLocales(locale)[0];
  const language = getLanguage(canonicalLocale);

  if (caches[namespace] === undefined) {
    caches[namespace] = {};
  }

  const cache = caches[namespace];

  if (cache[language] === undefined) {
    cache[language] = pull(source, language);
  }

  const translations = use(cache[language]);

  const t = useMemo<TFunction>(() => {
    const cardinalRules = new Intl.PluralRules(canonicalLocale);
    const ordinalRules = new Intl.PluralRules(canonicalLocale, {
      type: "ordinal",
    });

    return (key: string, args?: Record<string, string | number>) => {
      let translation = translations[key] ?? key;

      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules

      // Count by cardinal
      if (typeof args?.["count"] === "number") {
        const select = cardinalRules.select(args.count);
        translation = translations[`${key}_${select}`] ?? translation;
      }

      // Count by ordinal
      if (typeof args?.["count_ordinal"] === "number") {
        const select = ordinalRules.select(args.count_ordinal);
        translation = translations[`${key}_ordinal_${select}`] ?? translation;
      }

      // Count by range
      if (
        typeof args?.["count_from"] === "number" &&
        typeof args?.["count_to"] === "number"
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
      value={useMemo(() => ({ language, locale, t }), [language, locale, t])}
    >
      {children}
    </Context>
  );
};

export const useTranslation = (): {
  locale: string;
  language: string;
  t: TFunction;
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
              | ["count_ordinal"]
              | ["count_from"]
              | ["count_to"]
              ? number
              : string;
          },
        ]
  ): Key;
}

type PluralRule = "zero" | "one" | "two" | "few" | "many" | "other";

type ValidKey<t extends Record<string, string>> = Exclude<
  keyof t,
  number | symbol
> extends infer x
  ? // Check more specific plural rules first, so that _zero doesn't accidentally match _range_zero for example
    x extends `${infer specific}_${"ordinal" | "range"}_${PluralRule}`
    ? specific extends `${infer count}_${PluralRule}`
      ? count
      : specific
    : x
  : never;

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

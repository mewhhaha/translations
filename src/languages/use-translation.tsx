import { createContext, useContext } from "react";
import type en from "./en.json";

const s = Symbol();

export const Context = createContext<
  | {
      language: string;
      setLocale: (locale: string) => void;
      t: TFunction;
    }
  | typeof s
>(s);

export const useTranslation = () => {
  const value = useContext(Context);
  if (value === s) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return value;
};

export interface TFunction {
  <Key extends string>(
    key: NoInfer<Extract<ValidKey<typeof en>, `${Key}${string}`>>,
    args?: Record<string, string | number>,
  ): Key;
  <Key extends ValidKey<typeof en>>(
    key: Key,
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

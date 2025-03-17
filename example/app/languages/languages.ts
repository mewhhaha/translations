import en from "./en.json";

declare module "@mewhhaha/speakeasy" {
  interface Translation {
    default: typeof en;
  }
}

export const fallback = en;

const glob = import.meta.glob("./*.json", { import: "default" });

export const source = (language: string) => {
  return glob[`./${language}.json`]?.();
};

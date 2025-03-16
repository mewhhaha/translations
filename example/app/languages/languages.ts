import en from "./en.json";

export const fallback = en;

const glob = import.meta.glob("./*.json");

export const source = (language: string) => {
  return glob[`./${language}.json`]?.();
};

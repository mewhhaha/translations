# Translations

This is a simple translation library for React. It's mainly to be used with natural language keys in a completely flat structure. A reason for why the keys are written using natural language is because:

- Makes content readable in the jsx
- Use the keys to type the interpolated values
- Use the keys as fallbacks if we are missing a translation

```json
// en.json
{
  "Hello there, friend. How are you?": "Hello there, friend. How are you?"
}
```

```json
// sv.json
{
  "Hello there, friend. How are you?": "Hallå där, vän. Hur är det?"
}
```

## Usage

Firstly, keep your translations in some directory

```fs
- languages/
  - en.json
  - sv.json
  - languages.ts
- app.tsx
- main.tsx
```

Secondly, set up your types by overloading the interface and export the source to your language files.

```ts
// languages.ts
import en from "./en.json";

declare module "@mewhhaha/speakeasy" {
  interface Translation {
    default: typeof en;
  }
}

const glob = import.meta.glob("./*.json", { import: "default" });

export const source = (language: string) => {
  return glob[`./${language}.json`]?.();
};
```

Thirdly, set up the `TranslationProvider` and pass in the source.

```tsx
// main.tsx
import { render } from "react-dom";
import { TranslationProvider } from "@mewhhaha/speakeasy";
import { App } from "./app";
import { source } from "./languages";

const root = document.getElementById("root")!;

render(
  <TranslationProvider source={source} locale="en">
    <App />
  </TranslationProvider>,
  root,
);
```

And then use the `useTranslation` hook to get your translations.

```tsx
// app.tsx
export const App = () => {
  const { t /** , language, locale */ } = useTranslation();

  return (
    <span className="text-2xl font-bold">
      {t("{{ordinal}} of {{month}}", {
        ordinal: 1,
        month: "April",
      })}
    </span>
  );
};
```

## Pluralization

There's support for pluralization rules (count, count_ordinal, count_from, count_to) according to the `Intl.PluralRules` of the given locale and other interpolated values. A more specific rule will be applied if found, otherwise it will use the default string. The `count` value is by default cardinal but you can choose to use ordinal by using `count_ordinal`. For those languages that have different words based on ranges it's also possible to use `count_start` and `count_end`.

Suffix the string with `_zero`, `_one`, `_two`, `_few`, `_many`, `_other` to specify the pluralization rule.

For ordinal rules, suffix the string with `_ordinal_zero`, `_ordinal_one`, `_ordinal_two`, `_ordinal_few`, `_ordinal_many`, `_ordinal_other`.

For range rules, suffix the string with `_range_zero`, `_range_one`, `_range_two`, `_range_few`, `_range_many`, `_range_other`.

```json
// Simple pluralization
{
  "{{count}} cat_one": "{{count}} cat", // 1 cat
  "{{count}} cat": "{{count}} cats", // 2 cats, using the default for the rest of the cases
  "{{count_ordinal}} of April_one": "{{count_ordinal}}st of April" // 1st of April
}
```

```json
// Poland mentioned :shrug:
{
  "{{count_from}}-{{count_to}} cat_range_few": "{{count_from}}-{{count_to}} koty", // 102-104 koty
  "{{count_from}}-{{count_to}} cat_range_many": "{{count_from}}-{{count_to}} kotów" // 102-105 kotów
}
```

## Optimization

`vite` does named and default exports for json files by default, so we can disable that for smaller translation payloads.

```ts
export default defineConfig({
  json: {
    namedExports: false,
  },
});
```

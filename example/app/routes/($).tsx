import { useState } from "react";
import { useTranslation } from "@mewhhaha/speakeasy";
import { useSearchParams } from "react-router";

export default function Home() {
  const [formData, setFormData] = useState(new FormData());
  const { t, setLocale, transition } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const lng = searchParams.get("lng");

  return (
    <div dir={lng === "ar" ? "rtl" : "ltr"}>
      <header>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const lng = formData.get("language")?.toString();
            if (lng) {
              setLocale(lng);
              setSearchParams({ lng });
            }
          }}
        >
          {t("Select language")}
          <fieldset name="language" className="flex gap-1">
            <label>
              <input
                type="radio"
                name="language"
                value="en"
                defaultChecked={lng === "en"}
              ></input>
              en{" "}
            </label>
            <label>
              <input
                type="radio"
                name="language"
                value="sv"
                defaultChecked={lng === "sv"}
              ></input>
              sv{" "}
            </label>
            <label>
              <input
                type="radio"
                name="language"
                value="jp"
                defaultChecked={lng === "jp"}
              ></input>
              jp{" "}
            </label>
            <label>
              <input
                type="radio"
                name="language"
                value="pl"
                defaultChecked={lng === "pl"}
              ></input>
              pl{" "}
            </label>
            <label>
              <input
                type="radio"
                name="language"
                value="ar"
                defaultChecked={lng === "ar"}
              ></input>
              ar{" "}
            </label>
          </fieldset>
          <button
            data-transition={transition || undefined}
            className="px-4 py-2 cursor-pointer rounded-md bg-blue-500 text-white data-transition:bg-blue-600"
          >
            {t("Change language")}
          </button>
        </form>
      </header>
      <main className="p-4">
        <form
          className="flex flex-col gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            setFormData(formData);
          }}
        >
          <div className="grid grid-cols-[auto_1fr] gap-1">
            <label className="grid grid-cols-subgrid col-span-2">
              <span>{t("Name")} </span>
              <input
                className="border-2 border-gray-300 rounded-md"
                type="text"
                name="name"
              />
            </label>
            <br />
            <label className="grid grid-cols-subgrid col-span-2">
              <span>{t("Age")} </span>
              <input
                className="border-2 border-gray-300 rounded-md"
                type="number"
                name="age"
              />
            </label>
            <label className="grid grid-cols-subgrid col-span-2">
              <span>{t("Cats")} </span>
              <input
                type="range"
                name="cats_to"
                list="markers"
                max={10}
                min={0}
              />
              <datalist id="markers">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </datalist>
            </label>
          </div>
          <br />
          <button
            className="px-4 py-2 cursor-pointer rounded-md bg-blue-500 text-white"
            type="submit"
          >
            {t("Save")}
          </button>
        </form>
        <dl>
          <dt>{t("Name")}</dt>
          <dd>
            {t("My name is {{name}}", {
              name: formData.get("name")?.toString() ?? "-",
            })}
          </dd>
          <dt>{t("Age")}</dt>
          <dd>
            {t("I am {{count}} years old", {
              count: parseInt(formData.get("age")?.toString() || "0"),
            })}
          </dd>
          <dt>{t("Cats")}</dt>
          <dd>
            {t("There are {{count_from}}-{{count_to}} cats", {
              count_from: 0,
              count_to: parseInt(formData.get("cats_to")?.toString() || "0"),
            })}
          </dd>
        </dl>
      </main>
    </div>
  );
}

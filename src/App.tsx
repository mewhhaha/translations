import { useState } from "react";
import "./App.css";
import { useTranslation } from "./languages/use-translation";

function App() {
  const [formData, setFormData] = useState(new FormData());
  const { t, setLocale } = useTranslation();

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const lng = formData.get("language")?.toString();
          if (lng) {
            setLocale(lng);
          }
        }}
      >
        Select language
        <fieldset>
          <label>
            <input
              type="radio"
              name="language"
              value="en"
              defaultChecked={true}
            ></input>
            en{" "}
          </label>
          <label>
            <input type="radio" name="language" value="sv"></input>
            sv{" "}
          </label>
          <label>
            <input type="radio" name="language" value="jp"></input>
            jp{" "}
          </label>
        </fieldset>
        <button>Change language</button>
      </form>
      <main>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            setFormData(formData);
          }}
        >
          <label>
            {t("Name")} <input type="text" name="name" />
          </label>
          <br />
          <label>
            {t("Age")} <input type="number" name="age" />
          </label>
          <br />
          <button type="submit">{t("Save")}</button>
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
        </dl>
      </main>
    </>
  );
}

export default App;

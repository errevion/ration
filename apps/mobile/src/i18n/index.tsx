import type { Locale } from "@ration/types";
import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import { en } from "./en";
import { id } from "./id";

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationPath = NestedKeyOf<typeof en>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  t: (path: TranslationPath, params?: Record<string, string | number>) => string;
}

const dictionaries = { en, id };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const value = useMemo<I18nContextValue>(() => {
    function t(path: TranslationPath, params?: Record<string, string | number>): string {
      const segments = path.split(".");
      let current: unknown = dictionaries[locale];

      for (const segment of segments) {
        if (current && typeof current === "object" && segment in current) {
          current = (current as Record<string, unknown>)[segment];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current !== "string") {
        return path;
      }

      if (!params) {
        return current;
      }

      return Object.entries(params).reduce<string>((acc, [key, val]) => {
        return acc.replace(new RegExp(`{${key}}`, "g"), String(val));
      }, current);
    }

    return { locale, setLocale, t };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

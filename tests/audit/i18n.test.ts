import { describe, expect, it } from "vitest";
import { en as mobileEn } from "../../apps/mobile/src/i18n/en.js";
import { id as mobileId } from "../../apps/mobile/src/i18n/id.js";
import { en as webEn } from "../../apps/web/src/i18n/en.js";
import { id as webId } from "../../apps/web/src/i18n/id.js";

function getLeafKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getLeafKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe("Domain Audit: Internationalization & Translation Parity", () => {
  it("enforces 100% key parity between mobile EN and ID dictionaries", () => {
    const enKeys = getLeafKeys(mobileEn);
    const idKeys = getLeafKeys(mobileId);
    expect(enKeys).toEqual(idKeys);
  });

  it("enforces 100% key parity between web EN and ID dictionaries", () => {
    const enKeys = getLeafKeys(webEn);
    const idKeys = getLeafKeys(webId);
    expect(enKeys).toEqual(idKeys);
  });

  it("ensures no empty translation strings in mobile dictionaries", () => {
    const enKeys = getLeafKeys(mobileEn);
    for (const key of enKeys) {
      const parts = key.split(".");
      let valEn: unknown = mobileEn;
      let valId: unknown = mobileId;
      for (const part of parts) {
        valEn = (valEn as Record<string, unknown>)[part];
        valId = (valId as Record<string, unknown>)[part];
      }
      expect(typeof valEn).toBe("string");
      expect((valEn as string).trim().length).toBeGreaterThan(0);
      expect(typeof valId).toBe("string");
      expect((valId as string).trim().length).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect } from "vitest";
import { pick, t, dir } from "@/lib/i18n";

describe("dir()", () => {
  it("maps ur → rtl and en → ltr", () => {
    expect(dir("ur")).toBe("rtl");
    expect(dir("en")).toBe("ltr");
  });
});

describe("pick()", () => {
  it("returns the language's value", () => {
    expect(pick("ur", "English", "اردو")).toBe("اردو");
    expect(pick("en", "English", "اردو")).toBe("English");
  });
  it("falls back to the other language when one is empty", () => {
    expect(pick("ur", "English", "")).toBe("English"); // no Urdu → show English
    expect(pick("en", "", "اردو")).toBe("اردو"); // no English → show Urdu
  });
});

describe("t()", () => {
  it("translates known keys per language", () => {
    expect(t("en", "nav.home")).toBe("Home");
    expect(t("ur", "nav.home")).toBe("ہوم");
  });
  it("falls back to English then the raw key for missing translations", () => {
    // @ts-expect-error — intentionally an unknown key
    expect(t("ur", "does.not.exist")).toBe("does.not.exist");
  });
});

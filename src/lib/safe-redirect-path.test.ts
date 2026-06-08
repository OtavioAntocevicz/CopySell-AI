import { describe, expect, it } from "vitest";
import { safeInternalRedirectPath } from "./safe-redirect-path";

describe("safeInternalRedirectPath", () => {
  it("aceita paths internos validos", () => {
    expect(safeInternalRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalRedirectPath("/login/reset")).toBe("/login/reset");
    expect(safeInternalRedirectPath("/admin/users")).toBe("/admin/users");
  });

  it("rejeita URLs externas e protocol-relative", () => {
    expect(safeInternalRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeInternalRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeInternalRedirectPath("/\\evil")).toBe("/dashboard");
  });

  it("rejeita paths sem barra inicial", () => {
    expect(safeInternalRedirectPath("dashboard")).toBe("/dashboard");
    expect(safeInternalRedirectPath("login")).toBe("/dashboard");
  });

  it("usa fallback customizado", () => {
    expect(safeInternalRedirectPath(null, "/login")).toBe("/login");
    expect(safeInternalRedirectPath("", "/login")).toBe("/login");
  });
});

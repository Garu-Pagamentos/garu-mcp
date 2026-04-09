import { describe, expect, it } from "vitest";
import { fail } from "../src/tools/shared.js";

function getText(result: ReturnType<typeof fail>): string {
  return result.content[0].text;
}

describe("fail() error sanitization", () => {
  it("strips URLs from error messages", () => {
    const err = new Error("Request failed: https://api.garu.com.br/v1/charges/123");
    const text = getText(fail(err));

    expect(text).not.toContain("https://api.garu.com.br");
    expect(text).toContain("[redacted-url]");
  });

  it("strips filesystem paths with 2+ segments", () => {
    const err = new Error("ENOENT: no such file /home/user/app/config.json");
    const text = getText(fail(err));

    expect(text).not.toContain("/home/user/app");
    expect(text).toContain("[redacted-path]");
  });

  it("preserves domain terms containing slashes like fisica/juridica", () => {
    const err = new Error("personType must be fisica/juridica");
    const text = getText(fail(err));

    expect(text).toContain("fisica/juridica");
  });

  it("preserves MIME types like application/json", () => {
    const err = new Error("Invalid content-type: application/json");
    const text = getText(fail(err));

    expect(text).toContain("application/json");
  });

  it("preserves slash-separated values like pix/boleto", () => {
    const err = new Error("paymentMethod must be pix/boleto");
    const text = getText(fail(err));

    expect(text).toContain("pix/boleto");
  });

  it("strips stack frames", () => {
    const err = new Error("something failed at Object.create (/app/src/server.js:10:5)");
    const text = getText(fail(err));

    expect(text).not.toContain("/app/src/server.js");
  });

  it("truncates to 500 characters", () => {
    const err = new Error("x".repeat(1000));
    const text = getText(fail(err));

    expect(text.length).toBeLessThanOrEqual(507); // "Error: " prefix (7) + 500
  });

  it("takes only the first line of multi-line errors", () => {
    const err = new Error("first line\nsecond line with secret /home/user/.env");
    const text = getText(fail(err));

    expect(text).toContain("first line");
    expect(text).not.toContain("second line");
  });

  it("handles non-Error objects", () => {
    const text = getText(fail("string error"));
    expect(text).toBe("Error: string error");
  });

  it("sets isError flag", () => {
    const result = fail(new Error("test"));
    expect(result.isError).toBe(true);
  });
});

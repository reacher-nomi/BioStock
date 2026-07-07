import { apiErrorMessage, passwordProblem } from "../errors";

describe("apiErrorMessage", () => {
  it("returns a string detail as-is", () => {
    const err = { response: { data: { detail: "Invalid credentials" } } };
    expect(apiErrorMessage(err)).toBe("Invalid credentials");
  });

  it("extracts the first message from a FastAPI 422 array detail", () => {
    const err = {
      response: {
        data: {
          detail: [
            { msg: "String should have at least 8 characters" },
            { msg: "second error" },
          ],
        },
      },
    };
    expect(apiErrorMessage(err)).toBe("String should have at least 8 characters");
  });

  it("falls back when the array is empty", () => {
    const err = { response: { data: { detail: [] } } };
    expect(apiErrorMessage(err, "fallback")).toBe("fallback");
  });

  it("gives a friendly message for a network error", () => {
    const err = { message: "Network Error" };
    expect(apiErrorMessage(err)).toMatch(/can't reach the server/i);
  });

  it("uses the fallback when nothing else matches", () => {
    expect(apiErrorMessage({}, "Something broke")).toBe("Something broke");
  });

  it("uses the default fallback when none is given", () => {
    expect(apiErrorMessage({})).toBe("Something went wrong");
  });
});

describe("passwordProblem", () => {
  it("flags passwords shorter than 8 characters", () => {
    expect(passwordProblem("abc123")).toMatch(/at least 8 characters/i);
  });

  it("flags passwords missing a digit", () => {
    expect(passwordProblem("longenoughpw")).toMatch(/letter and one number/i);
  });

  it("flags passwords missing a letter", () => {
    expect(passwordProblem("12345678")).toMatch(/letter and one number/i);
  });

  it("accepts a password meeting both rules", () => {
    expect(passwordProblem("health99")).toBeNull();
  });
});

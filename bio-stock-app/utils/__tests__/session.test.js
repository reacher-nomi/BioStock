jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { clearSession, getAccessToken, getRefreshToken, saveSession } from "../session";

describe("session storage", () => {
  afterEach(async () => {
    await clearSession();
  });

  it("round-trips both tokens through saveSession", async () => {
    await saveSession({ access_token: "access-abc", refresh_token: "refresh-xyz" });
    expect(await getAccessToken()).toBe("access-abc");
    expect(await getRefreshToken()).toBe("refresh-xyz");
  });

  it("clearSession removes both tokens", async () => {
    await saveSession({ access_token: "a", refresh_token: "b" });
    await clearSession();
    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });

  it("tolerates a missing refresh_token without throwing", async () => {
    await saveSession({ access_token: "only-access" });
    expect(await getAccessToken()).toBe("only-access");
    // The official AsyncStorage jest mock reads a stored "" back as null
    // (its multiGet does `value || null`); either way, the important
    // property is that saveSession never throws on a missing token.
    expect(await getRefreshToken()).toBeFalsy();
  });
});

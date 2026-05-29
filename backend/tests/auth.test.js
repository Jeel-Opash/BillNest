import test from "node:test";
import assert from "node:assert";
import AuthService from "../src/services/auth.service.js";

test("AuthService calculations and utilities", async (t) => {
  await t.test("signAccessToken should generate a valid JWT format", () => {
    const mockUser = {
      _id: "60c72b2f9b1d8b2badc12345",
      email: "test@billnest.com",
      role: "owner",
      organization: { _id: "60c72b2f9b1d8b2badc54321" },
    };


    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_token";
    const token = AuthService.signAccessToken(mockUser);
    
    assert.strictEqual(typeof token, "string");
    assert.ok(token.split(".").length === 3);
  });

  await t.test("signRefreshToken should generate a valid refresh token", () => {
    const mockUser = {
      _id: "60c72b2f9b1d8b2badc12345",
    };

    const token = AuthService.signRefreshToken(mockUser);
    assert.strictEqual(typeof token, "string");
    assert.ok(token.split(".").length === 3);
  });
});

import test from "node:test";
import assert from "node:assert";
import ClientService from "../src/services/client.service.js";

test("ClientService Domain Logic and Validations", async (t) => {
  await t.test("createClient should throw error if name or email is missing", async () => {
    const invalidClientData = {
      company: "Test Corp",
      phone: "12345678",
    };

    await assert.rejects(
      async () => {
        await ClientService.createClient("60c72b2f9b1d8b2badc54321", invalidClientData);
      },
      /Client name and email are required/
    );
  });
});

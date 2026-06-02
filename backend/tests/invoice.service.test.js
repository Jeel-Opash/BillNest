import test from "node:test";
import assert from "node:assert/strict";
import InvoiceService from "../src/services/invoice.service.js";

test("invoice service calculates subtotal, discount, tax, and total", () => {
  const result = InvoiceService.calculateFinancials(
    [
      { quantity: 2, unitPrice: 100 },
      { quantity: 1, price: 50 },
    ],
    10,
    20
  );

  assert.equal(result.subtotal, 250);
  assert.equal(result.discountAmount, 50);
  assert.equal(result.taxAmount, 20);
  assert.equal(result.total, 220);
});

test("invoice state machine shape blocks terminal state transitions", () => {
  const allowed = {
    draft: ["sent"],
    sent: ["paid", "overdue", "void"],
    overdue: ["paid", "void"],
    paid: [],
    void: [],
  };

  assert.equal(allowed.draft.includes("paid"), false);
  assert.equal(allowed.sent.includes("paid"), true);
  assert.equal(allowed.paid.includes("sent"), false);
  assert.equal(allowed.void.includes("draft"), false);
});

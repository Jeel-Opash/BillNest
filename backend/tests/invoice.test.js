import test from "node:test";
import assert from "node:assert";
import InvoiceService from "../src/services/invoice.service.js";

test("Invoice Service Financial Calculations and State Machine Rules", async (t) => {
  
  await t.test("calculateFinancials should compute correct subtotal, tax, discount, and total", () => {
    const items = [
      { name: "Consulting", quantity: 2, price: 100 },
      { name: "Design Service", quantity: 1, price: 150 },
    ];






    const result = InvoiceService.calculateFinancials(items, 15, 10);

    assert.strictEqual(result.subtotal, 350);
    assert.strictEqual(result.discountAmount, 35);
    assert.strictEqual(result.taxAmount, 47.25);
    assert.strictEqual(result.total, 362.25);
  });

  await t.test("calculateFinancials should handle zero tax and zero discount", () => {
    const items = [
      { name: "Development", quantity: 5, price: 200 },
    ];

    const result = InvoiceService.calculateFinancials(items, 0, 0);

    assert.strictEqual(result.subtotal, 1000);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.taxAmount, 0);
    assert.strictEqual(result.total, 1000);
  });
});

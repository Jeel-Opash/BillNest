import PDFDocument from "pdfkit";

const generateInvoicePdf = async (
  invoice,
  client
) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();

      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));

      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);

        resolve(pdfData);
      });


      doc
        .fontSize(24)
        .text("INVOICE", {
          align: "center",
        });

      doc.moveDown();


      doc.fontSize(14).text(
        `Invoice Number: ${invoice.invoiceNumber || invoice.id || "INV-TEMP"}`
      );

      doc.text(
        `Date: ${new Date().toLocaleDateString()}`
      );

      doc.text(
        `Due Date: ${new Date(
          invoice.dueDate
        ).toLocaleDateString()}`
      );

      doc.moveDown();


      doc
        .fontSize(18)
        .text("Bill To:");

      doc.fontSize(14).text(client.name || client.company || "Valued Client");

      doc.text(client.email || "");

      doc.text(client.company || "");

      doc.text(client.address || "");

      doc.moveDown();


      doc
        .fontSize(18)
        .text("Items");

      doc.moveDown();

      const currencySymbol = invoice.currency === "USD" ? "$" : invoice.currency === "EUR" ? "€" : "₹";

      const itemsList = invoice.items || [];
      itemsList.forEach((item) => {
        const name = item.name || item.desc || "Item";
        const quantity = item.quantity || item.qty || 1;
        const price = item.price || item.unitPrice || 0;
        doc.fontSize(12).text(
          `${name} | Qty: ${quantity} | Price: ${currencySymbol}${price.toLocaleString()}`
        );
      });

      doc.moveDown();


      doc.text(
        `Subtotal: ${currencySymbol}${(invoice.subtotal || 0).toLocaleString()}`
      );

      doc.text(`Tax: ${currencySymbol}${(invoice.tax || invoice.taxAmount || 0).toLocaleString()}`);

      doc
        .fontSize(16)
        .text(`Total: ${currencySymbol}${(invoice.total || invoice.totalAmount || 0).toLocaleString()}`);

      doc.moveDown();


      doc
        .fontSize(12)
        .text(
          "Thank you for your business!",
          {
            align: "center",
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default generateInvoicePdf;
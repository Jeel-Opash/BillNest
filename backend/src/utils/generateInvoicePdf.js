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
        `Invoice Number: ${invoice.invoiceNumber}`
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

      doc.fontSize(14).text(client.name);

      doc.text(client.email);

      doc.text(client.company || "");

      doc.text(client.address || "");

      doc.moveDown();


      doc
        .fontSize(18)
        .text("Items");

      doc.moveDown();

      invoice.items.forEach((item) => {
        doc.fontSize(12).text(
          `${item.name} | Qty: ${item.quantity} | Price: $${item.price}`
        );
      });

      doc.moveDown();


      doc.text(
        `Subtotal: $${invoice.subtotal}`
      );

      doc.text(`Tax: $${invoice.tax}`);

      doc
        .fontSize(16)
        .text(`Total: $${invoice.total}`);

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
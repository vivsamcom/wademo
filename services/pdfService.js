const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateTravelPdf(content) {
  return new Promise((resolve, reject) => {
    const fileName = `travel-plan-${Date.now()}.pdf`;

    const filePath = path.join(
      __dirname,
      "..",
      "public",
      fileName
    );

    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20)
      .text("TravelBuddy Itinerary");

    doc.moveDown();

    doc.fontSize(12)
      .text(content);

    doc.end();

    doc.on("end", () => resolve(fileName));
    doc.on("error", reject);
  });
}

module.exports = {
  generateTravelPdf
};
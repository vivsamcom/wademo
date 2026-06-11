const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const UNSUPPORTED_PDF_EMOJI_REGEX =
  /(?:[\uD800-\uDBFF][\uDC00-\uDFFF])|[\u00A9\u00AE\u203C\u2049\u20E3\u2122\u2139\u2194-\u21AA\u231A-\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA-\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u27BF\u2934-\u2935\u2B05-\u2B55\u3030\u303D\u3297\u3299\uFE0E\uFE0F\u200D]/g;

function sanitizePdfText(content) {
  return String(content || "")
    .replace(UNSUPPORTED_PDF_EMOJI_REGEX, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n");
}

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

    const stream =
      fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20)
      .text("TravelBuddy Itinerary");

    doc.moveDown();

    const pdfContent =
      sanitizePdfText(content);

    doc.fontSize(12)
      .text(pdfContent);

    stream.on("finish", () => resolve(fileName));
    doc.on("error", reject);
    stream.on("error", reject);

    doc.end();
  });
}

module.exports = {
  generateTravelPdf
};

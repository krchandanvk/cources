import { jsPDF } from "jspdf";
import { Lesson } from "../types/lms";

/**
 * Generates and downloads a beautifully styled PDF of a course lesson for premium users.
 */
export function generateLessonPDF(courseTitle: string, lesson: Lesson) {
  // Initialize standard A4 PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - margin * 2;

  // Render Premium Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(245, 166, 35); // #F5A623 (gold)
  doc.text("SkillRise Academy", margin, margin + 5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(122, 129, 149); // #7A8195 (dim text)
  doc.text("OFFICIAL PREMIUM LEARNING MATERIAL", pageWidth - margin - 65, margin + 4);

  // Border separator line
  doc.setDrawColor(35, 39, 48); // #232730
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 10, pageWidth - margin, margin + 10);

  // Course metadata header
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(122, 129, 149);
  doc.text(`COURSE: ${courseTitle.toUpperCase()}`, margin, margin + 18);

  // Lesson Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(22, 25, 31); // #16191F (dark text for print readability)
  
  const splitTitle = doc.splitTextToSize(lesson.title, maxLineWidth);
  doc.text(splitTitle, margin, margin + 26);
  
  let currentY = margin + 34;

  // Clean markdown tags for PDF rendering readability
  const cleanBody = lesson.content
    .replace(/### (.*)/g, "$1")
    .replace(/## (.*)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/<br\s*\/?>/gi, "\n");

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 64, 75); // Dark text optimized for print contrast

  const splitBodyLines = doc.splitTextToSize(cleanBody, maxLineWidth);

  for (let i = 0; i < splitBodyLines.length; i++) {
    if (currentY > pageHeight - margin - 15) {
      doc.addPage();
      currentY = margin + 15;
    }
    doc.text(splitBodyLines[i], margin, currentY);
    currentY += 6.5;
  }

  // Render Lesson Code Snippets if present
  if (lesson.code) {
    if (currentY > pageHeight - margin - 40) {
      doc.addPage();
      currentY = margin + 15;
    }

    currentY += 5;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(245, 166, 35);
    doc.text("CODE IMPLEMENTATION EXAMPLES:", margin, currentY);
    currentY += 7;

    doc.setFont("Courier", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(74, 158, 255); // #4A9EFF (blue)

    const splitCodeLines = doc.splitTextToSize(lesson.code, maxLineWidth);
    for (let i = 0; i < splitCodeLines.length; i++) {
      if (currentY > pageHeight - margin - 15) {
        doc.addPage();
        currentY = margin + 15;
      }
      doc.text(splitCodeLines[i], margin, currentY);
      currentY += 5.5;
    }
  }

  // Visual specs spec diagram text
  if (lesson.diagram) {
    if (currentY > pageHeight - margin - 35) {
      doc.addPage();
      currentY = margin + 15;
    }

    currentY += 5;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(245, 166, 35);
    doc.text("VISUAL SPECIFICATION FLOW:", margin, currentY);
    currentY += 7;

    doc.setFont("Helvetica", "oblique");
    doc.setFontSize(10);
    doc.setTextColor(122, 129, 149);
    doc.text(lesson.diagram, margin, currentY);
  }

  // Save compiled PDF asset to client disk download
  const cleanFilename = `${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-premium.pdf`;
  doc.save(cleanFilename);
}

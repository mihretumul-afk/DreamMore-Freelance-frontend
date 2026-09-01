import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatETB, formatDate } from './format';
import { API_BASE_URL } from '../config/env';

/**
 * Fetch an image URL and return it as a base64 data URL.
 * Returns null if fetch fails (e.g. CORS, 404, no avatar).
 */
async function fetchImageAsDataURL(url) {
  try {
    if (!url) return null;
    // Prepend API base for relative URLs
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Draw a circular avatar image on the PDF header.
 * If no image is available, draws a placeholder circle with initials.
 */
function drawAvatar(doc, imageDataUrl, name, x, y, size) {
  if (imageDataUrl) {
    try {
      doc.saveGraphicsState();
      // Clip circle
      doc.circle(x + size / 2, y + size / 2, size / 2, 'F');
      doc.addImage(imageDataUrl, 'JPEG', x, y, size, size);
      doc.restoreGraphicsState();
    } catch {
      // Fallback: draw initials
      drawInitials(doc, name, x, y, size);
    }
  } else {
    drawInitials(doc, name, x, y, size);
  }
}

/**
 * Draw initials placeholder in a circle.
 */
function drawInitials(doc, name, x, y, size) {
  doc.setFillColor(255, 255, 255, 0.3);
  doc.circle(x + size / 2, y + size / 2, size / 2, 'F');
  const initials = (name || '?').split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  doc.setFontSize(size * 0.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(initials, x + size / 2, y + size / 2 + 1.5, { align: 'center' });
}

/**
 * Generate a professional PDF document of a freelancer's full profile
 * for admin review before approval.
 *
 * @param {Object} data - { profile, verifications, credentials, portfolio, reviews, review_count }
 */
export async function generateFreelancerProfilePDF(data) {
  const { profile, verifications, credentials, portfolio, reviews, review_count } = data;
  const user = profile.user || {};
  const skills = profile.skills || [];

  // Fetch avatar before generating PDF
  const avatarDataUrl = await fetchImageAsDataURL(user.avatar);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── Helper functions ──────────────────────────────────────────────
  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  }

  function drawSectionHeader(title, icon) {
    checkPageBreak(18);
    // Background bar
    doc.setFillColor(248, 250, 252); // gray-50
    doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');
    // Left accent
    doc.setFillColor(79, 70, 229); // brand-500
    doc.roundedRect(margin, y, 3, 10, 1, 0, 'F');
    // Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`${icon}  ${title}`, margin + 6, y + 7);
    y += 15;
  }

  function drawField(label, value, x, fieldWidth) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(label, x, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    const lines = doc.splitTextToSize(String(value || 'Not provided'), fieldWidth);
    doc.text(lines, x, y);
    y += lines.length * 4 + 3;
  }

  function drawDivider() {
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  }

  // ══════════════════════════════════════════════════════════════════
  // PAGE 1 — Header & Profile Summary
  // ══════════════════════════════════════════════════════════════════

  // Header background
  doc.setFillColor(79, 70, 229); // brand-500
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Platform name
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255, 0.7);
  doc.text('DREAMMORE APPWORKS — FREELANCER REVIEW', margin, 10);

  // Avatar
  const avatarSize = 22;
  drawAvatar(doc, avatarDataUrl, user.name, pageWidth - margin - avatarSize - 36, 8, avatarSize);

  // Freelancer name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(user.name || 'Unknown Freelancer', margin, 22);

  // Headline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 255);
  doc.text(profile.headline || 'No headline set', margin, 29);

  // Status badge
  const statusText = (profile.approval_status || 'pending').toUpperCase();
  const statusColors = {
    pending: [245, 158, 11],    // amber
    approved: [16, 185, 129],   // emerald
    rejected: [239, 68, 68],    // red
  };
  const sc = statusColors[profile.approval_status] || statusColors.pending;
  doc.setFillColor(...sc);
  doc.roundedRect(pageWidth - margin - 30, 6, 30, 8, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, pageWidth - margin - 15, 11, { align: 'center' });

  // Date
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 37);

  y = 52;

  // ── Key Info Grid ────────────────────────────────────────────────
  drawSectionHeader('PROFILE SUMMARY', '');

  const colWidth = contentWidth / 4;
  const infoItems = [
    { label: 'Hourly Rate', value: profile.hourly_rate ? formatETB(profile.hourly_rate) : 'Not set' },
    { label: 'Experience', value: profile.experience_level || 'Not set' },
    { label: 'Availability', value: (profile.availability_status || 'available').replace('_', ' ') },
    { label: 'Location', value: profile.location || 'Not set' },
  ];

  infoItems.forEach((item, i) => {
    const x = margin + i * colWidth;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(item.label, x + 2, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(item.value, x + 2, y + 4);
  });
  y += 10;

  drawDivider();

  // ── Contact Information ──────────────────────────────────────────
  drawSectionHeader('CONTACT INFORMATION', '');

  const contactCol = contentWidth / 2;
  drawField('Full Name', user.name, margin, contactCol - 4);
  const yAfterName = y;
  y = yAfterName - 4 - 4 - 3;
  drawField('Email', user.email, margin + contactCol, contactCol - 4);
  y = Math.max(y, yAfterName);

  drawField('Phone', user.phone || 'Not provided', margin, contactCol - 4);
  const yAfterPhone = y;
  y = yAfterPhone - 4 - 4 - 3;
  drawField('Location', profile.location || 'Not provided', margin + contactCol, contactCol - 4);
  y = Math.max(y, yAfterPhone);

  drawDivider();

  // ── About / Overview ─────────────────────────────────────────────
  drawSectionHeader('ABOUT / OVERVIEW', '');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85); // slate-700
  if (profile.overview) {
    const overviewLines = doc.splitTextToSize(profile.overview, contentWidth);
    checkPageBreak(overviewLines.length * 4 + 5);
    doc.text(overviewLines, margin, y);
    y += overviewLines.length * 4 + 4;
  } else {
    doc.text('No overview provided.', margin, y);
    y += 6;
  }

  drawDivider();

  // ── Skills ───────────────────────────────────────────────────────
  drawSectionHeader(`SKILLS & EXPERTISE (${skills.length})`, '');

  if (skills.length > 0) {
    skills.forEach((skill) => {
      checkPageBreak(8);
      // Skill pill background
      doc.setFillColor(238, 242, 255); // brand-50
      doc.roundedRect(margin, y - 3, contentWidth, 7, 1, 1, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(skill.name, margin + 3, y + 1);
      if (skill.pivot?.years_of_experience != null) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(79, 70, 229);
        doc.text(`${skill.pivot.years_of_experience} years experience`, margin + contentWidth - 3, y + 1, { align: 'right' });
      }
      y += 9;
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('No skills added yet.', margin, y);
    y += 6;
  }

  drawDivider();

  // ── Links ────────────────────────────────────────────────────────
  drawSectionHeader('ONLINE PRESENCE', '');

  const links = [
    profile.github_url && { label: 'GitHub', url: profile.github_url },
    profile.linkedin_url && { label: 'LinkedIn', url: profile.linkedin_url },
    profile.website && { label: 'Website', url: profile.website },
  ].filter(Boolean);

  if (links.length > 0) {
    links.forEach((link) => {
      checkPageBreak(7);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(`${link.label}:`, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(link.url, margin + 25, y);
      y += 5;
    });
    y += 2;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('No links provided.', margin, y);
    y += 6;
  }

  // ══════════════════════════════════════════════════════════════════
  // VERIFICATION DOCUMENTS
  // ══════════════════════════════════════════════════════════════════
  drawSectionHeader(`VERIFICATION DOCUMENTS (${verifications?.length || 0})`, '');

  if (verifications?.length > 0) {
    const vData = verifications.map((v) => [
      (v.type || '').replace(/_/g, ' '),
      v.status,
      v.notes || '—',
      formatDate(v.created_at),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Document Type', 'Status', 'Notes', 'Submitted']],
      body: vData,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      didParseCell: function (hookData) {
        if (hookData.column.index === 1 && hookData.section === 'body') {
          const status = hookData.cell.raw;
          if (status === 'approved') hookData.cell.styles.textColor = [16, 185, 129];
          else if (status === 'rejected') hookData.cell.styles.textColor = [239, 68, 68];
          else hookData.cell.styles.textColor = [245, 158, 11];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('No verification documents submitted.', margin, y);
    y += 8;
  }

  // ══════════════════════════════════════════════════════════════════
  // CREDENTIALS
  // ══════════════════════════════════════════════════════════════════
  drawSectionHeader(`CREDENTIALS & CERTIFICATES (${credentials?.length || 0})`, '');

  if (credentials?.length > 0) {
    const cData = credentials.map((c) => [
      c.title || '—',
      c.type || '—',
      c.issuing_organization || '—',
      c.status,
      c.issue_date ? formatDate(c.issue_date) : '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Title', 'Type', 'Issuer', 'Status', 'Issue Date']],
      body: cData,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 22 },
        4: { cellWidth: 30 },
      },
      didParseCell: function (hookData) {
        if (hookData.column.index === 3 && hookData.section === 'body') {
          const status = hookData.cell.raw;
          if (status === 'approved') hookData.cell.styles.textColor = [16, 185, 129];
          else if (status === 'rejected') hookData.cell.styles.textColor = [239, 68, 68];
          else hookData.cell.styles.textColor = [245, 158, 11];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('No credentials submitted.', margin, y);
    y += 8;
  }

  // ══════════════════════════════════════════════════════════════════
  // PORTFOLIO
  // ══════════════════════════════════════════════════════════════════
  drawSectionHeader(`PORTFOLIO & PROJECTS (${portfolio?.length || 0})`, '');

  if (portfolio?.length > 0) {
    const pData = portfolio.map((p) => [
      p.title || '—',
      p.description ? p.description.substring(0, 80) + (p.description.length > 80 ? '...' : '') : '—',
      p.category?.name || '—',
      p.skill?.name || '—',
      p.project_url || '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Project', 'Description', 'Category', 'Skill', 'URL']],
      body: pData,
      theme: 'striped',
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 55 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 35 },
      },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('No portfolio items added.', margin, y);
    y += 8;
  }

  // ══════════════════════════════════════════════════════════════════
  // REVIEWS
  // ══════════════════════════════════════════════════════════════════
  drawSectionHeader(`REVIEWS (${review_count || 0})`, '');

  if (reviews?.length > 0) {
    reviews.forEach((review) => {
      checkPageBreak(18);
      // Review card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y - 2, contentWidth, 14, 1, 1, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(review.reviewer?.name || 'Anonymous', margin + 3, y + 2);

      // Star rating
      const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
      doc.setFontSize(8);
      doc.setTextColor(245, 158, 11); // amber
      doc.text(stars, margin + 60, y + 2);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(formatDate(review.created_at), pageWidth - margin - 3, y + 2, { align: 'right' });

      if (review.comment) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const commentLines = doc.splitTextToSize(review.comment, contentWidth - 6);
        doc.text(commentLines.slice(0, 2), margin + 3, y + 7);
      }
      y += 16;
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('No reviews yet.', margin, y);
    y += 8;
  }

  // ══════════════════════════════════════════════════════════════════
  // REJECTION REASON (if any)
  // ══════════════════════════════════════════════════════════════════
  if (profile.rejection_reason) {
    checkPageBreak(20);
    doc.setFillColor(254, 226, 226); // red-100
    doc.roundedRect(margin, y - 2, contentWidth, 14, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28); // red-700
    doc.text('Rejection Reason:', margin + 3, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(153, 27, 27); // red-600
    doc.text(profile.rejection_reason, margin + 3, y + 8);
    y += 18;
  }

  // ══════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    // Footer text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('DreamMore AppWorks — Confidential Admin Review Document', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    doc.text(`Generated ${new Date().toLocaleDateString('en-ET')}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  // Save
  const filename = `freelancer-${(user.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Open the PDF in a new browser tab for preview instead of downloading.
 */
export async function previewFreelancerProfilePDF(data) {
  const { profile, verifications, credentials, portfolio, reviews, review_count } = data;
  const user = profile.user || {};
  const skills = profile.skills || [];

  // Fetch avatar before generating PDF
  const avatarDataUrl = await fetchImageAsDataURL(user.avatar);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  }

  function drawSectionHeader(title) {
    checkPageBreak(18);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F');
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(margin, y, 3, 10, 1, 0, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin + 6, y + 7);
    y += 15;
  }

  function drawField(label, value, x, fieldWidth) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(label, x, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(String(value || 'Not provided'), fieldWidth);
    doc.text(lines, x, y);
    y += lines.length * 4 + 3;
  }

  function drawDivider() {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  }

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 255);
  doc.text('DREAMMORE APPWORKS — FREELANCER REVIEW', margin, 10);

  // Avatar
  const avatarSize = 22;
  drawAvatar(doc, avatarDataUrl, user.name, pageWidth - margin - avatarSize - 36, 8, avatarSize);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(user.name || 'Unknown Freelancer', margin, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 255);
  doc.text(profile.headline || 'No headline set', margin, 29);

  const statusText = (profile.approval_status || 'pending').toUpperCase();
  const statusColors = { pending: [245, 158, 11], approved: [16, 185, 129], rejected: [239, 68, 68] };
  const sc = statusColors[profile.approval_status] || statusColors.pending;
  doc.setFillColor(...sc);
  doc.roundedRect(pageWidth - margin - 30, 6, 30, 8, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, pageWidth - margin - 15, 11, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(200, 200, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 37);

  y = 52;

  // Key Info
  drawSectionHeader('PROFILE SUMMARY');
  const colWidth = contentWidth / 4;
  [
    { label: 'Hourly Rate', value: profile.hourly_rate ? formatETB(profile.hourly_rate) : 'Not set' },
    { label: 'Experience', value: profile.experience_level || 'Not set' },
    { label: 'Availability', value: (profile.availability_status || 'available').replace('_', ' ') },
    { label: 'Location', value: profile.location || 'Not set' },
  ].forEach((item, i) => {
    const x = margin + i * colWidth;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
    doc.text(item.label, x + 2, y);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(item.value, x + 2, y + 4);
  });
  y += 10;
  drawDivider();

  // Contact
  drawSectionHeader('CONTACT INFORMATION');
  const halfW = contentWidth / 2;
  drawField('Full Name', user.name, margin, halfW - 4);
  const yName = y; y -= 4 + 4 + 3;
  drawField('Email', user.email, margin + halfW, halfW - 4);
  y = Math.max(y, yName);
  drawField('Phone', user.phone || 'Not provided', margin, halfW - 4);
  const yPhone = y; y -= 4 + 4 + 3;
  drawField('Location', profile.location || 'Not provided', margin + halfW, halfW - 4);
  y = Math.max(y, yPhone);
  drawDivider();

  // About
  drawSectionHeader('ABOUT / OVERVIEW');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85);
  if (profile.overview) {
    const lines = doc.splitTextToSize(profile.overview, contentWidth);
    checkPageBreak(lines.length * 4 + 5);
    doc.text(lines, margin, y); y += lines.length * 4 + 4;
  } else { doc.text('No overview provided.', margin, y); y += 6; }
  drawDivider();

  // Skills
  drawSectionHeader(`SKILLS & EXPERTISE (${skills.length})`);
  if (skills.length > 0) {
    skills.forEach((skill) => {
      checkPageBreak(8);
      doc.setFillColor(238, 242, 255);
      doc.roundedRect(margin, y - 3, contentWidth, 7, 1, 1, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
      doc.text(skill.name, margin + 3, y + 1);
      if (skill.pivot?.years_of_experience != null) {
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(79, 70, 229);
        doc.text(`${skill.pivot.years_of_experience}y exp`, margin + contentWidth - 3, y + 1, { align: 'right' });
      }
      y += 9;
    });
  } else {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(156, 163, 175);
    doc.text('No skills added yet.', margin, y); y += 6;
  }
  drawDivider();

  // Links
  drawSectionHeader('ONLINE PRESENCE');
  const links = [
    profile.github_url && { label: 'GitHub', url: profile.github_url },
    profile.linkedin_url && { label: 'LinkedIn', url: profile.linkedin_url },
    profile.website && { label: 'Website', url: profile.website },
  ].filter(Boolean);
  if (links.length > 0) {
    links.forEach((link) => {
      checkPageBreak(7);
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 70, 229);
      doc.text(`${link.label}:`, margin + 2, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85);
      doc.text(link.url, margin + 25, y); y += 5;
    });
    y += 2;
  } else {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(156, 163, 175);
    doc.text('No links provided.', margin, y); y += 6;
  }

  // Verifications
  drawSectionHeader(`VERIFICATION DOCUMENTS (${verifications?.length || 0})`);
  if (verifications?.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Document Type', 'Status', 'Notes', 'Submitted']],
      body: verifications.map((v) => [(v.type || '').replace(/_/g, ' '), v.status, v.notes || '—', formatDate(v.created_at)]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      didParseCell(h) { if (h.column.index === 1 && h.section === 'body') { const s = h.cell.raw; if (s === 'approved') h.cell.styles.textColor = [16, 185, 129]; else if (s === 'rejected') h.cell.styles.textColor = [239, 68, 68]; else h.cell.styles.textColor = [245, 158, 11]; } },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(156, 163, 175);
    doc.text('No verification documents submitted.', margin, y); y += 8;
  }

  // Credentials
  drawSectionHeader(`CREDENTIALS & CERTIFICATES (${credentials?.length || 0})`);
  if (credentials?.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Title', 'Type', 'Issuer', 'Status', 'Issue Date']],
      body: credentials.map((c) => [c.title || '—', c.type || '—', c.issuing_organization || '—', c.status, c.issue_date ? formatDate(c.issue_date) : '—']),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 }, 3: { cellWidth: 22 }, 4: { cellWidth: 30 } },
      didParseCell(h) { if (h.column.index === 3 && h.section === 'body') { const s = h.cell.raw; if (s === 'approved') h.cell.styles.textColor = [16, 185, 129]; else if (s === 'rejected') h.cell.styles.textColor = [239, 68, 68]; else h.cell.styles.textColor = [245, 158, 11]; } },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(156, 163, 175);
    doc.text('No credentials submitted.', margin, y); y += 8;
  }

  // Portfolio
  drawSectionHeader(`PORTFOLIO & PROJECTS (${portfolio?.length || 0})`);
  if (portfolio?.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Project', 'Description', 'Category', 'Skill', 'URL']],
      body: portfolio.map((p) => [p.title || '—', p.description ? p.description.substring(0, 80) + (p.description.length > 80 ? '...' : '') : '—', p.category?.name || '—', p.skill?.name || '—', p.project_url || '—']),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 55 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 35 } },
    });
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(156, 163, 175);
    doc.text('No portfolio items added.', margin, y); y += 8;
  }

  // Reviews
  drawSectionHeader(`REVIEWS (${review_count || 0})`);
  if (reviews?.length > 0) {
    reviews.forEach((review) => {
      checkPageBreak(18);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y - 2, contentWidth, 14, 1, 1, 'F');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
      doc.text(review.reviewer?.name || 'Anonymous', margin + 3, y + 2);
      const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
      doc.setFontSize(8); doc.setTextColor(245, 158, 11);
      doc.text(stars, margin + 60, y + 2);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175);
      doc.text(formatDate(review.created_at), pageWidth - margin - 3, y + 2, { align: 'right' });
      if (review.comment) {
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(71, 85, 105);
        const cLines = doc.splitTextToSize(review.comment, contentWidth - 6);
        doc.text(cLines.slice(0, 2), margin + 3, y + 7);
      }
      y += 16;
    });
  } else {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(156, 163, 175);
    doc.text('No reviews yet.', margin, y); y += 8;
  }

  // Rejection reason
  if (profile.rejection_reason) {
    checkPageBreak(20);
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(margin, y - 2, contentWidth, 14, 1, 1, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(185, 28, 28);
    doc.text('Rejection Reason:', margin + 3, y + 3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(153, 27, 27);
    doc.text(profile.rejection_reason, margin + 3, y + 8);
    y += 18;
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(7); doc.setFont('helvetica', 'italic'); doc.setTextColor(156, 163, 175);
    doc.text('DreamMore AppWorks — Confidential Admin Review Document', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Open in new tab — try blob URL first, fallback to data URI
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') {
      // Popup blocked — fallback: trigger download instead
      const link = document.createElement('a');
      link.href = url;
      link.download = `freelancer-${(user.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (err) {
    // Last resort fallback — use data URI
    try {
      const dataUri = doc.output('datauristring');
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `freelancer-${(user.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (fallbackErr) {
      console.error('PDF preview failed:', fallbackErr);
      throw new Error('Unable to generate PDF preview.');
    }
  }
}

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
      // Outer border circle
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.8);
      doc.circle(x + size / 2, y + size / 2, size / 2, 'FD');
      // Clip circle for avatar image
      doc.circle(x + size / 2, y + size / 2, size / 2 - 0.4, 'F');
      doc.addImage(imageDataUrl, 'JPEG', x + 0.4, y + 0.4, size - 0.8, size - 0.8);
      doc.restoreGraphicsState();
      return;
    } catch {
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
  doc.setFillColor(255, 255, 255, 0.25);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.circle(x + size / 2, y + size / 2, size / 2, 'FD');
  const initials = (name || '?').split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  doc.setFontSize(size * 0.4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(initials, x + size / 2, y + size / 2 + 1.8, { align: 'center' });
}

/**
 * Build and format a high-quality, modern, styled jsPDF document object.
 */
async function buildFreelancerPDFDoc(data) {
  const { profile = {}, verifications = [], credentials = [], portfolio = [], reviews = [], review_count = 0 } = data;
  const user = profile.user || {};
  const skills = profile.skills || [];

  const avatarDataUrl = await fetchImageAsDataURL(user.avatar);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Colors Palette
  const PRIMARY = [67, 56, 202]; // indigo-700
  const PRIMARY_DARK = [49, 46, 129]; // indigo-900
  const DARK_SLATE = [15, 23, 42]; // slate-900
  const LIGHT_BG = [248, 250, 252]; // slate-50

  function checkPageBreak(needed) {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 16;
      return true;
    }
    return false;
  }

  function drawSectionHeader(title) {
    checkPageBreak(16);
    // Background bar
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'F');
    // Left border pill accent
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(margin, y, 3.5, 9, 1, 1, 'F');
    // Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_SLATE);
    doc.text(title.toUpperCase(), margin + 6, y + 6.2);
    y += 13;
  }

  // 1. TOP HEADER BANNER
  doc.setFillColor(...PRIMARY_DARK);
  doc.rect(0, 0, pageWidth, 48, 'F');

  // Decorative top gradient highlight bar
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Subtitle / Brand
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(224, 231, 255);
  doc.text('DREAMMORE APPWORKS — FREELANCER AUDIT REPORT', margin, 11);

  // Avatar Photo
  const avatarSize = 24;
  const avatarX = pageWidth - margin - avatarSize;
  const avatarY = 11;
  drawAvatar(doc, avatarDataUrl, user.name, avatarX, avatarY, avatarSize);

  // Name
  doc.setFontSize(19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const nameText = user.name || 'Freelancer Profile';
  doc.text(nameText, margin, 22);

  // Headline
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  const headline = doc.splitTextToSize(profile.headline || 'Registered Freelancer', contentWidth - avatarSize - 10);
  doc.text(headline.slice(0, 2), margin, 28);

  // Status badge
  const statusText = (profile.approval_status || 'pending').toUpperCase();
  const statusColors = {
    pending: [245, 158, 11],
    approved: [16, 185, 129],
    rejected: [225, 29, 72],
  };
  const sc = statusColors[profile.approval_status] || statusColors.pending;
  doc.setFillColor(...sc);
  doc.roundedRect(margin, 36, 28, 7, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, margin + 14, 40.8, { align: 'center' });

  // Date
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(199, 210, 254);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })}`, margin + 32, 40.8);

  y = 54;

  // 2. METRICS CARDS GRID (4 Columns)
  const cardW = (contentWidth - 9) / 4;
  const metrics = [
    { label: 'HOURLY RATE', val: profile.hourly_rate ? formatETB(profile.hourly_rate) : 'Not set' },
    { label: 'EXPERIENCE', val: (profile.experience_level || 'Not set').toUpperCase() },
    { label: 'AVAILABILITY', val: (profile.availability_status || 'available').replace('_', ' ').toUpperCase() },
    { label: 'LOCATION', val: profile.location || 'Not set' },
  ];

  metrics.forEach((m, idx) => {
    const mx = margin + idx * (cardW + 3);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(mx, y, cardW, 14, 1.5, 1.5, 'F');

    doc.setFillColor(...PRIMARY);
    doc.roundedRect(mx, y, 2, 14, 1, 0, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, mx + 4, y + 4.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_SLATE);
    const textVal = doc.splitTextToSize(m.val, cardW - 6);
    doc.text(textVal[0], mx + 4, y + 10);
  });

  y += 19;

  // 3. CONTACT INFORMATION
  drawSectionHeader('Contact Information');
  const halfW = (contentWidth - 6) / 2;

  // Contact box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
  doc.text('FULL NAME:', margin + 4, y + 6);
  doc.text('EMAIL ADDRESS:', margin + halfW + 4, y + 6);
  doc.text('PHONE NUMBER:', margin + 4, y + 16);
  doc.text('LOCATION / CITY:', margin + halfW + 4, y + 16);

  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK_SLATE);
  doc.text(user.name || 'N/A', margin + 28, y + 6);
  doc.text(user.email || 'N/A', margin + halfW + 32, y + 6);
  doc.text(user.phone || 'Not provided', margin + 30, y + 16);
  doc.text(profile.location || 'Not provided', margin + halfW + 32, y + 16);

  y += 27;

  // 4. OVERVIEW / BIO
  if (profile.overview) {
    drawSectionHeader('Profile Overview / Bio');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const overviewLines = doc.splitTextToSize(profile.overview, contentWidth - 4);
    checkPageBreak(overviewLines.length * 4.2 + 6);
    doc.text(overviewLines, margin + 2, y);
    y += overviewLines.length * 4.2 + 8;
  }

  // 5. SKILLS & EXPERTISE
  drawSectionHeader(`Skills & Expertise (${skills.length})`);
  if (skills.length > 0) {
    let currX = margin;
    let currY = y;
    const pillH = 7;

    skills.forEach((skill) => {
      const expText = skill.pivot?.years_of_experience != null ? ` (${skill.pivot.years_of_experience}y exp)` : '';
      const fullLabel = `${skill.name}${expText}`;
      const textWidth = doc.getTextWidth(fullLabel) + 7;

      if (currX + textWidth > pageWidth - margin) {
        currX = margin;
        currY += pillH + 3;
        checkPageBreak(pillH + 3);
      }

      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(currX, currY, textWidth, pillH, 1.5, 1.5, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(43, 38, 137);
      doc.text(fullLabel, currX + 3.5, currY + 4.8);

      currX += textWidth + 3;
    });

    y = currY + pillH + 8;
  } else {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(148, 163, 184);
    doc.text('No skills registered.', margin + 2, y);
    y += 8;
  }

  // 6. ONLINE PRESENCE
  const links = [
    profile.github_url && { label: 'GitHub', url: profile.github_url },
    profile.linkedin_url && { label: 'LinkedIn', url: profile.linkedin_url },
    profile.website && { label: 'Website', url: profile.website },
  ].filter(Boolean);

  if (links.length > 0) {
    drawSectionHeader('Online Presence');
    links.forEach((l) => {
      checkPageBreak(6);
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...PRIMARY);
      doc.text(`${l.label}:`, margin + 2, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
      doc.text(l.url, margin + 22, y);
      y += 5.5;
    });
    y += 4;
  }

  // 7. VERIFICATION DOCUMENTS TABLE
  drawSectionHeader(`Identity Verifications (${verifications.length})`);
  if (verifications.length > 0) {
    const vTableData = verifications.map((v) => [
      (v.type || 'Identity').replace(/_/g, ' ').toUpperCase(),
      (v.status || 'pending').toUpperCase(),
      v.notes || '—',
      formatDate(v.created_at),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Document Type', 'Status', 'Applicant Notes', 'Submitted Date']],
      body: vTableData,
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_DARK,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      didParseCell(hook) {
        if (hook.column.index === 1 && hook.section === 'body') {
          const st = hook.cell.raw;
          if (st === 'APPROVED') hook.cell.styles.textColor = [16, 185, 129];
          else if (st === 'REJECTED') hook.cell.styles.textColor = [225, 29, 72];
          else hook.cell.styles.textColor = [245, 158, 11];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(148, 163, 184);
    doc.text('No identity verifications submitted.', margin + 2, y);
    y += 8;
  }

  // 8. CREDENTIALS & CERTIFICATES TABLE
  drawSectionHeader(`Credentials & Certificates (${credentials.length})`);
  if (credentials.length > 0) {
    const cTableData = credentials.map((c) => [
      c.title || '—',
      (c.type || 'Credential').replace(/_/g, ' '),
      c.issuing_organization || 'External',
      c.certificate_identifier || '—',
      (c.status || 'pending').toUpperCase(),
      c.file_original_name ? `File: ${c.file_original_name}` : (c.file_path ? 'Attached File' : 'No File'),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Certificate Title', 'Type', 'Issuing Body', 'Credential ID', 'Status', 'Attachment']],
      body: cTableData,
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_DARK,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
      didParseCell(hook) {
        if (hook.column.index === 4 && hook.section === 'body') {
          const st = hook.cell.raw;
          if (st === 'APPROVED') hook.cell.styles.textColor = [16, 185, 129];
          else if (st === 'REJECTED') hook.cell.styles.textColor = [225, 29, 72];
          else hook.cell.styles.textColor = [245, 158, 11];
        }
      },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(148, 163, 184);
    doc.text('No credentials submitted.', margin + 2, y);
    y += 8;
  }

  // 9. PORTFOLIO TABLE
  if (portfolio.length > 0) {
    drawSectionHeader(`Portfolio & Projects (${portfolio.length})`);
    const pTableData = portfolio.map((p) => [
      p.title || '—',
      p.description ? p.description.substring(0, 75) + (p.description.length > 75 ? '...' : '') : '—',
      p.category?.name || '—',
      p.skill?.name || '—',
      p.project_url || '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Project Name', 'Description', 'Category', 'Skill', 'Project Link']],
      body: pTableData,
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_DARK,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // 10. REJECTION REASON BOX (if rejected)
  if (profile.rejection_reason) {
    checkPageBreak(18);
    doc.setFillColor(254, 226, 226); // red-100
    doc.setDrawColor(248, 113, 113); // red-400
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(185, 28, 28);
    doc.text('REJECTION REASON:', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(153, 27, 27);
    doc.text(profile.rejection_reason, margin + 4, y + 10);
    y += 18;
  }

  // 11. FOOTERS ON ALL PAGES
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    // Text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('DREAMMORE APPWORKS — CONFIDENTIAL ADMIN AUDIT REPORT', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}

/**
 * Generate and download high quality PDF document.
 */
export async function generateFreelancerProfilePDF(data) {
  const doc = await buildFreelancerPDFDoc(data);
  const user = data?.profile?.user || {};
  const filename = `freelancer-${(user.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Open the PDF in a new browser tab for preview instead of downloading.
 */
export async function previewFreelancerProfilePDF(data) {
  const doc = await buildFreelancerPDFDoc(data);
  const user = data?.profile?.user || {};

  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w || w.closed || typeof w.closed === 'undefined') {
      const link = document.createElement('a');
      link.href = url;
      link.download = `freelancer-${(user.name || 'unknown').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (err) {
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

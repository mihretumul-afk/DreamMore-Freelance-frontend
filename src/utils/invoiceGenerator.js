import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatETB, formatDate } from './format';

const TX_TYPES = {
  payment:          'Payment',
  platform_fee:     'Platform Fee',
  processing_fee:   'Processing Fee',
  funds_held:       'Funds Held',
  funds_released:   'Funds Released',
  refund:           'Refund',
  withdrawal:       'Withdrawal',
  withdrawal_fee:   'Withdrawal Fee',
  adjustment:       'Adjustment',
};

/**
 * Generate a professional invoice/receipt PDF for a single transaction
 */
export function generateTransactionInvoice(transaction, userInfo = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const brandColor = [79, 70, 229]; // indigo-600
  const darkColor = [30, 41, 59]; // slate-800
  const grayColor = [107, 114, 128]; // gray-500
  const lightGray = [243, 244, 246]; // gray-100

  // ─── Header ───────────────────────────────────────────────────────
  // Brand bar
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DreamMore', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AppWorks Freelance Platform', 14, 26);

  // Receipt/Invoice badge
  const isCredit = transaction.direction === 'credit';
  const badgeText = isCredit ? 'RECEIPT' : 'INVOICE';
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(badgeText, pageWidth - 14, 18, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${transaction.id || Math.random().toString(36).substr(2, 9).toUpperCase()}`, pageWidth - 14, 26, { align: 'right' });

  // ─── Transaction Details Section ──────────────────────────────────
  const startY = 48;

  // Section title
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 14, startY);

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(14, startY + 4, pageWidth - 14, startY + 4);

  // Details table
  const details = [
    ['Date', formatDate(transaction.created_at)],
    ['Type', TX_TYPES[transaction.type] || transaction.type],
    ['Direction', isCredit ? 'Credit (Received)' : 'Debit (Paid)'],
    ['Description', transaction.description || '—'],
    ['Reference', transaction.reference || `TXN-${transaction.id}`],
  ];

  doc.autoTable({
    startY: startY + 8,
    head: [],
    body: details,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 0, right: 0 },
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: grayColor, cellWidth: 40 },
      1: { textColor: darkColor },
    },
    margin: { left: 14, right: 14 },
  });

  // ─── Amount Section ───────────────────────────────────────────────
  const amountY = doc.lastAutoTable.finalY + 15;

  // Amount card background
  doc.setFillColor(...lightGray);
  doc.roundedRect(14, amountY, pageWidth - 28, 35, 3, 3, 'F');

  // Amount label
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(isCredit ? 'Amount Received' : 'Amount Paid', 22, amountY + 12);

  // Amount value
  const amountColor = isCredit ? [16, 185, 129] : [239, 68, 68]; // emerald or red
  doc.setTextColor(...amountColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${isCredit ? '+' : '−'}${formatETB(Math.abs(transaction.amount))}`, 22, amountY + 26);

  // Fee (if any)
  if (transaction.fee > 0) {
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Platform Fee: ${formatETB(transaction.fee)}`, pageWidth - 22, amountY + 12, { align: 'right' });

    const netAmount = Math.abs(transaction.amount) - transaction.fee;
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Net: ${formatETB(netAmount)}`, pageWidth - 22, amountY + 22, { align: 'right' });
  }

  // ─── User Information Section ─────────────────────────────────────
  const userY = amountY + 50;

  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Information', 14, userY);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, userY + 4, pageWidth - 14, userY + 4);

  const userDetails = [
    ['Name', userInfo.name || '—'],
    ['Email', userInfo.email || '—'],
    ['Account Type', userInfo.role ? (userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)) : '—'],
  ];

  doc.autoTable({
    startY: userY + 8,
    head: [],
    body: userDetails,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 0, right: 0 },
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: grayColor, cellWidth: 40 },
      1: { textColor: darkColor },
    },
    margin: { left: 14, right: 14 },
  });

  // ─── Footer ───────────────────────────────────────────────────────
  const footerY = pageHeight - 30;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, footerY, pageWidth - 14, footerY);

  // Footer text
  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated document. No signature required.', 14, footerY + 8);

  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, footerY + 14);

  doc.text('DreamMore AppWorks · dreammore.com', pageWidth - 14, footerY + 14, { align: 'right' });

  // ─── Save ─────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${isCredit ? 'receipt' : 'invoice'}-${transaction.id || 'txn'}-${timestamp}.pdf`;
  doc.save(filename);

  return filename;
}

/**
 * Generate a bulk invoice PDF for multiple transactions
 */
export function generateBulkInvoices(transactions, userInfo = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const brandColor = [79, 70, 229];
  const darkColor = [30, 41, 59];
  const grayColor = [107, 114, 128];

  // ─── Title Page ───────────────────────────────────────────────────
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Report', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`DreamMore AppWorks · ${transactions.length} transactions`, 14, 30);

  // Date range
  const dates = transactions.map((t) => new Date(t.created_at)).sort((a, b) => a - b);
  const fromDate = dates[0];
  const toDate = dates[dates.length - 1];
  doc.text(
    `${formatDate(fromDate)} — ${formatDate(toDate)}`,
    pageWidth - 14, 30, { align: 'right' }
  );

  // Summary
  const totalCredits = transactions
    .filter((t) => t.direction === 'credit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalDebits = transactions
    .filter((t) => t.direction === 'debit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalFees = transactions
    .filter((t) => t.fee > 0)
    .reduce((sum, t) => sum + (parseFloat(t.fee) || 0), 0);

  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 55);

  const summaryData = [
    ['Total Credits', `${formatETB(totalCredits)}`],
    ['Total Debits', `${formatETB(totalDebits)}`],
    ['Total Fees', `${formatETB(totalFees)}`],
    ['Net Amount', `${formatETB(totalCredits - totalDebits)}`],
  ];

  doc.autoTable({
    startY: 60,
    head: [],
    body: summaryData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 0, right: 0 },
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: grayColor, cellWidth: 50 },
      1: { textColor: darkColor },
    },
    margin: { left: 14, right: 14 },
  });

  // ─── Transaction Table ────────────────────────────────────────────
  const tableY = doc.lastAutoTable.finalY + 15;

  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 14, tableY);

  const tableData = transactions.map((tx) => [
    formatDate(tx.created_at),
    TX_TYPES[tx.type] || tx.type,
    tx.direction === 'credit' ? 'Credit' : 'Debit',
    (tx.description || '—').substring(0, 40),
    `${tx.direction === 'credit' ? '+' : '−'}${formatETB(Math.abs(tx.amount))}`,
    tx.fee > 0 ? formatETB(tx.fee) : '—',
  ]);

  doc.autoTable({
    startY: tableY + 5,
    head: [['Date', 'Type', 'Direction', 'Description', 'Amount', 'Fee']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: brandColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 20 },
      3: { cellWidth: 45 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didParseCell: function (data) {
      if (data.column.index === 4 && data.section === 'body') {
        const value = data.cell.raw;
        if (value && value.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (value && value.startsWith('−')) {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
  });

  // ─── Save ─────────────────────────────────────────────────────────
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`transaction-report-${timestamp}.pdf`);
}

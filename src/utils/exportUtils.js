import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
 * Generate a timestamp string for filenames
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a CSV cell value
 */
function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export transactions as CSV
 */
export function exportTransactionsCSV(transactions, metadata = {}) {
  const headers = [
    'Date',
    'Type',
    'Direction',
    'Description',
    'Amount (ETB)',
    'Fee (ETB)',
    'Running Balance (ETB)',
  ];

  const rows = transactions.map((tx) => [
    formatDate(tx.created_at),
    TX_TYPES[tx.type] || tx.type,
    tx.direction === 'credit' ? 'Credit' : 'Debit',
    tx.description || '',
    tx.direction === 'credit' ? `+${tx.amount}` : `-${tx.amount}`,
    tx.fee > 0 ? tx.fee : '',
    tx.balance || '',
  ]);

  const csvContent = [
    // Metadata header
    'Transaction History',
    `Generated on: ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Total Transactions: ${metadata.total || transactions.length}`,
    '',
    // Headers
    headers.join(','),
    // Data rows
    ...rows.map((row) => row.map(escapeCSV).join(',')),
    '',
    // Summary
    'Summary',
    `Total Credits: ${formatETB(transactions.filter(t => t.direction === 'credit').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0))}`,
    `Total Debits: ${formatETB(transactions.filter(t => t.direction === 'debit').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0))}`,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `transactions-${getTimestamp()}.csv`);
}

/**
 * Export transactions as PDF
 */
export function exportTransactionsPDF(transactions, metadata = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction History', 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}  |  ${metadata.total || transactions.length} transactions`,
    14,
    30
  );

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 34, pageWidth - 14, 34);

  // Summary section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  const totalCredits = transactions
    .filter((t) => t.direction === 'credit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalDebits = transactions
    .filter((t) => t.direction === 'debit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  doc.text(`Total Credits:`, 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(formatETB(totalCredits), 55, 42);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Debits:`, 85, 42);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(239, 68, 68); // red-500
  doc.text(`-${formatETB(totalDebits)}`, 120, 42);

  // Table data
  const tableData = transactions.map((tx) => [
    formatDate(tx.created_at),
    TX_TYPES[tx.type] || tx.type,
    tx.direction === 'credit' ? 'Credit' : 'Debit',
    (tx.description || '—').substring(0, 40),
    `${tx.direction === 'credit' ? '+' : '−'}${formatETB(Math.abs(tx.amount))}`,
    tx.fee > 0 ? formatETB(tx.fee) : '—',
  ]);

  // Draw table
  autoTable(doc, {
    startY: 48,
    head: [['Date', 'Type', 'Direction', 'Description', 'Amount', 'Fee']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85], // slate-700
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
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
      if (data.column.index === 2 && data.section === 'body') {
        if (data.cell.raw === 'Credit') {
          data.cell.styles.textColor = [16, 185, 129];
        } else {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY || 48;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(156, 163, 175); // gray-400
  doc.text(
    `DreamMore Freelance Platform — Transaction Statement`,
    14,
    Math.min(finalY + 10, doc.internal.pageSize.getHeight() - 10)
  );

  doc.save(`transactions-${getTimestamp()}.pdf`);
}

/**
 * Export withdrawal history as CSV
 */
export function exportWithdrawalsCSV(withdrawals) {
  const headers = [
    'Reference',
    'Date',
    'Amount (ETB)',
    'Fee (ETB)',
    'Net Amount (ETB)',
    'Status',
  ];

  const rows = withdrawals.map((w) => [
    w.reference,
    formatDate(w.created_at),
    w.amount,
    w.fee,
    w.net_amount,
    w.status,
  ]);

  const csvContent = [
    'Withdrawal History',
    `Generated on: ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Total Withdrawals: ${withdrawals.length}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
    '',
    'Summary',
    `Total Amount: ${formatETB(withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0))}`,
    `Total Fees: ${formatETB(withdrawals.reduce((sum, w) => sum + (parseFloat(w.fee) || 0), 0))}`,
    `Total Net: ${formatETB(withdrawals.reduce((sum, w) => sum + (parseFloat(w.net_amount) || 0), 0))}`,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `withdrawals-${getTimestamp()}.csv`);
}

/**
 * Export admin payments as CSV
 */
export function exportAdminPaymentsCSV(payments) {
  const headers = [
    'Reference',
    'Date',
    'Type',
    'Status',
    'Payer',
    'Payee',
    'Amount (ETB)',
    'Platform Fee (ETB)',
    'Processing Fee (ETB)',
  ];

  const rows = payments.map((p) => [
    p.reference,
    formatDate(p.created_at),
    p.type?.replace('_', ' ') || '',
    p.status,
    p.payer?.name || '',
    p.payee?.name || '',
    p.amount,
    p.platform_fee || 0,
    p.processing_fee || 0,
  ]);

  const csvContent = [
    'Admin Payments Report',
    `Generated on: ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Total Payments: ${payments.length}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
    '',
    'Summary',
    `Total Volume: ${formatETB(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))}`,
    `Total Platform Fees: ${formatETB(payments.reduce((sum, p) => sum + (parseFloat(p.platform_fee) || 0), 0))}`,
    `Total Processing Fees: ${formatETB(payments.reduce((sum, p) => sum + (parseFloat(p.processing_fee) || 0), 0))}`,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `admin-payments-${getTimestamp()}.csv`);
}

/**
 * Export admin payments as PDF
 */
export function exportAdminPaymentsPDF(payments) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Admin Payments Report', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}  |  ${payments.length} payments`, 14, 28);

  // Summary
  const totalVolume = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalFees = payments.reduce((sum, p) => sum + (parseFloat(p.platform_fee) || 0), 0);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Volume: ${formatETB(totalVolume)}`, 14, 38);
  doc.text(`Total Fees: ${formatETB(totalFees)}`, 100, 38);

  // Table
  const tableData = payments.map((p) => [
    p.reference || '',
    formatDate(p.created_at),
    (p.type || '').replace('_', ' '),
    p.status,
    p.payer?.name || '—',
    p.payee?.name || '—',
    formatETB(p.amount),
    formatETB(p.platform_fee || 0),
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['Reference', 'Date', 'Type', 'Status', 'From', 'To', 'Amount', 'Fee']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: { fontSize: 7, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 28 },
      3: { cellWidth: 22 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
      6: { cellWidth: 28, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`admin-payments-${getTimestamp()}.pdf`);
}

/**
 * Export admin withdrawals as CSV
 */
export function exportAdminWithdrawalsCSV(withdrawals) {
  const headers = [
    'Reference',
    'Date',
    'User',
    'Method',
    'Amount (ETB)',
    'Fee (ETB)',
    'Net Amount (ETB)',
    'Status',
  ];

  const rows = withdrawals.map((w) => [
    w.reference,
    formatDate(w.created_at),
    w.user?.name || '',
    w.paymentMethod?.type || '',
    w.amount,
    w.fee,
    w.net_amount,
    w.status,
  ]);

  const csvContent = [
    'Admin Withdrawals Report',
    `Generated on: ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Total Withdrawals: ${withdrawals.length}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
    '',
    'Summary',
    `Total Amount: ${formatETB(withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0))}`,
    `Total Fees: ${formatETB(withdrawals.reduce((sum, w) => sum + (parseFloat(w.fee) || 0), 0))}`,
    `Total Net: ${formatETB(withdrawals.reduce((sum, w) => sum + (parseFloat(w.net_amount) || 0), 0))}`,
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `admin-withdrawals-${getTimestamp()}.csv`);
}

/**
 * Export admin withdrawals as PDF
 */
export function exportAdminWithdrawalsPDF(withdrawals) {
  const doc = new jsPDF('l', 'mm', 'a4');

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Admin Withdrawals Report', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}  |  ${withdrawals.length} withdrawals`, 14, 28);

  // Summary
  const totalAmount = withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
  const totalFees = withdrawals.reduce((sum, w) => sum + (parseFloat(w.fee) || 0), 0);
  const totalNet = withdrawals.reduce((sum, w) => sum + (parseFloat(w.net_amount) || 0), 0);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${formatETB(totalAmount)}`, 14, 38);
  doc.text(`Fees: ${formatETB(totalFees)}`, 80, 38);
  doc.text(`Net: ${formatETB(totalNet)}`, 140, 38);

  // Table
  const tableData = withdrawals.map((w) => [
    w.reference || '',
    formatDate(w.created_at),
    w.user?.name || '—',
    w.paymentMethod?.type || '—',
    formatETB(w.amount),
    formatETB(w.fee),
    formatETB(w.net_amount),
    w.status,
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['Reference', 'Date', 'User', 'Method', 'Amount', 'Fee', 'Net', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: { fontSize: 7, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 28, halign: 'right' },
      7: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`admin-withdrawals-${getTimestamp()}.pdf`);
}

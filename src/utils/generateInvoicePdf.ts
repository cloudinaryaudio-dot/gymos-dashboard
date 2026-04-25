import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { InvoiceSettings } from '@/hooks/useInvoiceSettings';

export interface InvoicePayment {
  id: string;
  amount: number;
  payment_date: string;
  method: string;
  status: string;
  note?: string | null;
}

export interface InvoiceMember {
  id: string;
  name: string;
  phone: string;
  start_date: string;
  expiry_date: string;
  plans?: { name: string; duration_days: number } | null;
}

export interface InvoiceData {
  member: InvoiceMember;
  payment?: InvoicePayment | null;
  totalPaid: number;
  planAmount?: number;
  settings: InvoiceSettings;
}

function durationLabel(days?: number): string {
  if (!days) return '—';
  if (days <= 31) return 'Monthly';
  if (days <= 95) return 'Quarterly';
  if (days <= 200) return 'Half-Yearly';
  if (days <= 400) return 'Yearly';
  return `${days} days`;
}

export function generateInvoicePdf(data: InvoiceData): void {
  const { member, payment, totalPaid, planAmount = 0, settings } = data;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // ── Header band ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(settings.gym_name || 'Gym', margin, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (settings.show_address && settings.address) doc.text(settings.address, margin, 62);
  const contactLine = [
    settings.contact_number,
    settings.show_email ? settings.email : '',
  ].filter(Boolean).join('  •  ');
  if (contactLine) doc.text(contactLine, margin, 76);

  // INVOICE label right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('INVOICE', pageW - margin, 50, { align: 'right' });

  y = 120;
  doc.setTextColor(15, 23, 42);

  // ── Invoice meta ──
  const invoiceId = `INV-${(payment?.id || member.id).slice(-6).toUpperCase()}`;
  const invoiceDate = payment?.payment_date || new Date().toISOString().split('T')[0];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice ID:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceId, margin + 70, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageW - margin - 130, y);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoiceDate), 'dd MMM yyyy'), pageW - margin - 100, y);

  y += 30;

  // ── Bill To ──
  doc.setFillColor(244, 244, 245);
  doc.rect(margin, y, pageW - margin * 2, 70, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BILL TO', margin + 12, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${member.name}`, margin + 12, y + 34);
  doc.text(`Phone: ${member.phone}`, margin + 12, y + 48);
  doc.text(`Member ID: ${member.id.slice(-8).toUpperCase()}`, margin + 12, y + 62);

  y += 90;

  // ── Payment table ──
  const cols = [
    { label: 'Description', x: margin + 10, w: 200 },
    { label: 'Duration', x: margin + 220, w: 80 },
    { label: 'Method', x: margin + 310, w: 80 },
    { label: 'Status', x: margin + 400, w: 60 },
    { label: 'Amount', x: pageW - margin - 10, w: 70, align: 'right' as const },
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageW - margin * 2, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  cols.forEach((c) => doc.text(c.label, c.x, y + 18, { align: c.align ?? 'left' }));

  y += 28;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');

  const rowAmt = payment ? Number(payment.amount) : planAmount;
  const rowMethod = payment ? payment.method.replace('_', ' ') : '—';
  const rowStatus = payment ? payment.status : 'pending';

  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, pageW - margin * 2, 32, 'F');
  doc.text(member.plans?.name ?? 'Membership', cols[0].x, y + 20);
  doc.text(durationLabel(member.plans?.duration_days), cols[1].x, y + 20);
  doc.text(rowMethod, cols[2].x, y + 20);
  doc.text(rowStatus.toUpperCase(), cols[3].x, y + 20);
  doc.text(`Rs. ${rowAmt.toLocaleString('en-IN')}`, cols[4].x, y + 20, { align: 'right' });

  // border
  doc.setDrawColor(220, 220, 220);
  doc.rect(margin, y - 28, pageW - margin * 2, 60);

  y += 50;

  // ── Summary ──
  const total = rowAmt;
  const paid = payment?.status === 'paid' ? Number(payment.amount) : 0;
  const balance = Math.max(0, total - paid);

  const sumX = pageW - margin - 200;
  doc.setFontSize(10);

  const sumRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, sumX, y);
    doc.text(value, pageW - margin, y, { align: 'right' });
    y += 18;
  };

  sumRow('Subtotal:', `Rs. ${total.toLocaleString('en-IN')}`);
  sumRow('Paid:', `Rs. ${paid.toLocaleString('en-IN')}`);
  if (balance > 0) {
    doc.setTextColor(220, 38, 38);
    sumRow('Balance Due:', `Rs. ${balance.toLocaleString('en-IN')}`, true);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Due Date: ${format(new Date(member.expiry_date), 'dd MMM yyyy')}`,
      pageW - margin,
      y,
      { align: 'right' },
    );
    y += 16;
  }
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1);
  doc.line(sumX, y, pageW - margin, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL', sumX, y);
  doc.text(`Rs. ${total.toLocaleString('en-IN')}`, pageW - margin, y, { align: 'right' });
  y += 30;

  // Total paid (lifetime) note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Lifetime amount paid by member: Rs. ${totalPaid.toLocaleString('en-IN')}`, margin, y);
  doc.setTextColor(15, 23, 42);
  y += 24;

  // ── Notes ──
  if (payment?.note) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(payment.note, pageW - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 12 + 10;
  }

  // ── Terms ──
  if (settings.show_terms && settings.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Terms & Conditions:', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const termLines = doc.splitTextToSize(settings.terms, pageW - margin * 2);
    doc.text(termLines, margin, y);
    y += termLines.length * 12 + 10;
  }

  // ── Thank you ──
  if (settings.thank_you_message) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    const tyLines = doc.splitTextToSize(settings.thank_you_message, pageW - margin * 2);
    doc.text(tyLines, pageW / 2, y + 10, { align: 'center' });
  }

  // ── Footer ──
  if (settings.show_footer && settings.footer_text) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(settings.footer_text, pageW / 2, pageH - 24, { align: 'center' });
  }

  doc.save(`Invoice-${invoiceId}-${member.name.replace(/\s+/g, '_')}.pdf`);
}

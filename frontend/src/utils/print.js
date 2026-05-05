const DEFAULT_COMPANY = {
  name: 'Poultry Farm Management',
  nameUrdu: 'پولٹری فارم مینجمنٹ',
  address: 'Farm Road, City',
  phone: '+92-300-0000000',
  ntn: '0000000-0',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveCompanyDetails(customCompany) {
  try {
    const raw = window.localStorage.getItem('print_company_profile');
    const stored = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_COMPANY, ...stored, ...(customCompany || {}) };
  } catch {
    return { ...DEFAULT_COMPANY, ...(customCompany || {}) };
  }
}

export function printHtmlDocument({ title, bodyHtml, company, showSignatures = true }) {
  const companyProfile = resolveCompanyDetails(company);
  const printDate = new Date().toLocaleString();
  const fullHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
      }
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", "Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", Calibri, Arial, sans-serif;
        color: #0f172a;
      }
      .print-page {
        width: 186mm;
        min-height: 272mm;
        margin: 0 auto;
      }
      .company-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 10px;
        margin-bottom: 10px;
      }
      .company-left h2 {
        margin: 0;
        font-size: 20px;
      }
      .company-left .urdu {
        direction: rtl;
        text-align: right;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .company-meta {
        font-size: 12px;
        color: #334155;
        margin-top: 3px;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 20px;
      }
      .meta {
        margin-bottom: 12px;
        color: #475569;
        font-size: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        text-align: left;
        font-size: 12px;
      }
      th {
        background: #f8fafc;
        text-transform: uppercase;
        font-size: 11px;
      }
      .amount {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .summary {
        margin-top: 16px;
        font-size: 13px;
      }
      .signatures {
        margin-top: 36px;
        display: flex;
        justify-content: space-between;
        gap: 24px;
      }
      .signature-block {
        width: 32%;
        border-top: 1px solid #0f172a;
        padding-top: 8px;
        text-align: center;
        font-size: 12px;
      }
      .footer-note {
        margin-top: 18px;
        text-align: center;
        color: #64748b;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="print-page">
      <div class="company-header">
        <div class="company-left">
          <div class="urdu">${escapeHtml(companyProfile.nameUrdu)}</div>
          <h2>${escapeHtml(companyProfile.name)}</h2>
          <div class="company-meta">Address: ${escapeHtml(companyProfile.address)}</div>
          <div class="company-meta">Phone: ${escapeHtml(companyProfile.phone)} | NTN: ${escapeHtml(companyProfile.ntn)}</div>
        </div>
        <div class="company-meta">Printed: ${escapeHtml(printDate)}</div>
      </div>
      ${bodyHtml}
      ${
        showSignatures
          ? `<div class="signatures">
              <div class="signature-block">Prepared By<br/>تیار کردہ</div>
              <div class="signature-block">Checked By<br/>جانچنے والا</div>
              <div class="signature-block">Authorized Signature<br/>مجاز دستخط</div>
            </div>`
          : ''
      }
      <div class="footer-note">Computer generated document.</div>
    </div>
  </body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const printFromFrame = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      iframe.remove();
      return false;
    }
    frameWindow.focus();
    frameWindow.print();
    setTimeout(() => iframe.remove(), 1200);
    return true;
  };

  try {
    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc) throw new Error('Print frame unavailable');
    frameDoc.open();
    frameDoc.write(fullHtml);
    frameDoc.close();

    // Give browser a moment to layout before triggering print.
    setTimeout(() => {
      printFromFrame();
    }, 250);
    return true;
  } catch {
    iframe.remove();
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) return false;
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
    return true;
  }
}

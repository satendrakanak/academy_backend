import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';

type PdfMode = 'invoice' | 'certificate';

async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function renderPdf<T extends object>(
  mode: PdfMode,
  payload: T,
): Promise<Buffer> {
  const template =
    mode === 'certificate' ? certificateTemplate : invoiceTemplate;

  const html = Handlebars.compile(template)(payload);

  return renderHtmlToPdf(html);
}

const certificateTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4 landscape; margin: 0; }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      width: 297mm;
      height: 210mm;
      background: #fff;
      font-family: Arial, sans-serif;
    }

    .certificate {
      width: 297mm;
      height: 210mm;
      padding: 6mm;
      background: #fff;
    }

    .card {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      border-radius: 14mm;
      background: #fff;
      border: 3mm solid #d8a735;
      box-shadow: 0 8mm 18mm rgba(0,0,0,0.18);
    }

    .dash-border {
      position: absolute;
      inset: 5mm;
      border: 1px dashed rgba(216,167,53,0.65);
      border-radius: 10mm;
      z-index: 20;
      pointer-events: none;
    }

    .header-svg {
      position: absolute;
      inset: 0 0 auto 0;
      width: 100%;
      height: 72mm;
      z-index: 1;
    }

    .logo {
      position: absolute;
      top: 9mm;
      left: 0;
      right: 0;
      z-index: 3;
      text-align: center;
      color: #fff;
    }

    .logo-box {
      width: 16mm;
      height: 16mm;
      margin: 0 auto 4mm;
      border: 1.2mm solid rgba(255,255,255,0.9);
      border-radius: 4mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9mm;
      font-weight: 800;
    }

   .logo-text {
  font-size: 3.2mm;
  font-weight: 800;
  letter-spacing: 2.3mm;
  padding-left: 10mm;
  text-transform: uppercase;
  transform: translateX(3mm);
}
    .content {
      position: relative;
      z-index: 5;
      text-align: center;
      padding-top: 50mm;
    }

    .title-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 7mm;
    }

    .title {
      margin: 0;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 17mm;
      line-height: 1;
      color: #071847;
      font-weight: 900;
      text-shadow: 0 1mm 1.5mm rgba(7,24,71,0.18);
    }

    .ornament {
      color: #d8a735;
      font-size: 7mm;
      line-height: 1;
    }

    .presented {
      margin-top: 4mm;
      font-size: 5mm;
      color: #46546f;
    }

    .photo {
      width: 30mm;
      height: 30mm;
      margin: 4mm auto 3.5mm;
      border-radius: 4mm;
      border: 1.2mm solid #f0cc71;
      padding: 1mm;
      background: #fff;
      box-shadow: 0 3mm 8mm rgba(0,0,0,0.14);
      overflow: hidden;
    }

    .photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 2.8mm;
      display: block;
    }

    .photo-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 2.8mm;
      background: linear-gradient(135deg, #edf3ff, #ffe9e4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #071847;
      font-size: 12mm;
      font-weight: 900;
    }

    .watermark {
      position: absolute;
      top: 76mm;
      left: 50%;
      transform: translateX(-50%);
      width: 120mm;
      height: 72mm;
      opacity: 0.045;
      z-index: 2;
    }

    .laurel-left,
    .laurel-right {
      position: absolute;
      top: 78mm;
      width: 38mm;
      height: 82mm;
      opacity: 0.045;
      z-index: 2;
    }

    .laurel-left { left: 72mm; }
    .laurel-right { right: 72mm; transform: scaleX(-1); }

    .name {
      margin-top: 0;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 13.5mm;
      line-height: 1;
      color: #a61922;
      font-weight: 900;
      text-shadow: 0 0.8mm 1mm rgba(166,25,34,0.14);
      white-space: nowrap;
    }

    .name-line {
      width: 116mm;
      height: 0.5mm;
      margin: 3mm auto 0;
      background: linear-gradient(90deg, transparent, #d8a735, transparent);
      position: relative;
    }

    .name-line::after {
      content: '✧';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      color: #d8a735;
      font-size: 7mm;
      padding: 0 4mm;
    }

    .completion {
      margin-top: 5mm;
      font-size: 4.7mm;
      color: #46546f;
    }

    .course-row {
  margin-top: 2mm;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3.5mm;
  position: relative;
  z-index: 10;
}

    .course-line {
      width: 34mm;
      height: 0.45mm;
      background: linear-gradient(90deg, transparent, #d8a735);
    }

    .course-line.right {
      background: linear-gradient(90deg, #d8a735, transparent);
    }

    .stars {
      color: #d8a735;
      font-size: 4.7mm;
      letter-spacing: 0.8mm;
    }

    .course {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 9mm;
      color: #071847;
      font-weight: 900;
      white-space: nowrap;
    }

    .footer {
  position: absolute;
  left: 48mm;
  right: 48mm;
  bottom: 8mm;
  z-index: 7;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

    .footer-box {
      width: 60mm;
      text-align: center;
      color: #071847;
    }

    .footer-icon {
      font-size: 7mm;
      margin-bottom: 2mm;
    }

    .footer-icon svg {
  width: 8mm;
  height: 8mm;
  display: block;
  margin: 0 auto 2mm;
}

    .footer-line {
      height: 0.45mm;
      background: linear-gradient(90deg, transparent, #d8a735, transparent);
      margin-bottom: 2mm;
    }

    .footer-label {
      font-size: 4mm;
      color: #46546f;
      margin-bottom: 1.5mm;
    }

    .footer-value {
      font-size: 4.7mm;
      color: #071847;
      font-weight: 900;
      line-height: 1.15;
    }

    .seal {
  position: absolute;
  left: 50%;
  bottom: 1mm;
  transform: translateX(-50%);
  width: 31mm;
  height: 31mm;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, #fff7c8, #e6be4e 45%, #c88918);
  border: 1mm solid #d49c28;
  box-shadow: 0 4mm 9mm rgba(0,0,0,0.18);
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

   .seal::before,
.seal::after {
  content: '';
  position: absolute;
  bottom: -13.5mm;
  width: 8.5mm;
  height: 18mm;
  background: linear-gradient(180deg, #c51f2f, #8f111d);
  z-index: -1;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%);
  box-shadow: 0 2mm 3mm rgba(0,0,0,0.15);
}

.seal::before {
  left: 7.2mm;
  transform: rotate(10deg);
}

.seal::after {
  right: 7.2mm;
  transform: rotate(-10deg);
}

.seal-inner {
  width: 23mm;
  height: 23mm;
  border-radius: 50%;
  background: #fff8dc;
  border: 0.5mm dashed #8b6515;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #071847;
  font-size: 3.1mm;
  font-weight: 900;
  line-height: 1.15;
  text-transform: uppercase;
}


    
   
    .soft-left {
      position: absolute;
      left: -25mm;
      bottom: -22mm;
      width: 66mm;
      height: 66mm;
      border-radius: 50%;
      background: rgba(50,80,210,0.09);
      z-index: 2;
    }

    .soft-right {
      position: absolute;
      right: -24mm;
      bottom: -18mm;
      width: 68mm;
      height: 68mm;
      border-radius: 50%;
      background: rgba(210,55,65,0.09);
      z-index: 2;
    }
  </style>
</head>

<body>
  <div class="certificate">
    <div class="card">

      <svg class="header-svg" viewBox="0 0 1123 272" preserveAspectRatio="none">
        <defs>
          <linearGradient id="headGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#061743"/>
            <stop offset="52%" stop-color="#3047d8"/>
            <stop offset="100%" stop-color="#d14755"/>
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1123" height="165" fill="url(#headGrad)" />

       <path
  d="M0,125 C160,65 285,75 430,120 C570,165 710,165 865,105 C965,70 1050,70 1123,100 L1123,165 L0,165 Z"
  fill="#e2b23f"
/>

<path
  d="M0,135 C160,75 285,85 430,130 C570,175 710,175 865,115 C965,80 1050,80 1123,110 L1123,272 L0,272 Z"
  fill="#ffffff"
/>
      </svg>

      <div class="dash-border"></div>
      <div class="soft-left"></div>
      <div class="soft-right"></div>

      <div class="logo">
        <div class="logo-box">U</div>
        <div class="logo-text">UNITUS HEALTH ACADEMY</div>
      </div>

      <svg class="watermark" viewBox="0 0 500 300">
        <path d="M80 120 L250 35 L420 120 L250 205 Z" fill="#071847"/>
        <rect x="180" y="120" width="140" height="95" fill="#071847"/>
        <path d="M200 215 H300 V250 H200 Z" fill="#071847"/>
      </svg>

      <svg class="laurel-left" viewBox="0 0 120 260">
        <g fill="#071847">
          <ellipse cx="75" cy="25" rx="12" ry="28" transform="rotate(35 75 25)"/>
          <ellipse cx="58" cy="60" rx="12" ry="28" transform="rotate(25 58 60)"/>
          <ellipse cx="45" cy="98" rx="12" ry="28" transform="rotate(15 45 98)"/>
          <ellipse cx="38" cy="137" rx="12" ry="28" transform="rotate(5 38 137)"/>
          <ellipse cx="42" cy="178" rx="12" ry="28" transform="rotate(-10 42 178)"/>
          <ellipse cx="56" cy="215" rx="12" ry="28" transform="rotate(-25 56 215)"/>
        </g>
      </svg>

      <svg class="laurel-right" viewBox="0 0 120 260">
        <g fill="#071847">
          <ellipse cx="75" cy="25" rx="12" ry="28" transform="rotate(35 75 25)"/>
          <ellipse cx="58" cy="60" rx="12" ry="28" transform="rotate(25 58 60)"/>
          <ellipse cx="45" cy="98" rx="12" ry="28" transform="rotate(15 45 98)"/>
          <ellipse cx="38" cy="137" rx="12" ry="28" transform="rotate(5 38 137)"/>
          <ellipse cx="42" cy="178" rx="12" ry="28" transform="rotate(-10 42 178)"/>
          <ellipse cx="56" cy="215" rx="12" ry="28" transform="rotate(-25 56 215)"/>
        </g>
      </svg>

      <div class="content">
        <div class="title-row">
          <div class="ornament">✦</div>
          <h1 class="title">Certificate of Completion</h1>
          <div class="ornament">✦</div>
        </div>

        <div class="presented">This certificate is proudly presented to</div>

        <div class="photo">
          {{#if avatarUrl}}
            <img src="{{avatarUrl}}" />
          {{else}}
            <div class="photo-placeholder">{{firstNameInitial}}</div>
          {{/if}}
        </div>

        <div class="name">{{name}}</div>
        <div class="name-line"></div>

        <div class="completion">for successfully completing</div>

        <div class="course-row">
          <div class="course-line"></div>
          <div class="stars">★★★</div>
          <div class="course">{{courseTitle}}</div>
          <div class="stars">★★★</div>
          <div class="course-line right"></div>
        </div>
      </div>

      <div class="footer">
  <div class="footer-box">
    <div class="footer-icon">
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="#071847" stroke-width="2"/>
        <path d="M8 3v4M16 3v4M3 10h18" stroke="#071847" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2" stroke="#071847" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="footer-line"></div>
    <div class="footer-label">Issued on</div>
    <div class="footer-value">{{issuedAt}}</div>
  </div>

  <div class="footer-box">
    <div class="footer-icon">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" stroke="#071847" stroke-width="2"/>
        <path d="M9 12l2 2 4-5" stroke="#071847" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="footer-line"></div>
    <div class="footer-label">Certificate ID</div>
    <div class="footer-value">{{certificateNumber}}</div>
  </div>
</div>

      <div class="seal">
        <div class="seal-inner">
          Certified<br/>Award
        </div>
      </div>

    </div>
  </div>
</body>
</html>
`;

const invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      background: #ffffff;
      color: #111827;
      font-family: Arial, sans-serif;
      font-size: 13px;
    }

    .invoice {
      width: 210mm;
      min-height: 297mm;
      padding: 18mm;
      background: #ffffff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111827;
      padding-bottom: 18px;
    }

    .brand h1 {
      margin: 0;
      font-size: 26px;
      letter-spacing: 1px;
      color: #111827;
    }

    .brand p {
      margin: 6px 0 0;
      color: #4b5563;
      line-height: 1.5;
    }

    .invoice-title {
      text-align: right;
    }

    .invoice-title h2 {
      margin: 0;
      font-size: 32px;
      color: #111827;
    }

    .invoice-title p {
      margin: 6px 0 0;
      color: #4b5563;
    }

    .section {
      margin-top: 24px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .box {
      border: 1px solid #e5e7eb;
      padding: 14px;
      border-radius: 8px;
    }

    .box-title {
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .muted {
      color: #4b5563;
      line-height: 1.6;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    th {
      background: #f3f4f6;
      color: #111827;
      text-align: left;
      padding: 11px;
      border: 1px solid #e5e7eb;
      font-size: 13px;
    }

    td {
      padding: 11px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
    }

    .right {
      text-align: right;
    }

    .center {
      text-align: center;
    }

    .summary {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
    }

    .amount-words {
      width: 55%;
      border: 1px solid #e5e7eb;
      padding: 14px;
      border-radius: 8px;
      line-height: 1.6;
    }

    .totals {
      width: 38%;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 11px 14px;
      border-bottom: 1px solid #e5e7eb;
    }

    .total-row:last-child {
      border-bottom: 0;
    }

    .grand {
      background: #111827;
      color: #ffffff;
      font-weight: 700;
      font-size: 15px;
    }

    .terms {
      margin-top: 28px;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      color: #4b5563;
      line-height: 1.6;
    }

    .terms h3 {
      margin: 0 0 8px;
      color: #111827;
      font-size: 15px;
    }

    .footer {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .signature {
      width: 180px;
      text-align: center;
      border-top: 1px solid #111827;
      padding-top: 8px;
      color: #111827;
      font-weight: 700;
    }
  </style>
</head>

<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">
        <h1>UNITUS HEALTH ACADEMY</h1>
        <p>
          Online Learning Platform<br/>
          Email: support@unitusacademy.com<br/>
          Website: www.unitusacademy.com
        </p>
      </div>

      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p><strong>Invoice No:</strong> {{invoiceNumber}}</p>
        <p><strong>Date:</strong> {{issuedAt}}</p>
      </div>
    </div>

    <div class="section grid">
      <div class="box">
        <div class="box-title">Bill To</div>
        <div class="muted">
          {{customerName}}<br/>
          {{customerEmail}}<br/>
          {{billingAddress}}
        </div>
      </div>

      <div class="box">
        <div class="box-title">Payment Details</div>
        <div class="muted">
          <strong>Payment Method:</strong> {{paymentMethod}}<br/>
          <strong>Payment ID:</strong> {{paymentId}}<br/>
          <strong>Order ID:</strong> {{gatewayOrderId}}
        </div>
      </div>
    </div>

    <div class="section">
      <table>
        <thead>
          <tr>
            <th style="width: 52%;">Description</th>
            <th class="center" style="width: 12%;">Qty</th>
            <th class="right" style="width: 18%;">Price</th>
            <th class="right" style="width: 18%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td>
              <strong>{{title}}</strong><br/>
              <span class="muted">Course purchase</span>
            </td>
            <td class="center">{{quantity}}</td>
            <td class="right">₹{{price}}</td>
            <td class="right">₹{{amount}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="amount-words">
        <strong>Amount in words:</strong><br/>
        {{amountInWords}}
      </div>

      <div class="totals">
        <div class="total-row">
          <span>Sub Total</span>
          <strong>₹{{subTotal}}</strong>
        </div>
        <div class="total-row">
          <span>Discount</span>
          <strong>₹{{discount}}</strong>
        </div>
        <div class="total-row">
          <span>Tax</span>
          <strong>₹{{tax}}</strong>
        </div>
        <div class="total-row grand">
          <span>Total</span>
          <span>₹{{totalAmount}}</span>
        </div>
      </div>
    </div>

    <div class="terms">
      <h3>Terms & Conditions</h3>
      <div>
        1. This is a computer-generated invoice and does not require a physical signature.<br/>
        2. Course access will be provided as per the academy policy after successful payment.<br/>
        3. Fees once paid are subject to the refund and cancellation policy of Unitus Health Academy.<br/>
        4. For billing support, contact support@unitusacademy.com.
      </div>
    </div>

    <div class="footer">
      <div class="muted">
        Thank you for choosing Unitus Health Academy.
      </div>

      <div class="signature">
        Authorized Signatory
      </div>
    </div>
  </div>
</body>
</html>
`;

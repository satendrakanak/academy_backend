import { Injectable } from '@nestjs/common';
import { Course } from 'src/courses/course.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class CertificateTemplateProvider {
  renderSvg(params: {
    user: User;
    course: Course;
    certificateNumber: string;
    issuedAt: Date;
    avatarUrl?: string | null;
  }): string {
    const studentName = this.escapeXml(
      [params.user.firstName, params.user.lastName].filter(Boolean).join(' '),
    );
    const courseTitle = this.escapeXml(params.course.title);
    const issuedDate = this.escapeXml(
      params.issuedAt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    );
    const certificateNumber = this.escapeXml(params.certificateNumber);
    const initials = this.escapeXml(
      `${params.user.firstName?.[0] ?? 'U'}${params.user.lastName?.[0] ?? ''}`
        .trim()
        .toUpperCase(),
    );

    const avatar = params.avatarUrl
      ? `<image href="${this.escapeXml(params.avatarUrl)}" x="790" y="140" width="112" height="112" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />`
      : `<circle cx="846" cy="196" r="56" fill="#f8d6ca" />
         <text x="846" y="211" text-anchor="middle" font-size="34" font-family="Georgia, serif" font-weight="700" fill="#9f2d20">${initials}</text>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="792" viewBox="0 0 1120 792">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#102048"/>
      <stop offset="45%" stop-color="#304fdb"/>
      <stop offset="100%" stop-color="#e34b44"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff2b8"/>
      <stop offset="100%" stop-color="#d99b31"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#102048" flood-opacity="0.18"/>
    </filter>
    <clipPath id="avatarClip">
      <circle cx="846" cy="196" r="56" />
    </clipPath>
  </defs>

  <rect width="1120" height="792" fill="#f7f3ee"/>
  <rect x="48" y="48" width="1024" height="696" rx="34" fill="white" filter="url(#shadow)"/>
  <rect x="70" y="70" width="980" height="652" rx="26" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <rect x="92" y="92" width="936" height="608" rx="20" fill="none" stroke="#f2dfaa" stroke-width="1.5" stroke-dasharray="8 10"/>
  <path d="M70 220 C205 120 310 135 420 205 C555 291 670 283 810 190 C910 124 986 132 1050 180 L1050 70 L70 70 Z" fill="url(#bg)" opacity="0.95"/>
  <circle cx="102" cy="682" r="126" fill="#304fdb" opacity="0.08"/>
  <circle cx="1036" cy="700" r="168" fill="#e34b44" opacity="0.08"/>

  <text x="560" y="154" text-anchor="middle" font-size="21" font-family="Arial, sans-serif" font-weight="700" letter-spacing="8" fill="#f7f3ee">UNITUS HEALTH ACADEMY</text>
  <text x="560" y="214" text-anchor="middle" font-size="64" font-family="Georgia, serif" font-weight="700" fill="#102048">Certificate of Completion</text>
  <text x="560" y="271" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#64748b">This certificate is proudly presented to</text>

  <line x1="284" y1="350" x2="836" y2="350" stroke="#e7c36e" stroke-width="2"/>
  <text x="560" y="333" text-anchor="middle" font-size="52" font-family="Georgia, serif" font-weight="700" fill="#9f2d20">${studentName}</text>

  <text x="560" y="405" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#64748b">for successfully completing</text>
  <text x="560" y="461" text-anchor="middle" font-size="36" font-family="Georgia, serif" font-weight="700" fill="#102048">${courseTitle}</text>

  <g>
    <circle cx="846" cy="196" r="62" fill="white" opacity="0.9"/>
    ${avatar}
    <circle cx="846" cy="196" r="58" fill="none" stroke="#f2dfaa" stroke-width="5"/>
  </g>

  <g transform="translate(461 510)">
    <circle cx="99" cy="74" r="74" fill="url(#gold)"/>
    <circle cx="99" cy="74" r="58" fill="#fff8dc"/>
    <text x="99" y="68" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" font-weight="700" fill="#9f2d20" letter-spacing="3">CERTIFIED</text>
    <text x="99" y="94" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#9f2d20">Unitus Academy</text>
    <path d="M59 132 L38 192 L78 174 L102 212 L118 148 Z" fill="#d99b31"/>
    <path d="M139 132 L160 192 L120 174 L96 212 L80 148 Z" fill="#b77722"/>
  </g>

  <text x="190" y="644" font-size="16" font-family="Arial, sans-serif" fill="#64748b">Issued on</text>
  <text x="190" y="675" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#102048">${issuedDate}</text>
  <line x1="190" y1="622" x2="400" y2="622" stroke="#102048" stroke-width="1.5"/>

  <text x="720" y="644" font-size="16" font-family="Arial, sans-serif" fill="#64748b">Certificate ID</text>
  <text x="720" y="675" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#102048">${certificateNumber}</text>
  <line x1="720" y1="622" x2="930" y2="622" stroke="#102048" stroke-width="1.5"/>
</svg>`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailJobData {
  to: string;
  subject: string;
  html: string;
}

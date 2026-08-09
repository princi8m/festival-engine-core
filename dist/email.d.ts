import { Transporter } from "nodemailer";
export interface EmailAttachment {
    filename: string;
    content: Buffer;
    contentType: string;
}
export interface GmailCredentials {
    user: string;
    appPassword: string;
}
export interface SendCertificateEmailInput {
    credentials: GmailCredentials;
    fromName: string;
    to: string;
    subject: string;
    html: string;
    attachments: EmailAttachment[];
}
/**
 * Nodemailer's defaults (2min connection, 10min socket) mean one bad connection to Gmail
 * can hang a request for a very long time — with a small DB connection pool, a single
 * stuck send can starve every other page on the site (the 2026-08-05 incident). Fail fast
 * instead. Each call creates its own transport rather than sharing one across a batch —
 * matches how this was always used (one send per call), no connection-pooling regression.
 */
export declare function createGmailTransport(credentials: GmailCredentials): Transporter;
export declare function sendCertificateEmail(input: SendCertificateEmailInput): Promise<void>;
//# sourceMappingURL=email.d.ts.map
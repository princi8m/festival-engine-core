"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGmailTransport = createGmailTransport;
exports.sendCertificateEmail = sendCertificateEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Nodemailer's defaults (2min connection, 10min socket) mean one bad connection to Gmail
 * can hang a request for a very long time — with a small DB connection pool, a single
 * stuck send can starve every other page on the site (the 2026-08-05 incident). Fail fast
 * instead. Each call creates its own transport rather than sharing one across a batch —
 * matches how this was always used (one send per call), no connection-pooling regression.
 */
function createGmailTransport(credentials) {
    return nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: credentials.user, pass: credentials.appPassword },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });
}
async function sendCertificateEmail(input) {
    const transport = createGmailTransport(input.credentials);
    await transport.sendMail({
        from: `"${input.fromName}" <${input.credentials.user}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
    });
}
//# sourceMappingURL=email.js.map
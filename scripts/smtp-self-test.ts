import 'dotenv/config';
import nodemailer from 'nodemailer';

async function main() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const enabled = process.env.SMTP_ENABLED !== 'false';

  console.log('SMTP_ENABLED=', enabled);
  console.log('HOST=', host);
  console.log('USER=', user);
  console.log('FROM=', from);
  console.log('PASS set=', Boolean(pass && pass.trim()));

  if (!enabled || !host || !user || !pass) {
    console.log('RESULT=SKIPPED_NOT_CONFIGURED');
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  try {
    await transport.verify();
    console.log('VERIFY=OK');
    const info = await transport.sendMail({
      from,
      to: user,
      subject: 'Yaser USMLE SMTP test',
      html: `<p>SMTP works. Sent at ${new Date().toISOString()}</p>`,
    });
    console.log('SEND=OK', info.messageId);
  } catch (err) {
    console.error('RESULT=FAIL', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

void main();

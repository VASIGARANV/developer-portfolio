const nodemailer = require('nodemailer');
const path = require('path');
const { personalData } = require(path.join(__dirname, '..', 'utils', 'data', 'personal-data'));

const user = process.env.EMAIL_ADDRESS;
const pass = process.env.GMAIL_PASSKEY;

if (!user || !pass) {
  console.error('\nMissing environment variables. Set EMAIL_ADDRESS and GMAIL_PASSKEY and re-run.');
  console.error('Example (PowerShell):');
  console.error('$env:EMAIL_ADDRESS="you@example.com"; $env:GMAIL_PASSKEY="your_app_password"; node scripts/test-email.js\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: { user, pass },
});

(async () => {
  try {
    console.log('Verifying SMTP transporter...');
    await transporter.verify();
    console.log('SMTP verified — ready to send.');

    const to = personalData.email || user;
    console.log(`Sending test email to ${to}...`);

    const info = await transporter.sendMail({
      from: `Portfolio Test <${user}>`,
      to,
      subject: 'Portfolio SMTP Test',
      text: 'This is a test email sent from the portfolio test script. If you receive this, SMTP is working.',
    });

    console.log('Test email sent. Response:', info.response || info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('\nSMTP test failed:');
    console.error(err);
    process.exit(1);
  }
})();

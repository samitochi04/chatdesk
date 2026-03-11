const nodemailer = require("nodemailer");
const config = require("../config");

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const sendContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    await transporter.sendMail({
      from: `"ChatDesk Contact" <${config.smtp.user}>`,
      replyTo: email,
      to: config.smtp.contactEmail,
      subject: `[ChatDesk Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendContactMessage };

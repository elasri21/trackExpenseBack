import nodemailer from 'nodemailer';


const sendEmail = async (to, subject, htmlContent) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    await transporter.sendMail({
        from: `Tracker<${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
    });
};

export default sendEmail;
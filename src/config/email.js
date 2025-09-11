const nodemailer = require('nodemailer');


exports.sendEmail = async (to, subject, text) => {
    try {
        // Create a transporter object using SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Set up email data
        const mailOptions = {
            from: process.env.EMAIL_USER, // sender address
            to, // list of receivers
            subject, // Subject line
            text // plain text body
        };

        // Send mail with defined transport object
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.log('Error sending email:', error);
    }
}

// Enhanced email function with HTML support
exports.sendTemplateEmail = async (to, subject, htmlContent, textContent) => {
    try {
        // Create a transporter object using SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Set up email data with HTML support
        const mailOptions = {
            from: `Car Rental Service <${process.env.EMAIL_USER}>`, // sender address with name
            to, // list of receivers
            subject, // Subject line
            text: textContent, // plain text body (fallback)
            html: htmlContent // HTML body
        };

        // Send mail with defined transport object
        await transporter.sendMail(mailOptions);
        console.log('Template email sent successfully');
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.log('Error sending template email:', error);
        return { success: false, message: error.message };
    }
}
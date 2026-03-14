import axios from "axios";

const RESEND_API_URL = "https://api.resend.com/emails";

const buildPasswordResetHtml = ({ fullName, otp }) => {
    const firstName = fullName?.trim()?.split(" ")?.[0] || "Traveler";

    return `
        <div style="font-family: Arial, sans-serif; background: #f5f1eb; padding: 24px; color: #292524;">
            <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e7e5e4;">
                <h1 style="margin: 0 0 12px; font-size: 24px; color: #92400e;">Lakbay Intramuros</h1>
                <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">Use the verification code below to reset your password.</p>
                <div style="margin: 24px 0; padding: 20px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; letter-spacing: 10px; font-weight: 700; color: #9a3412;">${otp}</div>
                </div>
                <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6;">This code will expire in 10 minutes.</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #57534e;">If you did not request a password reset, you can safely ignore this email.</p>
            </div>
        </div>
    `;
};

export const sendPasswordResetOtpEmail = async ({ email, fullName, otp }) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    if (!resendApiKey || !emailFrom) {
        if (process.env.NODE_ENV === "development") {
            console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
            return { mockOtp: otp, provider: "development" };
        }

        throw new Error("Email delivery is not configured");
    }

    await axios.post(
        RESEND_API_URL,
        {
            from: emailFrom,
            to: [email],
            subject: "Your Lakbay Intramuros password reset code",
            html: buildPasswordResetHtml({ fullName, otp }),
            text: `Your Lakbay Intramuros password reset code is ${otp}. This code expires in 10 minutes.`,
        },
        {
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
        }
    );

    return { provider: "resend" };
};

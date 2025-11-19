import nodemailer from "nodemailer";
import { emailVerificationTemplate, otpTemplate } from "./templates.js";
import {
  EMAIL_CREDENTIALS,
  EMAIL_USERNAME,
  VERIFICATION_BASE,
} from "../config/constants.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_CREDENTIALS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});


transporter.verify((error, success) => {
  if (error) {
    console.error("NODEMAILER TRANSPORTER ERROR:", error);
  } else {
    console.log("NODEMAILER: Server is ready to send emails");
  }
});

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
) => {
  try {
    const verificationUrl = `${VERIFICATION_BASE}/verification?token=${token}`;
    await transporter.sendMail({
      from: `"Safari App" <${EMAIL_USERNAME}>`,
      to: email,
      subject: "Verify your email",
      html: emailVerificationTemplate(verificationUrl),
    });
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("NODEMAILER VERIFICATION EMAIL ERROR", error);
    throw error;
  }
};


export const sendOTPEmail = async ( email: string, otp: string ) => {
  try {
    await transporter.sendMail({
      from: `"Safari App" <${EMAIL_USERNAME}>`,
      to: email,
      subject: "Your One-Time Password (OTP)",
      html: otpTemplate(otp)
    });
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error("NODEMAILER OTP EMAIL ERROR", error);
    throw error;
  }
}
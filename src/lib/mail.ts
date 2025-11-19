import nodemailer from "nodemailer";
import { emailVerificationTemplate, otpTemplate } from "./templates.js";
import {
  EMAIL_CREDENTIALS,
  EMAIL_USERNAME,
  VERIFICATION_BASE,
} from "../config/constants.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_CREDENTIALS,
  },
});

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
) => {
  try {
    const verificationUrl = `${VERIFICATION_BASE}/verification?token=${token}`;
    await transporter.sendMail({
      from: EMAIL_USERNAME,
      to: email,
      subject: "Verify your email",
      html: emailVerificationTemplate(verificationUrl),
    });
  } catch (error) {
    console.error("NODEMAILER VERIFICATION EMAIL ERROR", email);
  }
};


export const sendOTPEmail = async ( email: string, otp: string ) => {
  try {
    await transporter.sendMail({
      from: EMAIL_USERNAME,
      to: email,
      subject: "Your One-Time Password (OTP)",
      html: otpTemplate(otp)
    });

  } catch (error) {
    console.error("NODEMAILER OTP EMAIL ERROR", error);
  }
}
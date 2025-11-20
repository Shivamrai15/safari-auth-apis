import axios from "axios";
import { EMAIL_VERIFICATION_KEY } from "../config/constants.js";

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
) => {
	try {
		
		await axios.post("https://safari-music.vercel.app/api/v1/mail/verification", {
			email,
			token,
			key : EMAIL_VERIFICATION_KEY
		});

	} catch (error) {
		console.error("NODEMAILER VERIFICATION EMAIL ERROR", error);
		throw error;
	}
};


export const sendOTPEmail = async ( email: string, otp: string ) => {
	try {

		await axios.post("https://safari-music.vercel.app/api/v1/mail/otp", {
			email,
			token: otp,
			key : EMAIL_VERIFICATION_KEY
		});
		
	} catch (error) {
		console.error("NODEMAILER OTP EMAIL ERROR", error);
		throw error;
	}
}
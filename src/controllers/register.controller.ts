import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { RegistrationSchema } from "../lib/schemas.js";
import { db } from "../lib/db.js";
import { generateVerificationToken } from "../lib/token.js";
import { sendVerificationEmail } from "../lib/mail.js";

export async function registerController(req: Request, res: Response) {
    try {
        const validatedData = await RegistrationSchema.safeParseAsync(req.body);
        if (!validatedData.success) {
            return res.status(400).json({
                status: false,
                message: "Bad Request",
                data: {},
            });
        }

        const { email, password, name } = validatedData.data;

        const existingUser = await db.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return res.status(401).json({
                status: false,
                message: "Account already exists",
                data: {},
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        const token = await generateVerificationToken(email);
        if (!token) {
            return res.status(500).json({
                status: false,
                message: "Internal server error",
                data: {},
            });
        }

        await sendVerificationEmail(email, name, token);

        return res.status(201).json({
            status: true,
            message:
                "User registered successfully. Please check your email to verify your account.",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
        });
    } catch (error) {
        console.error("REGISTER USER ERROR", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            data: {},
        });
    }
}

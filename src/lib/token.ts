import { nanoid } from "nanoid";
import { db } from "./db.js";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from "../config/constants.js";

interface TokenPayload {
    userId: string;
    email: string;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

interface VerifyTokenResult {
    valid: boolean;
    payload?: TokenPayload;
    error?: string;
}


export class TokenManager {
    private accessSecret: Secret;
    private refreshSecret: Secret;
    private accessTokenExpiry: string | number;
    private refreshTokenExpiry: string | number;

    constructor(
        accessSecret: Secret = JWT_ACCESS_SECRET!,
        refreshSecret: Secret = JWT_REFRESH_SECRET!,
        accessTokenExpiry: string | number = "3d",
        refreshTokenExpiry: string | number = "30d"
    ) {
        this.accessSecret = accessSecret;
        this.refreshSecret = refreshSecret;
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }

    generateAuthTokens(payload: TokenPayload): AuthTokens {
        const accessToken = jwt.sign(
            payload,
            this.accessSecret,
            { expiresIn: this.accessTokenExpiry } as SignOptions
        );

        const refreshToken = jwt.sign(
            payload,
            this.refreshSecret,
            { expiresIn: this.refreshTokenExpiry } as SignOptions
        );

        return { accessToken, refreshToken };
    }

    verifyAccessToken(token: string): VerifyTokenResult {
        try {
            const payload = jwt.verify(token, this.accessSecret) as TokenPayload;
            return { valid: true, payload };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return { valid: false, error: "Token expired" };
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return { valid: false, error: "Invalid token" };
            }
            return { valid: false, error: "Token verification failed" };
        }
    }

    verifyRefreshToken(token: string): VerifyTokenResult {
        try {
            const payload = jwt.verify(token, this.refreshSecret) as TokenPayload;
            return { valid: true, payload };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return { valid: false, error: "Refresh token expired" };
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return { valid: false, error: "Invalid refresh token" };
            }
            return { valid: false, error: "Refresh token verification failed" };
        }
    }

    refreshAccessToken(refreshToken: string): { accessToken?: string; error?: string } {
        const verifyResult = this.verifyRefreshToken(refreshToken);
        
        if (!verifyResult.valid || !verifyResult.payload) {
            return { error: verifyResult.error || "Invalid refresh token" };
        }

        const accessToken = jwt.sign(
            {
                userId: verifyResult.payload.userId,
                email: verifyResult.payload.email,
            },
            this.accessSecret,
            { expiresIn: this.accessTokenExpiry } as SignOptions
        );

        return { accessToken };
    }
}


export const tokenManager = new TokenManager();

export const generateAuthTokens = (payload: TokenPayload): AuthTokens => {
    return tokenManager.generateAuthTokens(payload);
};

export const generateVerificationToken = async (email: string) => {
    try {
        const token = nanoid();
        const expires = new Date(new Date().getTime() + 600000);

        const existingToken = await db.verificationToken.findFirst({
            where: {
                email,
            },
        });

        if (existingToken) {
            await db.verificationToken.deleteMany({
                where: {
                    email,
                },
            });
        }

        await db.verificationToken.create({
            data: {
                token,
                email,
                expires,
            },
        });

        const verificationToken = jwt.sign(
            {
                token,
                email,
            },
            process.env.VERIFICATION_SECRET!,
            { expiresIn: "10m" }
        );

        return verificationToken;
    } catch (error) {
        console.error("GENERATE VERIFICATION TOKEN ERROR", error);
        return null;
    }
};

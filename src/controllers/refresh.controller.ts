import type { Request, Response } from "express";
import { tokenManager } from "../lib/token.js";

export async function refreshTokenController(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ 
                status: false,
                message: "Refresh token is required",
                data: {}
            });
        }

        const result = await tokenManager.refreshAccessToken(refreshToken);
        
        if (result.error || !result.accessToken) {
            return res.status(401).json({ 
                status: false,
                message: result.error || "Invalid or expired refresh token",
                data: {}
            });
        }

        return res.status(200).json({ 
            status: true,
            message: "Token refreshed successfully",
            data: {
                accessToken: result.accessToken
            }
        });

    } catch (error) {
        console.error("REFRESH TOKEN ERROR", error);
        return res.status(401).json({ 
            status: false,
            message: "Invalid or expired refresh token",
            data: {}
        });
    }
}
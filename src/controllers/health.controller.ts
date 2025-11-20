import type { Request, Response } from "express";

export class HealthController {
    static async healthCheck(req: Request, res: Response) {
        return res.status(200).json({
			status: "UP",
			message: "Auth Server is running",
        });
    }
}

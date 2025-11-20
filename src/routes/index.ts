import { Router } from "express";
import healthRoutes from "./health.routes.js";
import passwordlessRoutes from "./passwordless.route.js";
import authRoutes from "./auth.routes.js";

const router = Router();


router.use("/api/v2", healthRoutes);
router.use("/api/v2/auth", authRoutes);
router.use("/api/v2/auth", passwordlessRoutes)

export default router;

import { Router } from "express";
import { loginController } from "../controllers/login.controller.js";
import { registerController } from "../controllers/register.controller.js";
import { refreshTokenController } from "../controllers/refresh.controller.js";

const router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/refresh", refreshTokenController);

export default router;
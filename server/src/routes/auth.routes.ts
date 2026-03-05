import { Router } from "express";
import {
  signup,
  login,
  googleLogin,
  getMe,
  logout,
} from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", getMe);
router.post("/logout", logout);

export default router;

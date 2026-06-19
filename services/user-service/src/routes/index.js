import { Router } from "express";
import { register, login, me, updateProfile, updatePassword } from "../controllers/authController.js";
import {
  listFixed,
  createFixed,
  deleteFixed,
  availabilityForDay,
} from "../controllers/scheduleController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);

router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateProfile);
router.patch("/me/password", requireAuth, updatePassword);

router.get("/fixed-blocks", requireAuth, listFixed);
router.post("/fixed-blocks", requireAuth, createFixed);
router.delete("/fixed-blocks/:id", requireAuth, deleteFixed);

router.get("/internal/users/:userId/availability", availabilityForDay);

export default router;

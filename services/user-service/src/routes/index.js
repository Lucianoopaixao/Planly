//rotas do user service

import { Router } from "express";
import { register, login, me } from "../controllers/authController.js";
import {
  listFixed,
  createFixed,
  deleteFixed,
  availabilityForDay,
} from "../controllers/scheduleController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

//autenticacao do usuario
router.post("/auth/register", register);
router.post("/auth/login", login);

//perfil autenticado
router.get("/me", requireAuth, me);

//horarios do fixed blocks autenticado
router.get("/fixed-blocks", requireAuth, listFixed);
router.post("/fixed-blocks", requireAuth, createFixed);
router.delete("/fixed-blocks/:id", requireAuth, deleteFixed);

//enndpoint interno consumido por outros servicos sem auth de usuário
router.get("/internal/users/:userId/availability", availabilityForDay);

export default router;

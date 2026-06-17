import { Router } from 'express';
import {
  listTasks, createTask, updateTask, completeTask, deleteTask, getOverload
} from '../controllers/taskController.js';
import {
  listNotifications, markRead, markAllRead, removeNotification
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// endpoints de gerenciamento de tarefas e planejamento
router.use(requireAuth);

// ─── tarefas ──────────────────────────────────────
router.get   ('/tasks',                 listTasks);
router.post  ('/tasks',                 createTask);
router.patch ('/tasks/:id',             updateTask);
router.post  ('/tasks/:id/complete',    completeTask);
router.delete('/tasks/:id',             deleteTask);

// ─── sobrecarga ───────────────────────────────────
router.get   ('/planning/overload',     getOverload);

// ─── notificações ─────────────────────────────────
router.get   ('/notifications',           listNotifications);
router.post  ('/notifications/read-all',  markAllRead);
router.post  ('/notifications/:id/read',  markRead);
router.delete('/notifications/:id',       removeNotification);

export default router;
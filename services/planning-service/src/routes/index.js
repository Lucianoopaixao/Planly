import { Router } from 'express';
import {
  listTasks, createTask, updateTask, completeTask, deleteTask, getOverload
} from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// endpoints de gerenciamento de tarefas e planejamento
router.use(requireAuth);

router.get   ('/tasks',                 listTasks);
router.post  ('/tasks',                 createTask);
router.patch ('/tasks/:id',             updateTask);
router.post  ('/tasks/:id/complete',    completeTask);
router.delete('/tasks/:id',             deleteTask);

router.get   ('/planning/overload',     getOverload);

export default router;

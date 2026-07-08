import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from '../schemas/task.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validateQuery(listTasksQuerySchema),
  taskController.listTasks,
);

router.post(
  '/',
  validateBody(createTaskSchema),
  taskController.createTask,
);

router.get('/:id', taskController.getTask);

router.patch(
  '/:id',
  validateBody(updateTaskSchema),
  taskController.updateTask,
);

router.delete('/:id', taskController.deleteTask);

export default router;

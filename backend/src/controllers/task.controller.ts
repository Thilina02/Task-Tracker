import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import { emitTaskEvent } from '../lib/socket';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from '../schemas/task.schema';

export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const task = await taskService.createTask(
      req.user,
      req.body as CreateTaskInput,
    );

    emitTaskEvent('task:created', task);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const task = await taskService.getTaskById(req.user, req.params.id as string);

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const result = await taskService.listTasks(
      req.user,
      req.validatedQuery as ListTasksQuery,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const task = await taskService.updateTask(
      req.user,
      req.params.id as string,
      req.body as UpdateTaskInput,
    );

    emitTaskEvent('task:updated', task);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const task = await taskService.deleteTask(req.user, req.params.id as string);

    emitTaskEvent('task:deleted', task);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
}

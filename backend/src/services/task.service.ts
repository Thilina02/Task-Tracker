import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/apiError';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from '../schemas/task.schema';

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  dueDate: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export type TaskWithOwner = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
  };
};

export interface PaginatedTasks {
  tasks: TaskWithOwner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RequestUser {
  userId: string;
  role: Role;
}

function canAccessTask(task: { ownerId: string }, user: RequestUser): boolean {
  return user.role === Role.ADMIN || task.ownerId === user.userId;
}

export async function createTask(
  user: RequestUser,
  input: CreateTaskInput,
): Promise<TaskWithOwner> {
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? TaskStatus.TODO,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      ownerId: user.userId,
    },
    select: taskSelect,
  });

  return task;
}

export async function getTaskById(
  user: RequestUser,
  taskId: string,
): Promise<TaskWithOwner> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: taskSelect,
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (!canAccessTask(task, user)) {
    throw new ApiError(403, 'You do not have permission to view this task');
  }

  return task;
}

export async function listTasks(
  user: RequestUser,
  query: ListTasksQuery,
): Promise<PaginatedTasks> {
  const { page, limit, status, ownerId } = query;
  const skip = (page - 1) * limit;

  const where: {
    ownerId?: string;
    status?: TaskStatus;
  } = {};

  if (user.role === Role.ADMIN) {
    if (ownerId) {
      where.ownerId = ownerId;
    }
  } else {
    if (ownerId && ownerId !== user.userId) {
      throw new ApiError(403, 'You can only view your own tasks');
    }
    where.ownerId = user.userId;
  }

  if (status) {
    where.status = status;
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: taskSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function updateTask(
  user: RequestUser,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskWithOwner> {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, ownerId: true },
  });

  if (!existing) {
    throw new ApiError(404, 'Task not found');
  }

  if (!canAccessTask(existing, user)) {
    throw new ApiError(403, 'You do not have permission to update this task');
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
    },
    select: taskSelect,
  });

  return task;
}

export async function deleteTask(
  user: RequestUser,
  taskId: string,
): Promise<TaskWithOwner> {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    select: taskSelect,
  });

  if (!existing) {
    throw new ApiError(404, 'Task not found');
  }

  if (!canAccessTask(existing, user)) {
    throw new ApiError(403, 'You do not have permission to delete this task');
  }

  await prisma.task.delete({ where: { id: taskId } });

  return existing;
}

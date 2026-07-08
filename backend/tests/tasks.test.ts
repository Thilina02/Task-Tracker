import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import * as taskService from '../src/services/task.service';
import { ApiError } from '../src/utils/apiError';

jest.mock('../src/services/task.service');
jest.mock('../src/lib/socket', () => ({
  emitTaskEvent: jest.fn(),
}));

const mockedTaskService = taskService as jest.Mocked<typeof taskService>;

const mockTask = {
  id: 'task-1',
  title: 'Sample Task',
  description: 'Do something',
  status: 'TODO' as const,
  dueDate: new Date('2026-12-31T00:00:00.000Z'),
  ownerId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  owner: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  },
};

function authHeader(role: 'USER' | 'ADMIN' = 'USER') {
  const token = jwt.sign(
    { userId: 'user-1', email: 'john@example.com', role },
    process.env.JWT_SECRET!,
  );
  return { Authorization: `Bearer ${token}` };
}

describe('Tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/tasks', () => {
    it('creates a task for authenticated user', async () => {
      mockedTaskService.createTask.mockResolvedValue(mockTask);

      const response = await request(app)
        .post('/api/tasks')
        .set(authHeader())
        .send({
          title: 'Sample Task',
          description: 'Do something',
          dueDate: '2026-12-31T00:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.task.title).toBe('Sample Task');
    });

    it('returns 401 without authentication', async () => {
      const response = await request(app).post('/api/tasks').send({
        title: 'Sample Task',
      });

      expect(response.status).toBe(401);
    });

    it('returns 400 for invalid payload', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set(authHeader())
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/tasks', () => {
    it('returns paginated tasks', async () => {
      mockedTaskService.listTasks.mockResolvedValue({
        tasks: [mockTask],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const response = await request(app)
        .get('/api/tasks?page=1&limit=10&status=TODO')
        .set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
    });

    it('returns 403 when user filters by another owner', async () => {
      mockedTaskService.listTasks.mockRejectedValue(
        new ApiError(403, 'You can only view your own tasks'),
      );

      const response = await request(app)
        .get('/api/tasks?ownerId=other-user')
        .set(authHeader('USER'));

      expect(response.status).toBe(403);
    });

    it('allows admin to filter by owner', async () => {
      mockedTaskService.listTasks.mockResolvedValue({
        tasks: [mockTask],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const response = await request(app)
        .get('/api/tasks?ownerId=user-1')
        .set(authHeader('ADMIN'));

      expect(response.status).toBe(200);
      expect(response.body.data.tasks).toHaveLength(1);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns a task by id', async () => {
      mockedTaskService.getTaskById.mockResolvedValue(mockTask);

      const response = await request(app)
        .get('/api/tasks/task-1')
        .set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.data.task.id).toBe('task-1');
    });

    it('returns 404 when task is missing', async () => {
      mockedTaskService.getTaskById.mockRejectedValue(
        new ApiError(404, 'Task not found'),
      );

      const response = await request(app)
        .get('/api/tasks/missing')
        .set(authHeader());

      expect(response.status).toBe(404);
    });

    it('returns 403 when user lacks permission to view task', async () => {
      mockedTaskService.getTaskById.mockRejectedValue(
        new ApiError(403, 'You do not have permission to view this task'),
      );

      const response = await request(app)
        .get('/api/tasks/task-2')
        .set(authHeader());

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('updates a task', async () => {
      mockedTaskService.updateTask.mockResolvedValue({
        ...mockTask,
        status: 'IN_PROGRESS',
      });

      const response = await request(app)
        .patch('/api/tasks/task-1')
        .set(authHeader())
        .send({ status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body.data.task.status).toBe('IN_PROGRESS');
    });

    it('returns 403 when user lacks permission to update task', async () => {
      mockedTaskService.updateTask.mockRejectedValue(
        new ApiError(403, 'You do not have permission to update this task'),
      );

      const response = await request(app)
        .patch('/api/tasks/task-2')
        .set(authHeader())
        .send({ status: 'DONE' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes a task', async () => {
      mockedTaskService.deleteTask.mockResolvedValue(mockTask);

      const response = await request(app)
        .delete('/api/tasks/task-1')
        .set(authHeader());

      expect(response.status).toBe(200);
      expect(response.body.data.task.id).toBe('task-1');
    });

    it('returns 403 when user lacks permission', async () => {
      mockedTaskService.deleteTask.mockRejectedValue(
        new ApiError(403, 'You do not have permission to delete this task'),
      );

      const response = await request(app)
        .delete('/api/tasks/task-1')
        .set(authHeader())
        .send();

      expect(response.status).toBe(403);
    });
  });
});

import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/apiError';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface AuthResult {
  user: SafeUser;
  token: string;
}

function toSafeUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
    select: userSelect,
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: toSafeUser(user),
    token,
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isValidPassword = await comparePassword(input.password, user.password);

  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const safeUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: userSelect,
  });

  const token = signToken({
    userId: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
  });

  return {
    user: toSafeUser(safeUser),
    token,
  };
}

export async function getUserById(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return toSafeUser(user);
}

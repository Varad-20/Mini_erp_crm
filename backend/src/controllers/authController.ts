import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { loginSchema } from "../validators";
import { AuthRequest } from "../middleware/authMiddleware";
import { successResponse, errorResponse } from "../utils/response";

export const login = async (req: Request, res: Response) => {
  try {
    // 1. Validate input with Zod
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((e) => {
        errors[e.path.join(".")] = e.message;
      });
      return errorResponse(res, "Validation failed", 400, errors);
    }

    const { email, password } = parseResult.data;

    // 2. Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    // 3. Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return errorResponse(res, "Invalid email or password", 401);
    }

    // 4. Sign JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET is not configured");

    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
      expiresIn: "7d",
    });

    return successResponse(
      res,
      {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      "Login successful"
    );
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return errorResponse(res, "Unauthorized", 401);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) return errorResponse(res, "User not found", 404);

    return successResponse(res, user, "User fetched successfully");
  } catch (error) {
    console.error("[Auth] GetMe error:", error);
    return errorResponse(res, "Internal server error", 500);
  }
};
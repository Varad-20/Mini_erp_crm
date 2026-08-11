import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Zod v4 validation errors — issues (not errors)
  if (err instanceof ZodError) {
    const errors: Record<string, string> = {};
    err.issues.forEach((issue) => {
      const field = issue.path.join(".");
      errors[field] = issue.message;
    });
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Prisma unique constraint
  const prismaErr = err as unknown as Record<string, unknown>;
  if (typeof prismaErr.code === "string") {
    if (prismaErr.code === "P2002") {
      const meta = prismaErr.meta as { target?: string[] } | undefined;
      const field = meta?.target?.[0] ?? "field";
      return res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists`,
      });
    }
    if (prismaErr.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }
  }

  // Generic fallback — never expose internals
  console.error("[ErrorHandler]", err);
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
  });
};

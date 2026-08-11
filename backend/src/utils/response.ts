import { Response } from "express";

export const successResponse = (
  res: Response,
  data: unknown,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const paginatedResponse = (
  res: Response,
  data: unknown,
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message = "Success"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};

import type { Response } from "express";

export function success(res: Response, statusCode: number, data: object | string, headers?: Headers) {
  // if (headers) headers.forEach((key, val) => res.setHeader(key, val));

  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function failure(res: Response, statusCode: number, error: string, headers?: Headers) {
  if (headers) headers.forEach((key, val) => res.setHeader(key, val));

  return res.status(statusCode).json({
    success: false,
    error,
  });
}

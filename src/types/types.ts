import { Request } from "express";


export type CustomRequest<T = unknown> = Request & {
  validatedBody?: T;
};

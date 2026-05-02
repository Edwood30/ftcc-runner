import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

export interface ApiRequestBody<T> {
  body: T;
}

export interface PaginationQuery extends ParsedQs, ParamsDictionary {
  page?: string;
  limit?: string;
  where?: string;
  from?: string;
  to?: string;
}

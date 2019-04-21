import { RootSpan } from "@opencensus/core";

declare namespace Express {
  interface Request {
    rootSpan: RootSpan;
  }
}
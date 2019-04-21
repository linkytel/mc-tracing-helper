import { Span } from "@opencensus/core";
import { Response, RequestHandler } from 'express';
import { ZipkinTraceExporter } from 'mc-exporter-zipkin';
import * as tracing from '@opencensus/nodejs';
import * as request from 'request';
import { ExpressHelper } from './ExpressHelper';
import * as MysqlHelper from './MysqlHelper';
import { startChild } from './tracingCore';

export interface ExporterOptions {
  url?: string;
  serviceName: string;
}

export const mysqlTraceWrapper = MysqlHelper;

export const tracingSetup = (config: ExporterOptions) => {
  const zipkinOptions = {
    url: config.url,
    serviceName: config.serviceName,
  };
  const exporter = new ZipkinTraceExporter(zipkinOptions);
  tracing.registerExporter(exporter).start();
}

export const requestTraceWrapper = (options: any, callback: Function, req: any): any => {
  let reqSpan: Span;
  let resSpan: Span;
  if (req.rootSpan) {
    reqSpan = startChild('request', req.rootSpan);
    ExpressHelper.addRequestTags(reqSpan, req);
    ExpressHelper.injectHeader(reqSpan, options);
    reqSpan.end();
  }
  return request(options, (err: any, response: any, data: any) => {
    if (req.rootSpan) {
      resSpan = startChild('response', req.rootSpan);
      ExpressHelper.addResponseTags(resSpan, response);
      resSpan.end();
    }
    callback(err, response, data);
  });
}

export const expressMiddleware: RequestHandler = (req: any, res: Response, next: Function) => {
  ExpressHelper.startRoot(req).then((rootSpan: any) => {
    req.rootSpan = rootSpan;
    next();
  });
  res.on('finish', () => {
    req.rootSpan.end();
  });
}

import { Span } from "@opencensus/core";
import { Response, RequestHandler } from 'express';
import { ZipkinTraceExporter } from 'mc-exporter-zipkin';
import * as tracing from '@opencensus/nodejs';
import * as request from 'request';
import { ExpressHelper } from './ExpressHelper';
import * as MysqlHelper from './MysqlHelper';
import { startChild } from './tracingCore';

export const mysqlTraceWrapper = MysqlHelper;

export const tracingSetup = (zipkinUrl: string, serviceName: string) => {
  const zipkinOptions = {
    url: zipkinUrl,
    serviceName: serviceName,
  };
  const exporter = new ZipkinTraceExporter(zipkinOptions);
  tracing.registerExporter(exporter).start();
}

export const requestTraceWrapper = (options: any, req: any): Promise<any> => {
  let childSpan: Span;
  if (req.rootSpan) {
    childSpan = startChild('response recevied', req.rootSpan);
    ExpressHelper.injectHeader(childSpan, options);
  }
  return new Promise((resolve) => {
    request(options, (err: any, response: any, data: any) => {
      try {
        ExpressHelper.addResponseTags(childSpan, response);
      } finally {
        if (childSpan) {
          childSpan.end();
        }
        resolve({ err, response, data });
      }
    })
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

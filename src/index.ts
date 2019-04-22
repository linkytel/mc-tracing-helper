import { Span, RootSpan } from "@opencensus/core";
import { Response, RequestHandler } from 'express';
import { ZipkinTraceExporter } from 'mc-exporter-zipkin';
import * as tracing from '@opencensus/nodejs';
import * as request from 'request';
import { ExpressHelper } from './ExpressHelper';
import { defaultConfig } from './MysqlHelper';
import { TraceTopClient } from './TopClientHelper';
import { startChild, addAttributes } from './tracingCore';
var captureMySQL = require("mc-mysql-wrapper");

export interface ExporterOptions {
  url?: string;
  serviceName: string;
}

export const tracingSetup = (config: ExporterOptions) => {
  const zipkinOptions = {
    url: config.url,
    serviceName: config.serviceName,
  };
  const exporter = new ZipkinTraceExporter(zipkinOptions);
  tracing.registerExporter(exporter).start();
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

export const requestTraceWrapper = (options: any, callback: Function, req: any): any => {
  let resSpan: Span;
  if (req.rootSpan) {
    resSpan = startChild('response', req.rootSpan);
    ExpressHelper.injectHeader(resSpan, options);
  }
  return request(options, (err: any, response: any, data: any) => {
    if (resSpan) {
      ExpressHelper.addHttpTags(resSpan, req, response, data);
      resSpan.end();
    }
    callback(err, response, data);
  });
}

export const mysqlTraceWrapper = (mysql?: any): any => {
  const config = defaultConfig();
  if (mysql) {
    config.mysql = mysql;
  }
  return captureMySQL(config);
};

export class TopClient extends TraceTopClient { };


export const startChildSpan = (name: string, rootSpan: RootSpan) => (startChild(name, rootSpan));

export const addSpanAttributes = (span: Span, dict: any) => (addAttributes(span, dict));

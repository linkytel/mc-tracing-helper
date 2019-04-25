import { Request, Response } from 'express';
import { Span, RootSpan } from "@opencensus/core";
import * as tracing from '@opencensus/nodejs';
import { TraceContextFormat } from '@opencensus/propagation-tracecontext';
import { addAttributes, addAnnotation } from './tracingCore';
import logger from './logger';

export class ExpressHelper {
  static startRoot(req: Request) {
    return new Promise((resolve) => {
      const spanOptions = { name: `router:${req.url}` } as any;
      const traceparent = req.headers.traceparent;
      if (traceparent) {
        const tcFormat = new TraceContextFormat();
        spanOptions.spanContext = tcFormat.extract({
          getHeader: (name: string) => {
            return req.headers[name];
          },
        });
      }
      tracing.tracer.startRootSpan(spanOptions, (rootSpan: RootSpan) => {
        resolve(rootSpan);
      });
      logger.info(`root spanOptions:`, spanOptions, '\n req.headers:', req.headers);
    });
  }

  static injectHeader(span: Span, options: any) {
    if (!span) {
      return;
    }
    const tcFormat = new TraceContextFormat();
    tcFormat.inject({
      setHeader: (name: string, value: string) => {
        if (!options.headers) {
          options.headers = {};
        }
        options.headers[name] = value;
      },
    }, span.spanContext);
  }

  static addHttpTags(span: Span, options: any, req: any, res: Response, data: any) {
    const { headers } = req;
    const rootAttrs = {
      'http.host': req.host,
    } as any;
    const childAttrs = {
      'http.status_code': res.statusCode || '',
      'http.path': options.url || '',
      'http.method': options.method,
    } as any;
    const uid = headers['x-auth-uid'];
    const nick = headers['x-auth-nick'] as string;
    if (uid) {
      rootAttrs['req.uid'] = uid;
    }

    if (nick) {
      rootAttrs['req.nick'] = decodeURIComponent(nick);
    }
    try {
      const { statusCode } = res;
      if (statusCode != 200) {
        const responseText = typeof data === "string" ? data : JSON.stringify(data);
        rootAttrs['error'] = 1;
        childAttrs['error'] = 1;
        addAttributes(span, childAttrs);
        if (responseText) {
          addAnnotation(span, responseText)
        }
      }
    } finally {
      addAttributes(req.rootSpan, rootAttrs);
    }
  }
}
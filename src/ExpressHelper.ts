import { Request, Response } from 'express';
import { Span, RootSpan } from "@opencensus/core";
import * as tracing from '@opencensus/nodejs';
import { TraceContextFormat } from '@opencensus/propagation-tracecontext';
import { addAttributes } from './tracingCore';
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
        ExpressHelper.addRouterTags(rootSpan, req);
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
        options.headers[name] = value;
      },
    }, span.spanContext);
  }

  static addRouterTags(span: Span, req: Request) {
    addAttributes(span, {
      'req.uid': req.headers['x-auth-uid'],
    })
  }

  static addHttpTags(span: Span, req: Request, res: Response, data: any) {
    const { headers } = req;
    const attrs = {
      'http.status_code': res.statusCode || '',
      'http.path': req.url || '',
      'http.method': req.method,
      'http.host': req.host,
    } as any;
    const uid = headers['x-auth-uid'];
    const nick = headers['x-auth-nick'] as string;
    if (uid) {
      attrs['req.uid'] = uid;
    }

    if (nick) {
      attrs['req.nick'] = decodeURIComponent(nick);
    }
    try {
      const responseText = typeof data === "string" ? data : JSON.stringify(data);
      if (res.statusCode != 200 && responseText) {
        attrs['http.error'] = responseText;
      }
    } finally {
      addAttributes(span, attrs);
    }
  }
}
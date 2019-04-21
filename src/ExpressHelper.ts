import { Request, Response } from 'express';
import { Span, RootSpan } from "@opencensus/core";
import * as tracing from '@opencensus/nodejs';
import { TraceContextFormat } from '@opencensus/propagation-tracecontext';
import { addAttributes } from './tracingCore';

export class ExpressHelper {
  static startRoot(req: Request) {
    return new Promise((resolve) => {
      const spanOptions = { name: req.url } as any;
      const traceparent = req.headers.traceparent;
      if (traceparent) {
        const traceContext = new TraceContextFormat();
        traceContext.extract({
          getHeader: (name: string) => {
            return 'traceparent';
          },
        });
        spanOptions.spanContext = traceContext;
      }
      tracing.tracer.startRootSpan(spanOptions, (rootSpan: RootSpan) => {
        ExpressHelper.addRequestTags(rootSpan, req);
        resolve(rootSpan);
      });
    });
  }


  static injectHeader(span: Span, options: any) {
    if (!span) {
      return;
    }
    const traceContext = new TraceContextFormat();
    traceContext.inject({
      setHeader: (name: string, value: string) => {
        options.headers[name] = value;
      },
    }, span.spanContext);
  }

  static addRequestTags(span: Span, req: Request) {
    const { headers } = req;
    addAttributes(span, {
      'http.user_agent': headers.user_agent || '',
      'http.path': req.url || '',
      'http.method': req.method,
      'http.host': req.host,
      'request.uid': req.headers['x-auth-nick'],
      'request.nick': req.headers['x-auth-nick'],
    })
  }

  static addResponseTags(span: Span, res: Response) {
    addAttributes(span, {
      'http.status_code': res.statusCode || '',
    })
  }
}
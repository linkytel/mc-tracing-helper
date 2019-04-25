import { RootSpan, Span } from "@opencensus/core";
import { startChild, addAttributes } from './tracingCore';

export interface TraceMySqlConfig {
  mysql?: any,
  onReady?: (rootSpan: RootSpan, name: string, args: any) => Span,
  onExecute?: (spanContext: Span, data: any) => void,
  onError?: (spanContext: Span, data: any) => void,
}

export const defaultConfig = (): TraceMySqlConfig => {
  return {
    onReady: (rootSpan: RootSpan, name: string, args: any) => {
      const span = startChild(`db:${name}`, rootSpan);
      addAttributes(span, {
        'db.statement': args.sql,
        'db.params': args.values,
      });
      return span;
    },
    onExecute: (spanContext: Span, data: any) => {
      if (spanContext) {
        spanContext.end();
      }
    },
    onError: (spanContext: Span, err: Error) => {
      if (spanContext) {
        addAttributes(spanContext, {
          'db.error': (err || {}).message,
        });
        spanContext.end();
      }
    }
  };
};
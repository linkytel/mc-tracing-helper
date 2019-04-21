import { RootSpan, Span } from "@opencensus/core";
var captureMySQL = require("mc-mysql-wrapper");
import { startChild, addAttributes } from './tracingCore';

export default (mysql?: any) => captureMySQL({
  mysql,
  onReady: (rootSpan: RootSpan, name: string, args: any) => {
    const span = startChild(`router:${name}`, rootSpan);
    addAttributes(span, {
      'db.statement': args.sql,
      'db.params': args.values,
    });
    return span;
  },
  onExecute: (spanContext: Span, data: any) => {
    spanContext.end();
  },
  onError: (spanContext: Span, err: Error) => {
    addAttributes(spanContext, {
      'db.error': (err || {}).message,
    });
    spanContext.end();
  }
})
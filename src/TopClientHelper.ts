import * as TopClient from 'topsdk';
import { Span, RootSpan } from "@opencensus/core";
import { startChild, addAttributes } from './tracingCore';

interface TopClientStream {
  pipe<T extends NodeJS.WritableStream>(destination: T): T;
}

function addTopAttrs(childSpan: Span, method: string, args: any, _err?: any) {
  addAttributes(childSpan, {
    'top.method': method,
    'top.args': args,
    'top.error': _err && _err.message || '',
  });
}
function wrapCallback(method: string, args: any, _err: any, _data: any, callback: Function, childSpan: Span) {
  addTopAttrs(childSpan, method, args, _err);
  childSpan.end();
  callback(_err, _data);
}

export class TraceTopClient {
  private instance: any;
  constructor(key: string, secret: string, options: any) {
    this.instance = new TopClient(key, secret, options);
  }

  execute(rootSpan: RootSpan, method: string, args: any, callback: (err: any, data: any) => void) {
    const childSpan = startChild('top:', rootSpan);
    this.instance.execute(method, args, (_err: any, _data: any) => {
      wrapCallback(method, args, _err, _data, callback, childSpan);
    });
  }
  executeType(rootSpan: RootSpan, method: string, args: any, type: string, callback: (err: any, data: any) => void) {
    const childSpan = startChild('top:', rootSpan);
    this.instance.execute(method, args, type, (_err: any, _data: any) => {
      wrapCallback(method, args, _err, _data, callback, childSpan);
    });
  }
  executePromise(rootSpan: RootSpan, method: string, args: any, type?: string): Promise<any> & TopClientStream {
    const childSpan = startChild('top:', rootSpan);
    return this.instance.execute(method, args, type).then((data: any) => {
      addTopAttrs(childSpan, method, args);
      childSpan.end();
      return data;
    }).catch((err: any) => {
      addTopAttrs(childSpan, method, args);
      childSpan.end();
      return err;
    });
  }
}
import { Span, RootSpan } from "@opencensus/core";
import { ZipkinTraceExporter } from 'mc-exporter-zipkin';
import * as tracing from '@opencensus/nodejs';

export const startChild = (name: string, rootSpan: RootSpan): any => {
  if (!rootSpan) {
    return null;
  }
  return rootSpan.startChildSpan({ name });
}

export const tracingSetup = (zipkinUrl: string, serviceName: string) => {
  const zipkinOptions = {
    url: zipkinUrl,
    serviceName: serviceName,
  };
  const exporter = new ZipkinTraceExporter(zipkinOptions);
  tracing.registerExporter(exporter).start();
}

export const addAttributes = (span: Span, dict: any) => {
  if (!span) {
    return;
  }
  Object.keys(dict).map((key) => {
    span.addAttribute(key, dict[key]);
  });
}

export const addAnnotation = (span: Span, desc: string, dict?: any) => {
  if (!span) {
    return;
  }
  span.addAnnotation(desc, dict);
}
import type nock from 'nock';

export type NockHandler = (reqData: {
  uri: string;
  body: nock.Body;
}) => nock.ReplyFnResult | Promise<nock.ReplyFnResult>;

import { parseBlacklistResponsePayload } from '../modules/blacklist/blacklist.repository';

describe('parseBlacklistResponsePayload', () => {
  it('parses JSON strings returned from MySQL JSON columns', () => {
    expect(
      parseBlacklistResponsePayload('{"status":"success","message":"Successful","data":null}'),
    ).toEqual({
      status: 'success',
      message: 'Successful',
      data: null,
    });
  });

  it('handles already parsed JSON objects', () => {
    expect(
      parseBlacklistResponsePayload({
        status: 'success',
        data: null,
      }),
    ).toEqual({
      status: 'success',
      data: null,
    });
  });

  it('handles Buffer payloads', () => {
    expect(parseBlacklistResponsePayload(Buffer.from('{"status":"success","data":null}'))).toEqual({
      status: 'success',
      data: null,
    });
  });

  it('does not throw when a stored payload is malformed', () => {
    expect(parseBlacklistResponsePayload('{status:success,data:null}')).toEqual({
      status: 'unknown',
      message: 'Stored provider payload could not be parsed',
      data: null,
      meta: {
        rawPayload: '{status:success,data:null}',
      },
    });
  });
});

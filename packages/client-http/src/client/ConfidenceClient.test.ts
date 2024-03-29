import { AppliedFlag, ConfidenceClient } from './ConfidenceClient';
import { Configuration, ResolveContext } from './Configuration';

describe('ConfidenceClient', () => {
  const mockFetch = jest.fn();
  const instanceUnderTest = new ConfidenceClient({
    clientSecret: 'test-secret',
    fetchImplementation: mockFetch,
    apply: true,
    region: 'eu',
    sdk: {
      id: 'SDK_ID_JS_WEB_PROVIDER',
      version: 'TESTING',
    },
    timeout: 10,
  });

  describe('resolve', () => {
    it('should abort the request if it exceeds timeout', async () => {
      jest.useFakeTimers();
      let signal: AbortSignal | undefined;
      mockFetch.mockImplementation((_url, options) => {
        signal = options.signal;
        return new Promise(() => {});
      });
      const context: ResolveContext = {
        targeting_key: 'a',
      };
      const options = {
        apply: false,
        flags: ['test-flag'],
      };

      instanceUnderTest.resolve(context, options);

      expect(signal!.aborted).toBeFalsy();

      jest.advanceTimersByTime(11);

      expect(signal!.aborted).toBeTruthy();

      jest.useRealTimers();
    });

    it('should call resolve with the given options and context', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            resolvedFlags: [],
            resolveToken: '',
          }),
      });
      const context: ResolveContext = {
        targeting_key: 'a',
      };
      const options = {
        apply: false,
        flags: ['test-flag'],
      };

      await instanceUnderTest.resolve(context, options);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://resolver.eu.confidence.dev/v1/flags:resolve`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            clientSecret: 'test-secret',
            evaluationContext: context,
            apply: options.apply,
            sdk: {
              id: 'SDK_ID_JS_WEB_PROVIDER',
              version: 'TESTING',
            },
            flags: options.flags,
          }),
        }),
      );
    });

    it.each`
      region       | url
      ${'eu'}      | ${'https://resolver.eu.confidence.dev/v1/flags:resolve'}
      ${'us'}      | ${'https://resolver.us.confidence.dev/v1/flags:resolve'}
      ${'global'}  | ${'https://resolver.confidence.dev/v1/flags:resolve'}
      ${undefined} | ${'https://resolver.confidence.dev/v1/flags:resolve'}
    `(`should use the correct url for region $region`, async ({ region, url }) => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            resolvedFlags: [],
            resolveToken: '',
          }),
      });

      const regionBasedInstance = new ConfidenceClient({
        clientSecret: 'test-secret',
        fetchImplementation: mockFetch,
        apply: true,
        region,
        sdk: {
          id: 'SDK_ID_JS_WEB_PROVIDER',
          version: 'TESTING',
        },
        timeout: 10,
      });

      await regionBasedInstance.resolve({ targeting_key: 'a' }, { apply: false, flags: ['test-flag'] });

      expect(mockFetch).toHaveBeenCalledWith(url, expect.anything());
    });

    it(`should default to the global region`, async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            resolvedFlags: [],
            resolveToken: '',
          }),
      });

      const regionBasedInstance = new ConfidenceClient({
        clientSecret: 'test-secret',
        fetchImplementation: mockFetch,
        apply: true,
        sdk: {
          id: 'SDK_ID_JS_WEB_PROVIDER',
          version: 'TESTING',
        },
        timeout: 10,
      });

      await regionBasedInstance.resolve({ targeting_key: 'a' }, { apply: false, flags: ['test-flag'] });

      expect(mockFetch).toHaveBeenCalledWith('https://resolver.confidence.dev/v1/flags:resolve', expect.anything());
    });

    it('should call resolve with the context', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            resolvedFlags: [],
            resolveToken: '',
          }),
      });
      const context: ResolveContext = {
        targeting_key: 'a',
      };

      await instanceUnderTest.resolve(context);

      expect(mockFetch).toHaveBeenCalledWith(
        `https://resolver.eu.confidence.dev/v1/flags:resolve`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            clientSecret: 'test-secret',
            evaluationContext: context,
            apply: true,
            sdk: {
              id: 'SDK_ID_JS_WEB_PROVIDER',
              version: 'TESTING',
            },
          }),
        }),
      );
    });

    it('should throw any errors', async () => {
      mockFetch.mockRejectedValue(new Error('test-error'));
      const context: ResolveContext = {
        targeting_key: 'a',
      };

      await expect(instanceUnderTest.resolve(context)).rejects.toThrowError('test-error');
    });

    it('should return a valid configuration with the flags resolved', async () => {
      const fakeFlag = {
        flag: 'flags/test-flag',
        variant: 'test',
        value: {
          str: 'test',
        },
        flagSchema: { schema: { str: { stringSchema: {} } } },
        reason: Configuration.ResolveReason.Match,
      };
      const fakeFlag1 = {
        flag: 'flags/test-flag1',
        variant: '',
        reason: Configuration.ResolveReason.NoSegmentMatch,
      };
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            resolvedFlags: [fakeFlag, fakeFlag1],
            resolveToken: 'resolve-token',
          }),
      });
      const context: ResolveContext = {
        targeting_key: 'a',
      };

      const config = await instanceUnderTest.resolve(context);

      expect(config).toEqual({
        flags: {
          ['test-flag']: {
            name: 'test-flag',
            schema: {
              str: 'string',
            },
            value: {
              str: 'test',
            },
            reason: Configuration.ResolveReason.Match,
            variant: 'test',
          },
          ['test-flag1']: {
            name: 'test-flag1',
            schema: 'undefined',
            value: undefined,
            reason: Configuration.ResolveReason.NoSegmentMatch,
            variant: '',
          },
        },
        resolveToken: 'resolve-token',
        context,
      });
    });
  });

  describe('apply', () => {
    const fakeTime = new Date();
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(fakeTime);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call apply with flags and resolve token', async () => {
      mockFetch.mockResolvedValue({});
      const resolveToken = 'apply-test-resolve-token';
      const flagsToApply: AppliedFlag[] = [
        {
          flag: 'test-flag',
          applyTime: fakeTime.toISOString(),
        },
      ];

      await instanceUnderTest.apply(flagsToApply, resolveToken);

      expect(mockFetch).toHaveBeenCalledWith(`https://resolver.eu.confidence.dev/v1/flags:apply`, {
        method: 'POST',
        body: JSON.stringify({
          clientSecret: 'test-secret',
          resolve_token: resolveToken,
          flags: flagsToApply,
          sendTime: fakeTime.toISOString(),
          sdk: {
            id: 'SDK_ID_JS_WEB_PROVIDER',
            version: 'TESTING',
          },
        }),
      });
    });

    it('should throw any errors', async () => {
      mockFetch.mockRejectedValue(new Error('test-error'));

      await expect(instanceUnderTest.apply([], 'test')).rejects.toThrowError('test-error');
    });
  });
});

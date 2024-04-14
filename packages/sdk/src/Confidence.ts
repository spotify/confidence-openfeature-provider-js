import { EventSenderEngine } from './EventSenderEngine';
import { FlagResolverClient } from './FlagResolverClient';
import { Value } from './Value';
import { EventSender } from './events';
import { Context } from './context';
import { Logger } from './logger';
import { FlagEvaluation, FlagResolution, FlagResolver } from './flags';
import { SdkId } from './generated/confidence/flags/resolver/v1/types';

export { FlagResolverClient, FlagResolution };

export interface ConfidenceOptions {
  clientSecret: string;
  region?: 'global' | 'eu' | 'us';
  baseUrl?: string;
  environment: 'client' | 'backend';
  fetchImplementation?: typeof fetch;
  timeout: number;
  logger?: Logger;
}

interface Configuration {
  readonly environment: 'client' | 'backend';
  readonly eventSenderEngine: EventSenderEngine;
  readonly flagResolverClient: FlagResolverClient;
}

export class Confidence implements EventSender, FlagResolver {
  private readonly config: Configuration;
  private readonly parent?: Confidence;
  private _context: Map<string, Value> = new Map();

  constructor(config: Configuration, parent?: Confidence) {
    this.config = config;
    this.parent = parent;
  }

  get environment(): string {
    return this.config.environment;
  }

  sendEvent(name: string, message?: Value.Struct) {
    this.config.eventSenderEngine.send(this.getContext(), name, message);
  }

  private *contextEntries(): Iterable<[key: string, value: Value]> {
    if (this.parent) {
      // all parent entries except the ones child also has
      for (const entry of this.parent.contextEntries()) {
        // todo should we do a deep merge of entries?
        if (!this._context.has(entry[0])) {
          yield entry;
        }
      }
    }
    // all child entries except undefined
    for (const entry of this._context.entries()) {
      if (typeof entry[1] !== 'undefined') {
        yield entry;
      }
    }
  }

  getContext(): Context {
    const context: Record<string, Value> = {};
    for (const [key, value] of this.contextEntries()) {
      context[key] = value;
    }
    return Object.freeze(context);
  }

  setContext(context: Context): void {
    this._context.clear();
    for (const key of Object.keys(context)) {
      this.updateContextEntry(key, context[key]);
    }
  }

  updateContextEntry<K extends string>(name: K, value: Context[K]) {
    this._context.set(name, Value.clone(value));
  }

  removeContextEntry(name: string): void {
    this._context.set(name, undefined);
  }

  clearContext(): void {
    this._context.clear();
  }

  withContext(context: Context): Confidence {
    const child = new Confidence(this.config, this);
    child.setContext(context);
    return child;
  }
  /**
   * @internal
   */
  resolve(flagNames: string[]): Promise<FlagResolution> {
    return this.config.flagResolverClient.resolve(this.getContext(), flagNames);
  }

  resolveFlags(...flagNames: string[]): Promise<FlagResolution> {
    // TODO cache the resolution if context hasn't changed
    return this.config.flagResolverClient.resolve(this.getContext(), flagNames);
  }

  evaluateFlag<T extends Value>(path: string, defaultValue: T): Promise<FlagEvaluation<T>> {
    const [name] = path.split('.');
    return this.resolveFlags(name).then(resolution => resolution.evaluate(path, defaultValue));
  }

  getFlag<T extends Value>(path: string, defaultValue: T): Promise<T> {
    const [name] = path.split('.');
    return this.resolveFlags(name).then(resolution => resolution.evaluate(path, defaultValue).value);
  }

  static create({
    clientSecret,
    region,
    baseUrl,
    timeout,
    environment,
    fetchImplementation = defaultFetchImplementation(),
    logger = Logger.noOp(),
  }: ConfidenceOptions): Confidence {
    const sdk = {
      id: SdkId.SDK_ID_JS_CONFIDENCE,
      version: '0.0.2', // x-release-please-version
    } as const;
    const flagResolverClient = new FlagResolverClient({
      clientSecret,
      // region,
      // baseUrl,
      // timeout,
      // environment,
      fetchImplementation,
      sdk,
    });
    const estEventSizeKb = 1;
    const flushTimeoutMilliseconds = 500;
    // default grpc payload limit is 4MB, so we aim for a 1MB batch-size
    const maxBatchSize = Math.floor(1024 / estEventSizeKb);
    const eventSenderEngine = new EventSenderEngine({
      clientSecret,
      maxBatchSize,
      flushTimeoutMilliseconds,
      fetchImplementation: fetchImplementation,
      region: nonGlobalRegion(region),
      // we set rate limit to support the flushTimeout
      // on backend, the rate limit would be ∞
      rateLimitRps: environment === 'client' ? 1000 / flushTimeoutMilliseconds : Number.POSITIVE_INFINITY,
      // the request is queued or in flight in memory to be sent.
      // max memory consumption is 50MB
      maxOpenRequests: (50 * 1024) / (estEventSizeKb * maxBatchSize),
      logger,
    });
    return new Confidence({
      environment: environment,
      flagResolverClient,
      eventSenderEngine,
    });
  }
}

function defaultFetchImplementation(): typeof fetch {
  if (!globalThis.fetch) {
    throw new TypeError(
      'No default fetch implementation found. Please provide provide the fetchImplementation option to createConfidenceWebProvider.',
    );
  }
  return globalThis.fetch.bind(globalThis);
}

function nonGlobalRegion(region: 'eu' | 'us' | 'global' = 'eu'): 'eu' | 'us' {
  return region === 'global' ? 'eu' : region;
}

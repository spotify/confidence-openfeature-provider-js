import { FlagResolverClient, FlagResolution, ApplyManager } from './FlagResolverClient';
import { EventSenderEngine } from './EventSenderEngine';
import { Value } from './Value';
import { EventSender } from './events';
import { Context } from './context';

export { FlagResolverClient, FlagResolution };

const APPLY_TIMEOUT = 250;
const MAX_APPLY_BUFFER_SIZE = 20;

export interface ConfidenceOptions {
  clientSecret: string;
  region?: 'global' | 'eu' | 'us';
  baseUrl?: string;
  environment: 'client' | 'backend';
  fetchImplementation?: typeof fetch;
  timeout: number;
}

interface Configuration {
  readonly environment: 'client' | 'backend';
  readonly eventSenderEngine: EventSenderEngine;
  readonly flagResolverClient: FlagResolverClient;
  readonly applyManager: ApplyManager;
}

export class Confidence implements EventSender {
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

  sendEvent(name: string, message?: Value) {
    this.config.eventSenderEngine.send(name, message, this.getContext());
  }

  private *contextEntries(): Iterable<[key: string, value: Value]> {
    if (this.parent) {
      for (const entry of this.parent.contextEntries()) {
        // todo should we do a deep merge of entries?
        if (!this._context.has(entry[0])) {
          yield entry;
        }
      }
    }
    yield* this._context.entries();
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
      this.updateContext(key, context[key]);
    }
  }

  updateContext<K extends string>(name: K, value: Context[K]) {
    this._context.set(name, Value.clone(value));
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
    // todo evaluationContext should be the whole context, but for now we take just the openFeature context to not break e2e tests
    const evaluationContext: Value.Struct = (this._context.get('openFeature') || {}) as Value.Struct;
    return this.config.flagResolverClient.resolve(evaluationContext, { apply: false, flags: flagNames });
  }

  /**
   * @internal
   */
  apply(resolveToken: string, flagName: string): void {
    this.config.applyManager.apply(resolveToken, flagName);
  }

  static create(options: ConfidenceOptions): Confidence {
    const sdk = {
      id: 'SDK_ID_JS_WEB_PROVIDER',
      version: '0.0.1-total-confidence',
    } as const;
    const fetchImplementation = options.fetchImplementation || defaultFetchImplementation();
    const flagResolverClient = new FlagResolverClient({
      clientSecret: options.clientSecret,
      region: options.region,
      baseUrl: options.baseUrl,
      timeout: options.timeout,
      apply: options.environment === 'backend',
      environment: options.environment,
      fetchImplementation,
      sdk,
    });
    return new Confidence({
      environment: options.environment,
      flagResolverClient,
      eventSenderEngine: new EventSenderEngine(),
      applyManager: new ApplyManager({
        client: flagResolverClient,
        timeout: APPLY_TIMEOUT,
        maxBufferSize: MAX_APPLY_BUFFER_SIZE,
      }),
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
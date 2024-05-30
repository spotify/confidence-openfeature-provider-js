import {
  CachingFlagResolverClient,
  FetchingFlagResolverClient,
  FlagResolverClient,
  PendingResolution,
} from './FlagResolverClient';
import { EventSenderEngine } from './EventSenderEngine';
import { Value } from './Value';
import { EventSender } from './events';
import { Context } from './context';
import { Logger } from './logger';
import { FlagEvaluation, FlagResolver, State, StateObserver } from './flags';
import { SdkId } from './generated/confidence/flags/resolver/v1/types';
import { visitorIdentity } from './trackers';
import { Trackable } from './Trackable';
import { Closer } from './Closer';
import { Subscribe, Observer, subject, changeObserver } from './observing';
import { SimpleFetch } from './types';
import { FlagResolution } from './FlagResolution';
import { AccessiblePromise } from './AccessiblePromise';

export interface ConfidenceOptions {
  clientSecret: string;
  region?: 'eu' | 'us';
  resolveUrl?: string;
  environment: 'client' | 'backend';
  fetchImplementation?: SimpleFetch;
  timeout: number;
  logger?: Logger;
}

export interface Configuration {
  readonly environment: 'client' | 'backend';
  readonly logger: Logger;
  readonly timeout: number;
  /** @internal */
  readonly eventSenderEngine: EventSenderEngine;
  /** @internal */
  readonly flagResolverClient: FlagResolverClient;
}

export class Confidence implements EventSender, Trackable, FlagResolver {
  readonly config: Configuration;
  private readonly parent?: Confidence;
  private _context: Map<string, Value> = new Map();
  private contextChanged?: Observer<string[]>;

  /** @internal */
  readonly contextChanges: Subscribe<string[]>;

  private currentFlags?: FlagResolution;
  private pendingFlags?: PendingResolution;

  private readonly flagStateSubject: Subscribe<State>;

  constructor(config: Configuration, parent?: Confidence) {
    this.config = config;
    this.parent = parent;
    this.contextChanges = subject(observer => {
      let parentSubscription: Closer | void;
      if (parent) {
        parentSubscription = parent.contextChanges(keys => {
          const visibleKeys = keys.filter(key => !this._context.has(key));
          if (visibleKeys.length) observer(visibleKeys);
        });
      }
      this.contextChanged = observer;
      return () => {
        parentSubscription?.();
        this.contextChanged = undefined;
      };
    });

    this.flagStateSubject = subject(observer => {
      const reportState = () => observer(this.flagState);
      if (!this.currentFlags || !Value.equal(this.currentFlags.context, this.getContext())) {
        this.resolveFlags().then(reportState);
      }
      const close = this.contextChanges(() => {
        if (this.flagState === 'READY') observer('STALE');
        this.resolveFlags().then(reportState);
      });

      return () => {
        close();
        this.pendingFlags?.abort();
        this.pendingFlags = undefined;
      };
    });
  }

  get environment(): string {
    return this.config.environment;
  }

  private sendEvent(name: string, message?: Value.Struct): void {
    this.config.eventSenderEngine.send(this.getContext(), name, message);
  }

  private *contextEntries(): Iterable<[key: string, value: Value]> {
    if (this.parent) {
      // all parent entries except the ones child also has
      for (const entry of this.parent.contextEntries()) {
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

  setContext(context: Context): boolean {
    const current = this.getContext();
    const changedKeys: string[] = [];
    for (const key of Object.keys(context)) {
      if (Value.equal(current[key], context[key])) continue;
      changedKeys.push(key);
      this._context.set(key, Value.clone(context[key]));
    }
    if (this.contextChanged && changedKeys.length > 0) {
      this.contextChanged(changedKeys);
    }
    return changedKeys.length > 0;
  }

  clearContext(): void {
    const oldContext = this.getContext();
    this._context.clear();
    if (this.contextChanged) {
      const newContext = this.getContext();
      const unionKeys = Array.from(new Set([...Object.keys(oldContext), ...Object.keys(newContext)]));
      const changedKeys = unionKeys.filter(key => !Value.equal(oldContext[key], newContext[key]));
      if (changedKeys.length) this.contextChanged(changedKeys);
    }
  }

  withContext(context: Context): Confidence {
    const child = new Confidence(this.config, this);
    child.setContext(context);
    // child.resolveFlags();
    return child;
  }

  track(name: string, message?: Value.Struct): void;
  track(manager: Trackable.Manager): Closer;
  track(nameOrManager: string | Trackable.Manager, message?: Value.Struct): Closer | undefined {
    if (typeof nameOrManager === 'function') {
      return Trackable.setup(this, nameOrManager);
    }
    this.sendEvent(nameOrManager, message);
    return undefined;
  }

  protected resolveFlags(): AccessiblePromise<void> {
    const context = this.getContext();
    let donePromise: AccessiblePromise<void> | undefined;
    if (!this.pendingFlags || !Value.equal(this.pendingFlags.context, context)) {
      this.pendingFlags?.abort(new Error('Context changed'));
      this.pendingFlags = this.config.flagResolverClient.resolve(context, []);
      donePromise = this.pendingFlags
        .then(resolution => {
          this.currentFlags = resolution;
        })
        .catch(e => {
          // TODO fix sloppy handling of error
          if (e.message !== 'Context changed') {
            this.config.logger.info?.('Resolve failed.', e);
          }
        })
        .finally(() => {
          this.pendingFlags = undefined;
        });
    }
    // pendingFlags might resolve synchronously, in which case it's already removed and we can return a resolved promise
    return donePromise ?? AccessiblePromise.resolve();
  }

  private get flagState(): State {
    if (this.currentFlags) {
      if (this.pendingFlags) return 'STALE';
      return 'READY';
    }
    return 'NOT_READY';
  }

  subscribe(onStateChange: StateObserver = () => {}): () => void {
    const observer = changeObserver(onStateChange);
    const close = this.flagStateSubject(observer);
    observer(this.flagState);
    return close;
  }

  private evaluateFlagAsync<T extends Value>(path: string, defaultValue: T): Promise<FlagEvaluation.Resolved<T>> {
    let close: () => void;
    return new Promise<FlagEvaluation.Resolved<T>>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout evaluating flag "${path}"`));
      }, this.config.timeout);
      close = this.subscribe(state => {
        // when state is ready we can be sure currentFlags exist
        if (state === 'READY') {
          clearTimeout(timeoutId);
          resolve(this.currentFlags!.evaluate(path, defaultValue));
        }
      });
    }).finally(close!);
  }

  getFlag<T extends Value>(path: string, defaultValue: T): FlagEvaluation<T> {
    let evaluation: FlagEvaluation<T>;
    // resolveFlags might update state synchronously
    if (!this.currentFlags && !this.pendingFlags) this.resolveFlags();
    if (!this.currentFlags) {
      evaluation = {
        reason: 'ERROR',
        errorCode: 'NOT_READY',
        errorMessage: 'Flags are not yet ready',
        value: defaultValue,
      };
    } else {
      evaluation = this.currentFlags.evaluate(path, defaultValue);
    }
    if (!this.currentFlags || !Value.equal(this.currentFlags.context, this.getContext())) {
      const then: PromiseLike<FlagEvaluation.Resolved<T>>['then'] = (onfulfilled?, onrejected?) =>
        this.evaluateFlagAsync(path, defaultValue).then(onfulfilled, onrejected);
      const staleEvaluation = {
        ...evaluation,
        then,
      };
      // if (this.environment === 'react') throw staleEvaluation;
      return staleEvaluation;
    }
    return evaluation;
  }

  static create({
    clientSecret,
    region,
    timeout,
    environment,
    fetchImplementation = defaultFetchImplementation(),
    logger = defaultLogger(),
  }: ConfidenceOptions): Confidence {
    const sdk = {
      id: SdkId.SDK_ID_JS_CONFIDENCE,
      version: '0.0.5', // x-release-please-version
    } as const;
    let flagResolverClient: FlagResolverClient = new FetchingFlagResolverClient({
      clientSecret,
      fetchImplementation,
      sdk,
      environment,
      region,
    });
    if (environment === 'client') {
      flagResolverClient = new CachingFlagResolverClient(flagResolverClient, 3000_000);
    }
    const estEventSizeKb = 1;
    const flushTimeoutMilliseconds = 500;
    // default grpc payload limit is 4MB, so we aim for a 1MB batch-size
    const maxBatchSize = Math.floor(1024 / estEventSizeKb);
    const eventSenderEngine = new EventSenderEngine({
      clientSecret,
      maxBatchSize,
      flushTimeoutMilliseconds,
      fetchImplementation,
      region,
      // we set rate limit to support the flushTimeout
      // on backend, the rate limit would be ∞
      rateLimitRps: environment === 'client' ? 1000 / flushTimeoutMilliseconds : Number.POSITIVE_INFINITY,
      // the request is queued or in flight in memory to be sent.
      // max memory consumption is 50MB
      maxOpenRequests: (50 * 1024) / (estEventSizeKb * maxBatchSize),
      logger,
    });
    const root = new Confidence({
      environment: environment,
      flagResolverClient,
      eventSenderEngine,
      timeout,
      logger,
    });
    if (environment === 'client') {
      root.track(visitorIdentity());
    }
    return root;
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

function defaultLogger(): Logger {
  try {
    if (process.env.NODE_ENV === 'development') {
      return Logger.withLevel(console, 'info');
    }
  } catch (e) {
    // ignore
  }
  return Logger.noOp();
}

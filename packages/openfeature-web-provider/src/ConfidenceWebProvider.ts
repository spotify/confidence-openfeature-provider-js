import {
  ErrorCode,
  EvaluationContext,
  EvaluationContextValue,
  JsonValue,
  Logger,
  OpenFeatureEventEmitter,
  Provider,
  ProviderEvents,
  ProviderMetadata,
  ResolutionDetails,
  ResolutionReason,
} from '@openfeature/web-sdk';
import equal from 'fast-deep-equal';

import { Confidence, FlagResolution, Value, Context } from '@spotify-confidence/sdk';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export class ConfidenceWebProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: 'ConfidenceWebProvider',
  };
  readonly events = new OpenFeatureEventEmitter();

  private pendingFlagResolution?: Promise<FlagResolution>;
  private currentFlagResolution?: FlagResolution;
  private unsubscribe?: () => void;
  private readonly confidence: Confidence;

  constructor(confidence: Confidence) {
    this.confidence = confidence;
  }

  async initialize(context?: EvaluationContext): Promise<void> {
    if (context) this.confidence.setContext(convertContext(context));
    this.unsubscribe = this.confidence.contextChanges(() => {
      this.events.emit(ProviderEvents.Stale);
      try {
        this.resolve();
      } catch (e) {
        // ignore
      }
    });
    await this.resolve();
  }

  async onClose(): Promise<void> {
    this.unsubscribe?.();
    this.currentFlagResolution = undefined;
    this.pendingFlagResolution = undefined;
  }

  async onContextChange(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void> {
    const changes = contextChanges(oldContext, newContext);
    if (Object.keys(changes).length === 0) {
      return;
    }
    this.confidence.setContext(convertContext(changes));
    await this.pendingFlagResolution;
  }

  private async resolve(): Promise<void> {
    const pending = (this.pendingFlagResolution = this.confidence.resolve([]));
    try {
      const resolved = await pending;
      if (pending === this.pendingFlagResolution) {
        this.currentFlagResolution = resolved;
        this.pendingFlagResolution = undefined;
        this.events.emit(ProviderEvents.Ready);
        this.events.emit(ProviderEvents.ConfigurationChanged);
      }
    } catch (e) {
      if (pending === this.pendingFlagResolution) {
        this.pendingFlagResolution = undefined;
        this.events.emit(ProviderEvents.Error);
        throw e;
      }
    }
  }

  private getFlag<T>(
    flagKey: string,
    defaultValue: T,
    _context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<T> {
    if (!this.currentFlagResolution) {
      logger.warn('Confidence: provider not ready');
      return {
        errorCode: ErrorCode.PROVIDER_NOT_READY,
        value: defaultValue,
        reason: 'ERROR',
      };
    }

    const [flagName, ...pathParts] = flagKey.split('.');

    try {
      const flag = this.currentFlagResolution.flags[flagName];

      if (!flag) {
        logger.warn('Confidence: flag "%s" was not found', flagName);
        return {
          errorCode: ErrorCode.FLAG_NOT_FOUND,
          value: defaultValue,
          reason: 'ERROR',
        };
      }

      if (FlagResolution.ResolveReason.NoSegmentMatch === flag.reason) {
        if (this.confidence.environment === 'client') {
          this.confidence.apply(this.currentFlagResolution.resolveToken, flagName);
        }
        return {
          value: defaultValue,
          reason: 'DEFAULT',
        };
      }

      let flagValue: FlagResolution.FlagValue;
      try {
        flagValue = FlagResolution.FlagValue.traverse(flag, pathParts.join('.'));
      } catch (e) {
        logger.warn('Confidence: value with path "%s" was not found in flag "%s"', pathParts.join('.'), flagName);
        return {
          errorCode: ErrorCode.PARSE_ERROR,
          value: defaultValue,
          reason: 'ERROR',
        };
      }

      if (flagValue.value === null) {
        return {
          value: defaultValue,
          reason: mapConfidenceReason(flag.reason),
        };
      }

      if (!FlagResolution.FlagValue.matches(flagValue, defaultValue)) {
        logger.warn('Confidence: value for "%s" is of incorrect type', flagKey);
        return {
          errorCode: ErrorCode.TYPE_MISMATCH,
          value: defaultValue,
          reason: 'ERROR',
        };
      }

      if (this.confidence.environment === 'client') {
        this.confidence.apply(this.currentFlagResolution.resolveToken, flagName);
      }
      logger.info('Confidence: value for "%s" successfully evaluated', flagKey);
      const reason = this.pendingFlagResolution ? 'STALE' : mapConfidenceReason(flag.reason);

      return {
        value: flagValue.value as T,
        reason: reason,
        variant: flag.variant,
        flagMetadata: {
          resolveToken: this.currentFlagResolution.resolveToken,
        },
      };
    } catch (e: unknown) {
      logger.warn('Confidence: error %o occurred in flag evaluation', e);
      return {
        errorCode: ErrorCode.GENERAL,
        value: defaultValue,
        reason: 'ERROR',
      };
    }
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<boolean> {
    return this.getFlag(flagKey, defaultValue, context, logger);
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<number> {
    return this.getFlag(flagKey, defaultValue, context, logger);
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<T> {
    return this.getFlag(flagKey, defaultValue, context, logger);
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<string> {
    return this.getFlag(flagKey, defaultValue, context, logger);
  }
}

function contextChanges(oldContext: EvaluationContext, newContext: EvaluationContext): EvaluationContext {
  const uniqueKeys = new Set([...Object.keys(newContext), ...Object.keys(oldContext)]);
  const changes: EvaluationContext = {};
  for (const key of uniqueKeys) {
    if (!equal(newContext[key], oldContext[key])) {
      if (key === 'targetingKey') {
        // targetingKey is a special case, it should never set to null but rather undefined
        changes[key] = newContext[key];
      } else {
        changes[key] = newContext[key] ?? null;
      }
    }
  }
  return changes;
}

function convertContext({ targetingKey, ...context }: EvaluationContext): Context {
  const targetingContext = typeof targetingKey !== 'undefined' ? { targeting_key: targetingKey } : {};
  return { ...targetingContext, ...convertStruct(context) };
}

function convertValue(value: EvaluationContextValue): Value {
  if (typeof value === 'object') {
    if (value === null) return undefined;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(convertValue);
    return convertStruct(value);
  }
  return value;
}

function convertStruct(value: { [key: string]: EvaluationContextValue }): Value.Struct {
  const struct: Mutable<Value.Struct> = {};
  for (const key of Object.keys(value)) {
    if (typeof value[key] === 'undefined') continue;
    struct[key] = convertValue(value[key]);
  }
  return struct;
}

function mapConfidenceReason(reason: FlagResolution.ResolveReason): ResolutionReason {
  switch (reason) {
    case FlagResolution.ResolveReason.Archived:
      return 'DISABLED';
    case FlagResolution.ResolveReason.Unspecified:
      return 'UNKNOWN';
    case FlagResolution.ResolveReason.Match:
      return 'TARGETING_MATCH';
    default:
      return 'DEFAULT';
  }
}

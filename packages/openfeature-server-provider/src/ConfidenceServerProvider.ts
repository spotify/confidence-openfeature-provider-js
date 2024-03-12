import {
  ErrorCode,
  EvaluationContext,
  EvaluationContextValue,
  JsonValue,
  Logger,
  Provider,
  ProviderMetadata,
  ProviderStatus,
  ResolutionDetails,
  ResolutionReason,
} from '@openfeature/server-sdk';

import { Confidence, Context, Value, FlagResolution } from '@spotify-confidence/sdk';

export class ConfidenceServerProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: 'ConfidenceServerProvider',
  };
  status: ProviderStatus = ProviderStatus.READY;
  private readonly confidence: Confidence;

  constructor(client: Confidence) {
    this.confidence = client;
  }

  private convertContext({ targetingKey, ...rest }: EvaluationContext): Context {
    return {
      openFeature: { targeting_key: targetingKey, ...(convertValue(rest) as Value.Struct) },
    };
  }

  private getFlag<T>(
    configuration: FlagResolution,
    flagKey: string,
    defaultValue: T,
    _logger: Logger,
  ): ResolutionDetails<T> {
    if (!configuration) {
      return {
        errorCode: ErrorCode.PROVIDER_NOT_READY,
        value: defaultValue,
        reason: 'ERROR',
      };
    }

    const [flagName, ...pathParts] = flagKey.split('.');
    try {
      const flag = configuration.flags[flagName];

      if (!flag) {
        return {
          errorCode: ErrorCode.FLAG_NOT_FOUND,
          value: defaultValue,
          reason: 'ERROR',
        };
      }

      if (FlagResolution.ResolveReason.NoSegmentMatch === flag.reason) {
        return {
          value: defaultValue,
          reason: 'DEFAULT',
        };
      }

      let flagValue: FlagResolution.FlagValue;
      try {
        flagValue = FlagResolution.FlagValue.traverse(flag, pathParts.join('.'));
      } catch (e) {
        return {
          errorCode: 'PARSE_ERROR' as ErrorCode,
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
        return {
          errorCode: 'TYPE_MISMATCH' as ErrorCode,
          value: defaultValue,
          reason: 'ERROR',
        };
      }

      return {
        value: flagValue.value as T,
        reason: mapConfidenceReason(flag.reason),
        variant: flag.variant,
        flagMetadata: {
          resolveToken: configuration.resolveToken || '',
        },
      };
    } catch (e) {
      return {
        errorCode: ErrorCode.GENERAL,
        value: defaultValue,
        reason: 'ERROR',
      };
    }
  }

  private async fetchFlag<T>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<T>> {
    const [flagName] = flagKey.split('.');

    const configuration = await this.confidence
      .withContext(this.convertContext(context))
      .resolve([`flags/${flagName}`]);

    return this.getFlag(configuration, flagKey, defaultValue, logger);
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<boolean>> {
    return this.fetchFlag(flagKey, defaultValue, context, logger);
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<number>> {
    return this.fetchFlag(flagKey, defaultValue, context, logger);
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<T>> {
    return this.fetchFlag(flagKey, defaultValue, context, logger);
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<string>> {
    return this.fetchFlag(flagKey, defaultValue, context, logger);
  }
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

function convertValue(value: EvaluationContextValue): Value {
  if (value === null) return undefined;
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(convertValue);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const struct: Record<string, Value> = {};
    for (const key of Object.keys(value)) {
      struct[key] = convertValue(value[key]);
    }
    return struct;
  }
  return value;
}

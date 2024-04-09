/* eslint-disable */

export const protobufPackage = 'confidence.flags.resolver.v1';

export enum ResolveReason {
  /** RESOLVE_REASON_UNSPECIFIED - Unspecified enum. */
  RESOLVE_REASON_UNSPECIFIED = 0,
  /** RESOLVE_REASON_MATCH - The flag was successfully resolved because one rule matched. */
  RESOLVE_REASON_MATCH = 1,
  /** RESOLVE_REASON_NO_SEGMENT_MATCH - The flag could not be resolved because no rule matched. */
  RESOLVE_REASON_NO_SEGMENT_MATCH = 2,
  /**
   * RESOLVE_REASON_NO_TREATMENT_MATCH - The flag could not be resolved because the matching rule had no variant
   * that could be assigned.
   *
   * @deprecated
   */
  RESOLVE_REASON_NO_TREATMENT_MATCH = 3,
  /** RESOLVE_REASON_FLAG_ARCHIVED - The flag could not be resolved because it was archived. */
  RESOLVE_REASON_FLAG_ARCHIVED = 4,
  /** RESOLVE_REASON_TARGETING_KEY_ERROR - The flag could not be resolved because the targeting key field was invalid */
  RESOLVE_REASON_TARGETING_KEY_ERROR = 5,
  /** RESOLVE_REASON_ERROR - Unknown error occurred during the resolve */
  RESOLVE_REASON_ERROR = 6,
  UNRECOGNIZED = -1,
}

export function resolveReasonFromJSON(object: any): ResolveReason {
  switch (object) {
    case 0:
    case 'RESOLVE_REASON_UNSPECIFIED':
      return ResolveReason.RESOLVE_REASON_UNSPECIFIED;
    case 1:
    case 'RESOLVE_REASON_MATCH':
      return ResolveReason.RESOLVE_REASON_MATCH;
    case 2:
    case 'RESOLVE_REASON_NO_SEGMENT_MATCH':
      return ResolveReason.RESOLVE_REASON_NO_SEGMENT_MATCH;
    case 3:
    case 'RESOLVE_REASON_NO_TREATMENT_MATCH':
      return ResolveReason.RESOLVE_REASON_NO_TREATMENT_MATCH;
    case 4:
    case 'RESOLVE_REASON_FLAG_ARCHIVED':
      return ResolveReason.RESOLVE_REASON_FLAG_ARCHIVED;
    case 5:
    case 'RESOLVE_REASON_TARGETING_KEY_ERROR':
      return ResolveReason.RESOLVE_REASON_TARGETING_KEY_ERROR;
    case 6:
    case 'RESOLVE_REASON_ERROR':
      return ResolveReason.RESOLVE_REASON_ERROR;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return ResolveReason.UNRECOGNIZED;
  }
}

export function resolveReasonToJSON(object: ResolveReason): string {
  switch (object) {
    case ResolveReason.RESOLVE_REASON_UNSPECIFIED:
      return 'RESOLVE_REASON_UNSPECIFIED';
    case ResolveReason.RESOLVE_REASON_MATCH:
      return 'RESOLVE_REASON_MATCH';
    case ResolveReason.RESOLVE_REASON_NO_SEGMENT_MATCH:
      return 'RESOLVE_REASON_NO_SEGMENT_MATCH';
    case ResolveReason.RESOLVE_REASON_NO_TREATMENT_MATCH:
      return 'RESOLVE_REASON_NO_TREATMENT_MATCH';
    case ResolveReason.RESOLVE_REASON_FLAG_ARCHIVED:
      return 'RESOLVE_REASON_FLAG_ARCHIVED';
    case ResolveReason.RESOLVE_REASON_TARGETING_KEY_ERROR:
      return 'RESOLVE_REASON_TARGETING_KEY_ERROR';
    case ResolveReason.RESOLVE_REASON_ERROR:
      return 'RESOLVE_REASON_ERROR';
    case ResolveReason.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export enum SdkId {
  /** SDK_ID_UNSPECIFIED - Unspecified enum. */
  SDK_ID_UNSPECIFIED = 0,
  /** SDK_ID_JAVA_PROVIDER - Confidence OpenFeature Java Provider. */
  SDK_ID_JAVA_PROVIDER = 1,
  /** SDK_ID_KOTLIN_PROVIDER - Confidence OpenFeature Kotlin Provider. */
  SDK_ID_KOTLIN_PROVIDER = 2,
  /** SDK_ID_SWIFT_PROVIDER - Confidence OpenFeature Swift Provider. */
  SDK_ID_SWIFT_PROVIDER = 3,
  /** SDK_ID_JS_WEB_PROVIDER - Confidence OpenFeature JavaScript Provider for Web (client). */
  SDK_ID_JS_WEB_PROVIDER = 4,
  /** SDK_ID_JS_SERVER_PROVIDER - Confidence OpenFeature JavaScript Provider for server. */
  SDK_ID_JS_SERVER_PROVIDER = 5,
  /** SDK_ID_PYTHON_PROVIDER - Confidence OpenFeature Python Provider. */
  SDK_ID_PYTHON_PROVIDER = 6,
  /** SDK_ID_GO_PROVIDER - Confidence OpenFeature GO Provider. */
  SDK_ID_GO_PROVIDER = 7,
  /** SDK_ID_RUBY_PROVIDER - Confidence OpenFeature Ruby Provider. */
  SDK_ID_RUBY_PROVIDER = 8,
  /** SDK_ID_RUST_PROVIDER - Confidence OpenFeature Rust Provider. */
  SDK_ID_RUST_PROVIDER = 9,
  /** SDK_ID_JAVA_CONFIDENCE - Confidence Java SDK. */
  SDK_ID_JAVA_CONFIDENCE = 10,
  /** SDK_ID_KOTLIN_CONFIDENCE - Confidence Kotlin SDK. */
  SDK_ID_KOTLIN_CONFIDENCE = 11,
  /** SDK_ID_SWIFT_CONFIDENCE - Confidence Swift SDK. */
  SDK_ID_SWIFT_CONFIDENCE = 12,
  /** SDK_ID_JS_CONFIDENCE - Confidence JavaScript SDK. */
  SDK_ID_JS_CONFIDENCE = 13,
  /** SDK_ID_PYTHON_CONFIDENCE - Confidence Python SDK. */
  SDK_ID_PYTHON_CONFIDENCE = 14,
  /** SDK_ID_GO_CONFIDENCE - Confidence GO SDK. */
  SDK_ID_GO_CONFIDENCE = 15,
  UNRECOGNIZED = -1,
}

export function sdkIdFromJSON(object: any): SdkId {
  switch (object) {
    case 0:
    case 'SDK_ID_UNSPECIFIED':
      return SdkId.SDK_ID_UNSPECIFIED;
    case 1:
    case 'SDK_ID_JAVA_PROVIDER':
      return SdkId.SDK_ID_JAVA_PROVIDER;
    case 2:
    case 'SDK_ID_KOTLIN_PROVIDER':
      return SdkId.SDK_ID_KOTLIN_PROVIDER;
    case 3:
    case 'SDK_ID_SWIFT_PROVIDER':
      return SdkId.SDK_ID_SWIFT_PROVIDER;
    case 4:
    case 'SDK_ID_JS_WEB_PROVIDER':
      return SdkId.SDK_ID_JS_WEB_PROVIDER;
    case 5:
    case 'SDK_ID_JS_SERVER_PROVIDER':
      return SdkId.SDK_ID_JS_SERVER_PROVIDER;
    case 6:
    case 'SDK_ID_PYTHON_PROVIDER':
      return SdkId.SDK_ID_PYTHON_PROVIDER;
    case 7:
    case 'SDK_ID_GO_PROVIDER':
      return SdkId.SDK_ID_GO_PROVIDER;
    case 8:
    case 'SDK_ID_RUBY_PROVIDER':
      return SdkId.SDK_ID_RUBY_PROVIDER;
    case 9:
    case 'SDK_ID_RUST_PROVIDER':
      return SdkId.SDK_ID_RUST_PROVIDER;
    case 10:
    case 'SDK_ID_JAVA_CONFIDENCE':
      return SdkId.SDK_ID_JAVA_CONFIDENCE;
    case 11:
    case 'SDK_ID_KOTLIN_CONFIDENCE':
      return SdkId.SDK_ID_KOTLIN_CONFIDENCE;
    case 12:
    case 'SDK_ID_SWIFT_CONFIDENCE':
      return SdkId.SDK_ID_SWIFT_CONFIDENCE;
    case 13:
    case 'SDK_ID_JS_CONFIDENCE':
      return SdkId.SDK_ID_JS_CONFIDENCE;
    case 14:
    case 'SDK_ID_PYTHON_CONFIDENCE':
      return SdkId.SDK_ID_PYTHON_CONFIDENCE;
    case 15:
    case 'SDK_ID_GO_CONFIDENCE':
      return SdkId.SDK_ID_GO_CONFIDENCE;
    case -1:
    case 'UNRECOGNIZED':
    default:
      return SdkId.UNRECOGNIZED;
  }
}

export function sdkIdToJSON(object: SdkId): string {
  switch (object) {
    case SdkId.SDK_ID_UNSPECIFIED:
      return 'SDK_ID_UNSPECIFIED';
    case SdkId.SDK_ID_JAVA_PROVIDER:
      return 'SDK_ID_JAVA_PROVIDER';
    case SdkId.SDK_ID_KOTLIN_PROVIDER:
      return 'SDK_ID_KOTLIN_PROVIDER';
    case SdkId.SDK_ID_SWIFT_PROVIDER:
      return 'SDK_ID_SWIFT_PROVIDER';
    case SdkId.SDK_ID_JS_WEB_PROVIDER:
      return 'SDK_ID_JS_WEB_PROVIDER';
    case SdkId.SDK_ID_JS_SERVER_PROVIDER:
      return 'SDK_ID_JS_SERVER_PROVIDER';
    case SdkId.SDK_ID_PYTHON_PROVIDER:
      return 'SDK_ID_PYTHON_PROVIDER';
    case SdkId.SDK_ID_GO_PROVIDER:
      return 'SDK_ID_GO_PROVIDER';
    case SdkId.SDK_ID_RUBY_PROVIDER:
      return 'SDK_ID_RUBY_PROVIDER';
    case SdkId.SDK_ID_RUST_PROVIDER:
      return 'SDK_ID_RUST_PROVIDER';
    case SdkId.SDK_ID_JAVA_CONFIDENCE:
      return 'SDK_ID_JAVA_CONFIDENCE';
    case SdkId.SDK_ID_KOTLIN_CONFIDENCE:
      return 'SDK_ID_KOTLIN_CONFIDENCE';
    case SdkId.SDK_ID_SWIFT_CONFIDENCE:
      return 'SDK_ID_SWIFT_CONFIDENCE';
    case SdkId.SDK_ID_JS_CONFIDENCE:
      return 'SDK_ID_JS_CONFIDENCE';
    case SdkId.SDK_ID_PYTHON_CONFIDENCE:
      return 'SDK_ID_PYTHON_CONFIDENCE';
    case SdkId.SDK_ID_GO_CONFIDENCE:
      return 'SDK_ID_GO_CONFIDENCE';
    case SdkId.UNRECOGNIZED:
    default:
      return 'UNRECOGNIZED';
  }
}

export interface Sdk {
  /** Name of a Confidence SDKs. */
  id?: SdkId | undefined;
  /** Custom name for non-Confidence SDKs. */
  customId?: string | undefined;
  /** Version of the SDK. */
  version: string;
}

export const Sdk = {
  fromJSON(object: any): Sdk {
    return {
      id: isSet(object.id) ? sdkIdFromJSON(object.id) : undefined,
      customId: isSet(object.customId) ? globalThis.String(object.customId) : undefined,
      version: isSet(object.version) ? globalThis.String(object.version) : '',
    };
  },

  toJSON(message: Sdk): unknown {
    const obj: any = {};
    if (message.id !== undefined) {
      obj.id = sdkIdToJSON(message.id);
    }
    if (message.customId !== undefined) {
      obj.customId = message.customId;
    }
    if (message.version !== '') {
      obj.version = message.version;
    }
    return obj;
  },
};

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

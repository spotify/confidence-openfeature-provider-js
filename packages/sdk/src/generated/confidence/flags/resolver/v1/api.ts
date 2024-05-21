/* eslint-disable */
import { Timestamp } from '../../../../google/protobuf/timestamp';
import { FlagSchema_StructFlagSchema } from '../../types/v1/types';
import { ResolveReason, resolveReasonFromJSON, resolveReasonToJSON, Sdk } from './types';

export const protobufPackage = 'confidence.flags.resolver.v1';

export interface ResolveFlagsRequest {
  /**
   * If non-empty, the specific flags are resolved, otherwise all flags
   * available to the client will be resolved.
   */
  flags: string[];
  /**
   * An object that contains data used in the flag resolve. For example,
   * the targeting key e.g. the id of the randomization unit, other attributes
   * like country or version that are used for targeting.
   */
  evaluationContext: { [key: string]: any } | undefined;
  /**
   * Credentials for the client. It is used to identify the client and find
   * the flags that are available to it.
   */
  clientSecret: string;
  /**
   * Determines whether the flags should be applied directly as part of the
   * resolve, or delayed until `ApplyFlag` is called. A flag is typically
   * applied when it is used, if this occurs much later than the resolve, then
   * `apply` should likely be set to false.
   */
  apply: boolean;
  /** Information about the SDK used to initiate the request. */
  sdk: Sdk | undefined;
}

export interface ResolveFlagsResponse {
  /**
   * The list of all flags that could be resolved. Note: if any flag was
   * archived it will not be included in this list.
   */
  resolvedFlags: ResolvedFlag[];
  /**
   * An opaque token that is used when `apply` is set to false in `ResolveFlags`.
   * When `apply` is set to false, the token must be passed to `ApplyFlags`.
   */
  resolveToken: Uint8Array;
  /** Unique identifier for this particular resolve request. */
  resolveId: string;
}

export interface ApplyFlagsRequest {
  /** The flags to apply and information about when they were applied. */
  flags: AppliedFlag[];
  /** Credentials for the client. */
  clientSecret: string;
  /** An opaque token that was returned from `ResolveFlags`; it must be set. */
  resolveToken: Uint8Array;
  /**
   * The client time when the this request was sent, used for correcting
   * clock skew from the client.
   */
  sendTime: Date | undefined;
  /** Information about the SDK used to initiate the request. */
  sdk: Sdk | undefined;
}

export interface ApplyFlagsResponse {}

export interface AppliedFlag {
  /** The id of the flag that should be applied, has the format `flags/*`. */
  flag: string;
  /** The client time when the flag was applied. */
  applyTime: Date | undefined;
}

export interface ResolvedFlag {
  /** The id of the flag that as resolved. */
  flag: string;
  /** The id of the resolved variant has the format `flags/abc/variants/xyz`. */
  variant: string;
  /**
   * The value corresponding to the variant. It will always be a json object,
   * for example `{ "color": "red", "size": 12 }`.
   */
  value: { [key: string]: any } | undefined;
  /**
   * The schema of the value that was returned. For example:
   * ```
   * {
   *    "schema": {
   *      "color": { "stringSchema": {} },
   *      "size": { "intSchema": {} }
   *    }
   * }
   * ```
   */
  flagSchema: FlagSchema_StructFlagSchema | undefined;
  /** The reason to why the flag could be resolved or not. */
  reason: ResolveReason;
}

export const ResolveFlagsRequest = {
  fromJSON(object: any): ResolveFlagsRequest {
    return {
      flags: globalThis.Array.isArray(object?.flags) ? object.flags.map((e: any) => globalThis.String(e)) : [],
      evaluationContext: isObject(object.evaluationContext) ? object.evaluationContext : undefined,
      clientSecret: isSet(object.clientSecret) ? globalThis.String(object.clientSecret) : '',
      apply: isSet(object.apply) ? globalThis.Boolean(object.apply) : false,
      sdk: isSet(object.sdk) ? Sdk.fromJSON(object.sdk) : undefined,
    };
  },

  toJSON(message: ResolveFlagsRequest): unknown {
    const obj: any = {};
    if (message.flags?.length) {
      obj.flags = message.flags;
    }
    if (message.evaluationContext !== undefined) {
      obj.evaluationContext = message.evaluationContext;
    }
    if (message.clientSecret !== '') {
      obj.clientSecret = message.clientSecret;
    }
    if (message.apply !== false) {
      obj.apply = message.apply;
    }
    if (message.sdk !== undefined) {
      obj.sdk = Sdk.toJSON(message.sdk);
    }
    return obj;
  },
};

export const ResolveFlagsResponse = {
  fromJSON(object: any): ResolveFlagsResponse {
    return {
      resolvedFlags: globalThis.Array.isArray(object?.resolvedFlags)
        ? object.resolvedFlags.map((e: any) => ResolvedFlag.fromJSON(e))
        : [],
      resolveToken: isSet(object.resolveToken) ? bytesFromBase64(object.resolveToken) : new Uint8Array(0),
      resolveId: isSet(object.resolveId) ? globalThis.String(object.resolveId) : '',
    };
  },

  toJSON(message: ResolveFlagsResponse): unknown {
    const obj: any = {};
    if (message.resolvedFlags?.length) {
      obj.resolvedFlags = message.resolvedFlags.map(e => ResolvedFlag.toJSON(e));
    }
    if (message.resolveToken.length !== 0) {
      obj.resolveToken = base64FromBytes(message.resolveToken);
    }
    if (message.resolveId !== '') {
      obj.resolveId = message.resolveId;
    }
    return obj;
  },
};

export const ApplyFlagsRequest = {
  fromJSON(object: any): ApplyFlagsRequest {
    return {
      flags: globalThis.Array.isArray(object?.flags) ? object.flags.map((e: any) => AppliedFlag.fromJSON(e)) : [],
      clientSecret: isSet(object.clientSecret) ? globalThis.String(object.clientSecret) : '',
      resolveToken: isSet(object.resolveToken) ? bytesFromBase64(object.resolveToken) : new Uint8Array(0),
      sendTime: isSet(object.sendTime) ? fromJsonTimestamp(object.sendTime) : undefined,
      sdk: isSet(object.sdk) ? Sdk.fromJSON(object.sdk) : undefined,
    };
  },

  toJSON(message: ApplyFlagsRequest): unknown {
    const obj: any = {};
    if (message.flags?.length) {
      obj.flags = message.flags.map(e => AppliedFlag.toJSON(e));
    }
    if (message.clientSecret !== '') {
      obj.clientSecret = message.clientSecret;
    }
    if (message.resolveToken.length !== 0) {
      obj.resolveToken = base64FromBytes(message.resolveToken);
    }
    if (message.sendTime !== undefined) {
      obj.sendTime = message.sendTime.toISOString();
    }
    if (message.sdk !== undefined) {
      obj.sdk = Sdk.toJSON(message.sdk);
    }
    return obj;
  },
};

export const ApplyFlagsResponse = {
  fromJSON(_: any): ApplyFlagsResponse {
    return {};
  },

  toJSON(_: ApplyFlagsResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

export const AppliedFlag = {
  fromJSON(object: any): AppliedFlag {
    return {
      flag: isSet(object.flag) ? globalThis.String(object.flag) : '',
      applyTime: isSet(object.applyTime) ? fromJsonTimestamp(object.applyTime) : undefined,
    };
  },

  toJSON(message: AppliedFlag): unknown {
    const obj: any = {};
    if (message.flag !== '') {
      obj.flag = message.flag;
    }
    if (message.applyTime !== undefined) {
      obj.applyTime = message.applyTime.toISOString();
    }
    return obj;
  },
};

export const ResolvedFlag = {
  fromJSON(object: any): ResolvedFlag {
    return {
      flag: isSet(object.flag) ? globalThis.String(object.flag) : '',
      variant: isSet(object.variant) ? globalThis.String(object.variant) : '',
      value: isObject(object.value) ? object.value : undefined,
      flagSchema: isSet(object.flagSchema) ? FlagSchema_StructFlagSchema.fromJSON(object.flagSchema) : undefined,
      reason: isSet(object.reason) ? resolveReasonFromJSON(object.reason) : 0,
    };
  },

  toJSON(message: ResolvedFlag): unknown {
    const obj: any = {};
    if (message.flag !== '') {
      obj.flag = message.flag;
    }
    if (message.variant !== '') {
      obj.variant = message.variant;
    }
    if (message.value !== undefined) {
      obj.value = message.value;
    }
    if (message.flagSchema !== undefined) {
      obj.flagSchema = FlagSchema_StructFlagSchema.toJSON(message.flagSchema);
    }
    if (message.reason !== 0) {
      obj.reason = resolveReasonToJSON(message.reason);
    }
    return obj;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, 'base64'));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach(byte => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(''));
  }
}

function fromTimestamp(t: Timestamp): Date {
  let millis = (t.seconds || 0) * 1_000;
  millis += (t.nanos || 0) / 1_000_000;
  return new globalThis.Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof globalThis.Date) {
    return o;
  } else if (typeof o === 'string') {
    return new globalThis.Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

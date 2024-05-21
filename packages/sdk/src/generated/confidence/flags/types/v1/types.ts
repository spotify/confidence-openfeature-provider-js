/* eslint-disable */

export const protobufPackage = 'confidence.flags.types.v1';

/**
 * Schema for the value of a flag.
 *
 * The value of a flag is always a struct with one or more nested fields.
 * Example of a struct schema with two fields, `color` (a string) and `len` (an int):
 *
 * ```
 * {
 *   "schema": {
 *     "color": {
 *       "stringSchema": {}
 *     },
 *     "len": {
 *       "intSchema": {}
 *     }
 *   }
 * }
 * ```
 */
export interface FlagSchema {
  /** Schema if this is a struct */
  structSchema?: FlagSchema_StructFlagSchema | undefined;
  /** Schema if this is a list */
  listSchema?: FlagSchema_ListFlagSchema | undefined;
  /** Schema if this is an int */
  intSchema?: FlagSchema_IntFlagSchema | undefined;
  /** Schema if this is a double */
  doubleSchema?: FlagSchema_DoubleFlagSchema | undefined;
  /** Schema if this is a string */
  stringSchema?: FlagSchema_StringFlagSchema | undefined;
  /** Schema if this is a bool */
  boolSchema?: FlagSchema_BoolFlagSchema | undefined;
}

/**
 * A schema of nested fields. The length of the field name is limited to
 * 32 characters and can only contain alphanumeric characters, hyphens and
 * underscores. The number of fields in a struct is limited to 64.
 * Structs can not be nested more than four (4) levels.
 */
export interface FlagSchema_StructFlagSchema {
  /** Map of field name to the schema for the field */
  schema: { [key: string]: FlagSchema };
}

export interface FlagSchema_StructFlagSchema_SchemaEntry {
  key: string;
  value: FlagSchema | undefined;
}

/** A number that has a decimal place. */
export interface FlagSchema_DoubleFlagSchema {}

/** A whole number without a decimal point. */
export interface FlagSchema_IntFlagSchema {}

/** A string. The length is limited to 250 characters. */
export interface FlagSchema_StringFlagSchema {}

/** A boolean: true or false. */
export interface FlagSchema_BoolFlagSchema {}

/**
 * A list of values. The values have the same data types which
 * is defined by  `element_schema`.
 */
export interface FlagSchema_ListFlagSchema {
  /** The schema for the elements in the list */
  elementSchema: FlagSchema | undefined;
}

export const FlagSchema = {
  fromJSON(object: any): FlagSchema {
    return {
      structSchema: isSet(object.structSchema) ? FlagSchema_StructFlagSchema.fromJSON(object.structSchema) : undefined,
      listSchema: isSet(object.listSchema) ? FlagSchema_ListFlagSchema.fromJSON(object.listSchema) : undefined,
      intSchema: isSet(object.intSchema) ? FlagSchema_IntFlagSchema.fromJSON(object.intSchema) : undefined,
      doubleSchema: isSet(object.doubleSchema) ? FlagSchema_DoubleFlagSchema.fromJSON(object.doubleSchema) : undefined,
      stringSchema: isSet(object.stringSchema) ? FlagSchema_StringFlagSchema.fromJSON(object.stringSchema) : undefined,
      boolSchema: isSet(object.boolSchema) ? FlagSchema_BoolFlagSchema.fromJSON(object.boolSchema) : undefined,
    };
  },

  toJSON(message: FlagSchema): unknown {
    const obj: any = {};
    if (message.structSchema !== undefined) {
      obj.structSchema = FlagSchema_StructFlagSchema.toJSON(message.structSchema);
    }
    if (message.listSchema !== undefined) {
      obj.listSchema = FlagSchema_ListFlagSchema.toJSON(message.listSchema);
    }
    if (message.intSchema !== undefined) {
      obj.intSchema = FlagSchema_IntFlagSchema.toJSON(message.intSchema);
    }
    if (message.doubleSchema !== undefined) {
      obj.doubleSchema = FlagSchema_DoubleFlagSchema.toJSON(message.doubleSchema);
    }
    if (message.stringSchema !== undefined) {
      obj.stringSchema = FlagSchema_StringFlagSchema.toJSON(message.stringSchema);
    }
    if (message.boolSchema !== undefined) {
      obj.boolSchema = FlagSchema_BoolFlagSchema.toJSON(message.boolSchema);
    }
    return obj;
  },
};

export const FlagSchema_StructFlagSchema = {
  fromJSON(object: any): FlagSchema_StructFlagSchema {
    return {
      schema: isObject(object.schema)
        ? Object.entries(object.schema).reduce<{ [key: string]: FlagSchema }>((acc, [key, value]) => {
            acc[key] = FlagSchema.fromJSON(value);
            return acc;
          }, {})
        : {},
    };
  },

  toJSON(message: FlagSchema_StructFlagSchema): unknown {
    const obj: any = {};
    if (message.schema) {
      const entries = Object.entries(message.schema);
      if (entries.length > 0) {
        obj.schema = {};
        entries.forEach(([k, v]) => {
          obj.schema[k] = FlagSchema.toJSON(v);
        });
      }
    }
    return obj;
  },
};

export const FlagSchema_StructFlagSchema_SchemaEntry = {
  fromJSON(object: any): FlagSchema_StructFlagSchema_SchemaEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : '',
      value: isSet(object.value) ? FlagSchema.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: FlagSchema_StructFlagSchema_SchemaEntry): unknown {
    const obj: any = {};
    if (message.key !== '') {
      obj.key = message.key;
    }
    if (message.value !== undefined) {
      obj.value = FlagSchema.toJSON(message.value);
    }
    return obj;
  },
};

export const FlagSchema_DoubleFlagSchema = {
  fromJSON(_: any): FlagSchema_DoubleFlagSchema {
    return {};
  },

  toJSON(_: FlagSchema_DoubleFlagSchema): unknown {
    const obj: any = {};
    return obj;
  },
};

export const FlagSchema_IntFlagSchema = {
  fromJSON(_: any): FlagSchema_IntFlagSchema {
    return {};
  },

  toJSON(_: FlagSchema_IntFlagSchema): unknown {
    const obj: any = {};
    return obj;
  },
};

export const FlagSchema_StringFlagSchema = {
  fromJSON(_: any): FlagSchema_StringFlagSchema {
    return {};
  },

  toJSON(_: FlagSchema_StringFlagSchema): unknown {
    const obj: any = {};
    return obj;
  },
};

export const FlagSchema_BoolFlagSchema = {
  fromJSON(_: any): FlagSchema_BoolFlagSchema {
    return {};
  },

  toJSON(_: FlagSchema_BoolFlagSchema): unknown {
    const obj: any = {};
    return obj;
  },
};

export const FlagSchema_ListFlagSchema = {
  fromJSON(object: any): FlagSchema_ListFlagSchema {
    return { elementSchema: isSet(object.elementSchema) ? FlagSchema.fromJSON(object.elementSchema) : undefined };
  },

  toJSON(message: FlagSchema_ListFlagSchema): unknown {
    const obj: any = {};
    if (message.elementSchema !== undefined) {
      obj.elementSchema = FlagSchema.toJSON(message.elementSchema);
    }
    return obj;
  },
};

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

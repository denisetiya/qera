import type { ValidationSchema, ValidationRule } from './types.main';

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

export class Validator {
  constructor(private schema: ValidationSchema) {}

  static object(schema: ValidationSchema): Validator {
    return new Validator(schema);
  }

  static string(): {
    min: (length: number) => ValidationRule;
    max: (length: number) => ValidationRule;
    email: () => ValidationRule;
    required: () => ValidationRule;
  } {
    return {
      min: (length: number) => ({ type: 'string', min: length }),
      max: (length: number) => ({ type: 'string', max: length }),
      email: () => ({ type: 'string', format: 'email' }),
      required: () => ({ type: 'string', required: true })
    };
  }

  static number(): {
    min: (val: number) => ValidationRule;
    max: (val: number) => ValidationRule;
    required: () => ValidationRule;
  } {
    return {
      min: (val: number) => ({ type: 'number', min: val }),
      max: (val: number) => ({ type: 'number', max: val }),
      required: () => ({ type: 'number', required: true })
    };
  }

  static boolean(): {
    required: () => ValidationRule;
  } {
    return {
      required: () => ({ type: 'boolean', required: true })
    };
  }

  parse<T = any>(data: Record<string, any>): T {
    const errors: string[] = [];
    const result: Record<string, any> = {};

    for (const [key, rule] of Object.entries(this.schema)) {
      const value = data[key];
      
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Type validation
        if (rule.type === 'string' && typeof value !== 'string') {
          errors.push(`${key} must be a string`);
          continue;
        }
        
        if (rule.type === 'number' && typeof value !== 'number') {
          errors.push(`${key} must be a number`);
          continue;
        }

        if (rule.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
          continue;
        }

        // String validations
        if (rule.type === 'string') {
          if (rule.min && value.length < rule.min) {
            errors.push(`${key} must be at least ${rule.min} characters`);
            continue;
          }

          if (rule.max && value.length > rule.max) {
            errors.push(`${key} must be at most ${rule.max} characters`);
            continue;
          }

          if (rule.format === 'email' && !/\S+@\S+\.\S+/.test(value)) {
            errors.push(`${key} must be a valid email`);
            continue;
          }
        }

        // Number validations
        if (rule.type === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`${key} must be at least ${rule.min}`);
            continue;
          }

          if (rule.max !== undefined && value > rule.max) {
            errors.push(`${key} must be at most ${rule.max}`);
            continue;
          }
        }

        result[key] = value;
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return result as T;
  }
}
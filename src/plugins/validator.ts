import { Plugin, ValidationSchema } from '../types/index.js';

export class ValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(`Validation error on field '${field}': ${message}`);
    this.name = 'ValidationError';
  }
}

export class ValidatorPlugin implements Plugin {
  name = 'validator';

  install(app: any): void {
    app.validate = this.validate.bind(this);
    app.createValidator = this.createValidator.bind(this);
  }

  validate(data: any, schema: ValidationSchema): void {
    this.validateObject(data, schema, '');
  }

  private validateObject(data: any, schema: ValidationSchema, path: string): void {
    for (const [key, rules] of Object.entries(schema)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const value = data?.[key];

      if (rules.required && (value === undefined || value === null)) {
        throw new ValidationError(fieldPath, 'Field is required');
      }

      if (value !== undefined && value !== null) {
        this.validateValue(value, rules, fieldPath);
      }
    }
  }

  private validateValue(value: any, rules: any, path: string): void {
    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        throw new ValidationError(path, `Expected ${rules.type}, got ${actualType}`);
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.min && value.length < rules.min) {
        throw new ValidationError(path, `Minimum length is ${rules.min}`);
      }
      if (rules.max && value.length > rules.max) {
        throw new ValidationError(path, `Maximum length is ${rules.max}`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        throw new ValidationError(path, 'Pattern does not match');
      }
      if (rules.enum && !rules.enum.includes(value)) {
        throw new ValidationError(path, `Value must be one of: ${rules.enum.join(', ')}`);
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min && value < rules.min) {
        throw new ValidationError(path, `Minimum value is ${rules.min}`);
      }
      if (rules.max && value > rules.max) {
        throw new ValidationError(path, `Maximum value is ${rules.max}`);
      }
    }

    // Array validations
    if (rules.type === 'array' && Array.isArray(value)) {
      if (rules.min && value.length < rules.min) {
        throw new ValidationError(path, `Minimum array length is ${rules.min}`);
      }
      if (rules.max && value.length > rules.max) {
        throw new ValidationError(path, `Maximum array length is ${rules.max}`);
      }
      if (rules.items) {
        value.forEach((item, index) => {
          this.validateValue(item, rules.items, `${path}[${index}]`);
        });
      }
    }

    // Object validations
    if (rules.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      if (rules.properties) {
        this.validateObject(value, rules.properties, path);
      }
    }
  }

  createValidator(schema: ValidationSchema) {
    return (data: any) => {
      try {
        this.validate(data, schema);
        return { valid: true, errors: [] };
      } catch (error) {
        if (error instanceof ValidationError) {
          return { 
            valid: false, 
            errors: [{ field: error.field, message: error.message }] 
          };
        }
        throw error;
      }
    };
  }
}
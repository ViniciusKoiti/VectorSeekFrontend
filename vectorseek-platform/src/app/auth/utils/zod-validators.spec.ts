import { FormControl } from '@angular/forms';
import { z } from 'zod';
import { zodValidator, zodFormValidator, getZodErrorMessage } from './zod-validators';

describe('Zod Validators', () => {
  describe('zodValidator', () => {
    it('should return null for valid values', () => {
      const emailSchema = z.string().email();
      const validator = zodValidator(emailSchema);
      const control = new FormControl('test@example.com');

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should return error object for invalid values', () => {
      const emailSchema = z.string().email();
      const validator = zodValidator(emailSchema);
      const control = new FormControl('invalid-email');

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['zod']).toBeDefined();
      expect(result?.['zod'].message).toContain('email');
    });

    it('should return null for empty values', () => {
      const stringSchema = z.string().min(3);
      const validator = zodValidator(stringSchema);
      const control = new FormControl('');

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should validate for zero value', () => {
      const numberSchema = z.number().min(0);
      const validator = zodValidator(numberSchema);
      const control = new FormControl(0);

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should validate for false boolean value', () => {
      const booleanSchema = z.boolean();
      const validator = zodValidator(booleanSchema);
      const control = new FormControl(false);

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should handle minLength validation', () => {
      const passwordSchema = z.string().min(6);
      const validator = zodValidator(passwordSchema);
      const control = new FormControl('short');

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['zod'].code).toBe('too_small');
    });

    it('should handle pattern validation', () => {
      const strongPasswordSchema = z.string().regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/);
      const validator = zodValidator(strongPasswordSchema);
      const control = new FormControl('weakpassword');

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['zod'].code).toBe('invalid_string');
    });
  });

  describe('zodFormValidator', () => {
    it('should return null for valid form', () => {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      const validator = zodFormValidator(loginSchema);
      const control = new FormControl({
        email: 'test@example.com',
        password: 'password123'
      });

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('should return errors for invalid form', () => {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
      });

      const validator = zodFormValidator(loginSchema);
      const control = new FormControl({
        email: 'invalid',
        password: 'short'
      });

      const result = validator(control);

      expect(result).not.toBeNull();
      expect(result?.['email']).toBeDefined();
      expect(result?.['password']).toBeDefined();
    });

    it('should handle nested validation errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(3),
          email: z.string().email()
        })
      });

      const validator = zodFormValidator(schema);
      const control = new FormControl({
        user: {
          name: 'ab',
          email: 'invalid'
        }
      });

      const result = validator(control);

      expect(result).not.toBeNull();
    });
  });

  describe('getZodErrorMessage', () => {
    it('should return error message from zod error', () => {
      const emailSchema = z.string().email();
      const validator = zodValidator(emailSchema);
      const control = new FormControl('invalid');

      const errors = validator(control);
      control.setErrors(errors);

      const message = getZodErrorMessage(control);

      expect(message).toBeTruthy();
      expect(message).toContain('email');
    });

    it('should return null when no errors', () => {
      const control = new FormControl('valid@example.com');

      const message = getZodErrorMessage(control);

      expect(message).toBeNull();
    });

    it('should return null for null control', () => {
      const message = getZodErrorMessage(null);

      expect(message).toBeNull();
    });

    it('should return null when control has no zod errors', () => {
      const control = new FormControl('value');
      control.setErrors({ required: true });

      const message = getZodErrorMessage(control);

      expect(message).toBeNull();
    });
  });
});

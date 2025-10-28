/**
 * Hook useForm con validación consistente
 * Simplifica el manejo de formularios con validación automática
 */

import { useState, useCallback } from "react";

/**
 * Reglas de validación predefinidas
 */
export const validators = {
  required:
    (message = "Este campo es requerido") =>
    (value) => {
      if (!value || (typeof value === "string" && !value.trim())) {
        return message;
      }
      return null;
    },

  email:
    (message = "Email inválido") =>
    (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return message;
      }
      return null;
    },

  minLength: (min, message) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return message || `Debe tener al menos ${min} caracteres`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return message || `Debe tener máximo ${max} caracteres`;
    }
    return null;
  },

  pattern:
    (regex, message = "Formato inválido") =>
    (value) => {
      if (!value) return null;
      if (!regex.test(value)) {
        return message;
      }
      return null;
    },

  match:
    (otherField, message = "Los campos no coinciden") =>
    (value, allValues) => {
      if (!value) return null;
      if (value !== allValues[otherField]) {
        return message;
      }
      return null;
    },

  min: (minValue, message) => (value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    if (isNaN(num) || num < minValue) {
      return message || `El valor mínimo es ${minValue}`;
    }
    return null;
  },

  max: (maxValue, message) => (value) => {
    if (value === null || value === undefined || value === "") return null;
    const num = Number(value);
    if (isNaN(num) || num > maxValue) {
      return message || `El valor máximo es ${maxValue}`;
    }
    return null;
  },

  url:
    (message = "URL inválida") =>
    (value) => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return message;
      }
    },

  phone:
    (message = "Teléfono inválido") =>
    (value) => {
      if (!value) return null;
      const phoneRegex = /^[\d\s()+-]{8,}$/;
      if (!phoneRegex.test(value)) {
        return message;
      }
      return null;
    },
};

/**
 * Hook principal useForm
 */
export function useForm(options = {}) {
  const {
    initialValues = {},
    validationSchema = {},
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validar un campo específico
  const validateField = useCallback(
    (name, value) => {
      const fieldValidators = validationSchema[name];
      if (!fieldValidators) return null;

      const validatorArray = Array.isArray(fieldValidators)
        ? fieldValidators
        : [fieldValidators];

      for (const validator of validatorArray) {
        const error = validator(value, values);
        if (error) return error;
      }

      return null;
    },
    [validationSchema, values],
  );

  // Validar todos los campos
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationSchema).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationSchema, values, validateField]);

  // Manejar cambio de valor
  const handleChange = useCallback(
    (name) => (event) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      setValues((prev) => ({ ...prev, [name]: value }));

      if (validateOnChange) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      } else if (isSubmitted) {
        // Si ya se intentó enviar, validar en tiempo real
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [validateOnChange, validateField, isSubmitted],
  );

  // Manejar blur
  const handleBlur = useCallback(
    (name) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validateOnBlur) {
        const error = validateField(name, values[name]);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [validateOnBlur, validateField, values],
  );

  // Establecer valor de campo
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Establecer error de campo
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  // Establecer touched de campo
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsSubmitted(false);
  }, [initialValues]);

  // Manejar submit
  const handleSubmit = useCallback(
    (event) => {
      if (event) {
        event.preventDefault();
      }

      setIsSubmitted(true);
      const isValid = validateForm();

      if (isValid && onSubmit) {
        setIsSubmitting(true);

        Promise.resolve(onSubmit(values))
          .then(() => {
            setIsSubmitting(false);
          })
          .catch((error) => {
            console.error("Error en submit:", error);
            setIsSubmitting(false);
          });
      }
    },
    [validateForm, onSubmit, values],
  );

  // Helper para obtener props de input
  const getFieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] ?? "",
      onChange: handleChange(name),
      onBlur: handleBlur(name),
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
    }),
    [values, errors, handleChange, handleBlur],
  );

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validateForm,
    getFieldProps,
  };
}

export default useForm;

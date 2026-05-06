/**
 * Utility to extract field-level errors from API error responses.
 * Expected API structure (based on screenshots):
 * {
 *   "details": {
 *     "fieldErrors": { "fieldName": ["error message"] },
 *     "errors": [ { "field": "fieldName", "message": "error message" } ]
 *   }
 * }
 */
export const getFieldErrors = (error: any): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  
  if (!error || !error.data || !error.data.details) {
    return fieldErrors;
  }

  const { details } = error.data;

  // 1. Check for details.fieldErrors (object with arrays)
  if (details.fieldErrors) {
    Object.entries(details.fieldErrors).forEach(([field, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[field] = messages[0];
      } else if (typeof messages === 'string') {
        fieldErrors[field] = messages;
      }
    });
  }

  // 2. Check for details.errors (array of objects)
  // This takes precedence if both exist, as it's often more specific
  if (Array.isArray(details.errors)) {
    details.errors.forEach((err: any) => {
      const field = err.field || (Array.isArray(err.path) ? err.path[0] : err.path);
      if (field && err.message) {
        fieldErrors[field] = err.message;
      }
    });
  }

  return fieldErrors;
};

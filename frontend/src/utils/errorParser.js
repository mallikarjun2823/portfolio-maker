export function parseFieldErrors(error) {
  const result = { fieldErrors: {}, nonField: null };
  const data = error?.response?.data;
  if (!data) {
    result.nonField = error?.message || String(error) || null;
    return result;
  }

  // If API returned a string
  if (typeof data === 'string') {
    result.nonField = data;
    return result;
  }

  // If DRF style error object
  try {
    Object.keys(data).forEach((key) => {
      const val = data[key];
      if (key === 'detail' || key === 'non_field_errors') {
        if (Array.isArray(val)) result.nonField = val.join(' ');
        else result.nonField = String(val);
        return;
      }

      // field errors: array or string
      if (Array.isArray(val)) {
        result.fieldErrors[key] = val.join(' ');
      } else if (typeof val === 'object') {
        // nested object - stringify
        result.fieldErrors[key] = JSON.stringify(val);
      } else {
        result.fieldErrors[key] = String(val);
      }
    });
  } catch (e) {
    result.nonField = JSON.stringify(data);
  }

  return result;
}

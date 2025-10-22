export const cleanInput = (text) => {
  let cleaned = text;

  // Email addresses
  cleaned = cleaned.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, "[email removed]");

  // Phone numbers
  cleaned = cleaned.replace(/(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g, "[phone removed]");

  // URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, "[url removed]");

  // SSNs
  cleaned = cleaned.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn removed]");

  return cleaned;
};

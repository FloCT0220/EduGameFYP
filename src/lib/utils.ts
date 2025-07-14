/**
 * Utility function to safely parse JSON fields from database
 * Handles both JSON strings and comma-separated strings
 */
export function parseJsonField(field: string | null | undefined, defaultValue: unknown = null): unknown {
  if (!field) return defaultValue;
  
  // If it's already an array/object, return it
  if (Array.isArray(field) || typeof field === 'object') {
    return field;
  }
  
  // If it's a string, try to parse it
  if (typeof field === 'string') {
    const trimmed = field.trim();
    
    // If it starts with [ or {, try to parse as JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        console.warn('Failed to parse JSON field:', field, error);
        return defaultValue;
      }
    }
    
    // If it contains commas, split it
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(item => item.trim());
    }
    
    // If it's a single value, return as array
    return [trimmed];
  }
  
  return defaultValue;
}

/**
 * Utility function to parse multiple JSON fields from a database row
 */
export function parseJsonFields<T extends Record<string, unknown>>(
  row: T,
  jsonFields: (keyof T)[],
  defaultValues: Partial<Record<keyof T, unknown>> = {}
): T {
  const parsed = { ...row };
  
  for (const field of jsonFields) {
    const defaultValue = defaultValues[field] || (field.toString().includes('languages') ? [] : 
                                                field.toString().includes('signature') ? {} : 
                                                field.toString().includes('examples') ? [] : 
                                                field.toString().includes('tags') ? [] : null);
    
    parsed[field] = parseJsonField(row[field] as string, defaultValue) as T[keyof T];
  }
  
  return parsed;
}

/**
 * Specific parser for coding challenge fields
 */
export function parseCodingChallengeFields(challenge: Record<string, unknown>): Record<string, unknown> {
  return parseJsonFields(challenge, [
    'supported_languages',
    'function_signature', 
    'examples',
    'tags'
  ], {
    supported_languages: [],
    function_signature: {},
    examples: [],
    tags: []
  });
}

/**
 * Specific parser for quiz question fields
 */
export function parseQuizQuestionFields(question: Record<string, unknown>): Record<string, unknown> {
  return parseJsonFields(question, [
    'answers'
  ], {
    answers: []
  });
}

/**
 * Specific parser for coding challenge list fields
 */
export function parseCodingChallengeListFields(challenge: Record<string, unknown>): Record<string, unknown> {
  return parseJsonFields(challenge, [
    'supported_languages',
    'tags',
    'code_snippets',
    'correct_answer'
  ], {
    supported_languages: [],
    tags: [],
    code_snippets: [],
    correct_answer: []
  });
} 
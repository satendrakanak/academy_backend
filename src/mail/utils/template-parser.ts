export const parseTemplate = (
  template: string,
  variables: Record<string, string>,
): string => {
  let parsed = template;

  for (const key in variables) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    parsed = parsed.replace(regex, variables[key]);
  }

  return parsed;
};

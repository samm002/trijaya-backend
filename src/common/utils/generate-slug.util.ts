export function generateSlug(input: string): string {
  return input
    .toLowerCase() // Convert to lowercase
    .replace(/_/g, '-') // Replace underscores with hyphens
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim() // Trim whitespace from both ends
    .replace(/\s+/g, '-') // Replace spaces with hyphens ('-')
    .replace(/-+$/g, ''); // Remove trailing hyphens
}

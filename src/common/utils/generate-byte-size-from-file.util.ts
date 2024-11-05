export function convertSizeToBytes(size: string): number {
  const trimmedSize = size.trim();
  let value = parseFloat(trimmedSize);

  if (trimmedSize.endsWith('GB')) {
    value *= 1073741824; // Convert GB to bytes
  } else if (trimmedSize.endsWith('MB')) {
    value *= 1048576; // Convert MB to bytes
  } else if (trimmedSize.endsWith('KB')) {
    value *= 1024; // Convert KB to bytes
  }

  return value == 0 || isNaN(value) ? 0 : value; // Return 0 if conversion fails
}

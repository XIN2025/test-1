export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const cleanName = name.includes('@') ? name.split('@')[0] : name;

  const words = cleanName.split(/[\s\-_\.]+/).filter((word) => word.length > 0);

  if (words.length === 0) {
    return '';
  }

  if (words.length === 1) {
    const word = words[0];
    return word.length >= 2 ? word.substring(0, 2).toUpperCase() : word.charAt(0).toUpperCase();
  }

  return words
    .slice(0, maxInitials)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function generateColorFromString(text: string): string {
  if (!text || typeof text !== 'string') {
    return '#6B7280';
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  hash = Math.abs(hash);

  const hue = hash % 360;
  const saturation = 65;
  const lightness = 55;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

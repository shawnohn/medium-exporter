import type { ArticleMetadata } from './types';

export function buildFrontmatter(metadata: ArticleMetadata): string {
  const lines: string[] = ['---'];

  if (metadata.title) {
    lines.push(`title: "${escapeYaml(metadata.title)}"`);
  }
  if (metadata.author) {
    lines.push(`author: "${escapeYaml(metadata.author)}"`);
  }
  if (metadata.canonicalUrl) {
    lines.push(`source: "${metadata.canonicalUrl}"`);
  }
  if (metadata.publishedDate) {
    lines.push(`published: "${metadata.publishedDate}"`);
  }
  if (metadata.retrievedDate) {
    lines.push(`retrieved: "${metadata.retrievedDate}"`);
  }

  lines.push('---');
  return lines.join('\n');
}

function escapeYaml(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

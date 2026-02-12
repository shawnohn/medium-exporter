export interface ArticleMetadata {
  title: string;
  author: string;
  canonicalUrl: string;
  publishedDate: string;
  retrievedDate: string;
}

export interface ExtractionResult {
  success: true;
  metadata: ArticleMetadata;
  articleHtml: string;
}

export interface ExtractionError {
  success: false;
  error: string;
}

export type ExtractResult = ExtractionResult | ExtractionError;

export interface ExportOptions {
  includeFrontmatter: boolean;
  includeImages: boolean;
}

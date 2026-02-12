import type { ArticleMetadata } from './types';

// Popup -> Background

export interface ExtractMessage {
  type: 'EXTRACT';
}

export interface DownloadFileMessage {
  type: 'DOWNLOAD_FILE';
  markdown: string;
  filename: string;
}

export type PopupMessage = ExtractMessage | DownloadFileMessage;

// Background -> Popup

export interface ExtractSuccessResponse {
  type: 'EXTRACT_SUCCESS';
  metadata: ArticleMetadata;
  articleHtml: string;
}

export interface DownloadSuccessResponse {
  type: 'DOWNLOAD_SUCCESS';
}

export interface ErrorResponse {
  type: 'ERROR';
  error: string;
}

export type BackgroundResponse =
  | ExtractSuccessResponse
  | DownloadSuccessResponse
  | ErrorResponse;

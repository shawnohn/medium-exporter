import type { ArticleMetadata, ObsidianSettings } from './types';

// Popup -> Background

export interface ExtractMessage {
  type: 'EXTRACT';
}

export interface DownloadFileMessage {
  type: 'DOWNLOAD_FILE';
  markdown: string;
  filename: string;
}

export interface SendToObsidianMessage {
  type: 'SEND_TO_OBSIDIAN';
  markdown: string;
  filename: string;
  settings: ObsidianSettings;
}

export type PopupMessage =
  | ExtractMessage
  | DownloadFileMessage
  | SendToObsidianMessage;

// Background -> Popup

export interface ExtractSuccessResponse {
  type: 'EXTRACT_SUCCESS';
  metadata: ArticleMetadata;
  articleHtml: string;
}

export interface DownloadSuccessResponse {
  type: 'DOWNLOAD_SUCCESS';
}

export interface ObsidianSuccessResponse {
  type: 'OBSIDIAN_SUCCESS';
}

export interface ErrorResponse {
  type: 'ERROR';
  error: string;
}

export type BackgroundResponse =
  | ExtractSuccessResponse
  | DownloadSuccessResponse
  | ObsidianSuccessResponse
  | ErrorResponse;

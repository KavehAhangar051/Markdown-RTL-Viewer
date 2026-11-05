/**
 * @file types/tiny.ts
 * @description Type-safe definitions for the TinyJS (tinyjs.app) native desktop bridge (`window.tiny`).
 */

export type TinyStudioMenuCommandId =
  | 'file-open'
  | 'file-save'
  | 'file-sample'
  | 'file-clear'
  | 'view-split'
  | 'view-editor'
  | 'view-preview'
  | 'view-focus'
  | 'view-theme'
  | 'view-lang'
  | 'help-showcase';

export type TinyReadFileResponse =
  | {
      readonly ok: true;
      readonly content: string;
      readonly fileName: string;
      readonly path: string;
    }
  | {
      readonly ok: false;
      readonly error: 'invalid_type' | 'file_too_large' | 'read_error';
    };

export type TinySaveFileResponse =
  | {
      readonly ok: true;
      readonly path: string;
      readonly fileName: string;
    }
  | {
      readonly ok: false;
      readonly error: 'write_error';
    };

export interface TinyOpenedFileEntry {
  readonly content: string;
  readonly fileName: string;
  readonly path: string;
}

export interface TinyDesktopInfo {
  readonly os: 'windows' | 'macos' | 'linux';
  readonly arch: 'x86_64' | 'arm64';
  readonly version: string;
  readonly tinyjs: string;
  readonly runtime: string;
}

export interface TinyMenuCommandPayload {
  readonly id: TinyStudioMenuCommandId;
}

export interface TinyFilesOpenedPayload {
  readonly count: number;
}

export interface TinyDeepLinkPayload {
  readonly action: string;
  readonly mode: string | null;
  readonly lang: string | null;
}

export interface TinyFileFilterOptions {
  readonly types?: readonly string[];
  readonly name?: string;
}

export interface TinyClipboardReadPayload {
  readonly kind: 'files' | 'image' | 'color' | 'text' | 'empty';
  readonly text: string | null;
  readonly html: string | null;
}

export interface TinyClipboardWritePayload {
  readonly text?: string;
  readonly html?: string;
}

export interface TinyDialogBridge {
  openFile(options?: TinyFileFilterOptions): Promise<string | null>;
  saveFile(options?: TinyFileFilterOptions): Promise<string | null>;
}

export interface TinyWindowBridge {
  setTitle(title: string): Promise<void>;
  minimize(): Promise<void>;
  zoom(): Promise<void>;
  close(): Promise<void>;
  onDrop(handler: (paths: readonly string[]) => void): () => void;
}

export interface TinyClipboardBridge {
  read(): Promise<TinyClipboardReadPayload>;
  write(data: TinyClipboardWritePayload): Promise<void>;
}

export interface TinySystemBridge {
  os(): 'windows' | 'macos' | 'linux';
  isWindows(): boolean;
  isMacOS(): boolean;
  isLinux(): boolean;
}

export interface TinyApiBridge {
  call(method: 'readMarkdownFile', params: { readonly path: string }): Promise<TinyReadFileResponse>;
  call(
    method: 'saveMarkdownFile',
    params: { readonly path: string; readonly content: string }
  ): Promise<TinySaveFileResponse>;
  call(method: 'takeOpenedFiles'): Promise<readonly TinyOpenedFileEntry[]>;
  call(method: 'getDesktopInfo'): Promise<TinyDesktopInfo>;
  on(event: 'studio-menu-command', handler: (payload: TinyMenuCommandPayload) => void): () => void;
  on(event: 'files-opened', handler: (payload: TinyFilesOpenedPayload) => void): () => void;
  on(event: 'deep-link-opened', handler: (payload: TinyDeepLinkPayload) => void): () => void;
}

export interface TinyBridge {
  readonly api: TinyApiBridge;
  readonly dialog: TinyDialogBridge;
  readonly win: TinyWindowBridge;
  readonly clipboard: TinyClipboardBridge;
  readonly system: TinySystemBridge;
}

declare global {
  interface Window {
    tiny?: TinyBridge;
  }
}

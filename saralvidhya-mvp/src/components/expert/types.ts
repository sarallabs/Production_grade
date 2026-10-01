export type FileNode = {
  type: 'file' | 'directory';
  name: string;
  path: string;
  children?: FileNode[];
};

export type SaveStatus = {
  type: 'idle' | 'saving' | 'commit_success' | 'pr_created' | 'deploy_triggered' | 'error';
  message?: string;
  prUrl?: string;
  prNumber?: number;
};

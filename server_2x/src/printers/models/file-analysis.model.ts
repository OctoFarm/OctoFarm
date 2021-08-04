import { FileModel } from "./file.model";

export interface FileAnalysisModel {
  fileList: FileModel[];
  fileCount: number;
  folderList: string[];
  folderCount: number;
}

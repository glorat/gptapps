export interface DocumentInfo {
  fileName: string
  fileSize: number
  fileLastModified: number
  fileType?: string
  fileWorkspace?: string
  file?: File
  buffer?: Buffer
  fileStatus: 'uploading' | 'uploaded' | 'pending' | 'parsing' | 'processing' | 'ready' | 'error' | string
  progress?: number,
  text?: string
  // vectors?: MemoryVectorStore
}

export const useMultiFileStoreAsync = async () => {

  const p = await import('./multiFileLocalStore')
  return p.useMultiFileLocalStore()

}
//
// export const useMultiFileStore = () => {
//   if (fbHasUser()) {
//     return useMultiFileRemoteStore()
//   } else {
//     return useMultiFileLocalStore()
//   }
// }
//

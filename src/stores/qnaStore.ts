export const useQnaStoreAsync = async() => {

  const p = await import('./qnaStoreLocal')
  return p.useQnaStoreBrowser()

}

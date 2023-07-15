import {useQnaStore} from '../../stores/qnaStore'


export const performVectorStoreQnaDirect = async (args: {question:string}) => {
  return useQnaStore().performVectorStoreQnaDirect(args)
}

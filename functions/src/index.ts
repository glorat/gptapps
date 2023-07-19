import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {anyBufferToText, fileToText} from '../../src/lib/ai/unstructured'
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'
import {MemoryVectorStore} from 'langchain/dist/vectorstores/memory'
import {OpenAIEmbeddings} from 'langchain/embeddings'
import {getLangchainConfig} from '../../src/lib/ai/config'
import {defineSecret} from 'firebase-functions/lib/params'
import {storage} from 'firebase-admin'

admin.initializeApp();

export const processUploadedFile = functions.storage.object().onFinalize(async (object) => {
  // Check if the file is uploaded to the specified pattern of location
  const filePath = object.name; // Full path of the uploaded file

  if (!filePath) {
    console.log('File path is undefined. Skipping processing.');
    return null;
  }

  const locationPattern = /^user\/([^/]+)\/([^/]+)\/([^/]+)$/; // Regular expression pattern
  const match = locationPattern.exec(filePath);

  if (!match) {
    console.log('File uploaded to a different location. Skipping processing.');
    return null;
  }

  const uid = match[1];
  const fileWorkspace = match[2];
  const filename = match[3];

  // Perform your desired processing on the uploaded file
  console.log('File uploaded to the desired location. Initiating processing...');
  console.log('UID:', uid);
  console.log('File Workspace:', fileWorkspace);
  console.log('File Path:', filePath);
  console.log('Filename:', filename);

  try {
    // Update the subcollection of the 'user' collection with the uploaded file information
    const userDocRef = admin.firestore().collection('user').doc(uid);
    const filesSubcollectionRef = userDocRef.collection('files');

    const fileDocRef = filesSubcollectionRef.doc(filename);
    await fileDocRef.set({
      filePath,
      fileName: filename,
      fileSize: object.size,
      fileLastModified: object.updated,
      fileType: object.contentType,
      fileStatus: 'pending',
      fileWorkspace
      // Add more fields as needed
    });

    console.log('Processing completed.');
  } catch (error) {
    console.error('Error occurred during processing:', error);
  }

  return null;
});

export const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
export const processPendingFiles = functions.firestore
  .document('user/{userId}/files/{fileId}')
  .onWrite(async (change, context) => {
    const fileData = change.after.data();

    // Check if the file status is 'pending'
    if (fileData && fileData.fileStatus === 'pending') {
      // Update the file status to 'ready'
      const fileDocRef = change.after.ref;
      try {
        // Perform your desired processing on the file record
        console.log('Processing file:', context.params.fileId);

        // Example processing logic: Print the file contents
        const filePath = fileData.filePath;
        const bucket = storage().bucket()
        const file = bucket.file(filePath);
        const [fileContents] = await file.download();

        await fileDocRef.update({ fileStatus: 'parsing' });
        const text = await anyBufferToText(fileContents, file.name);
        console.log('File contents:', text);
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });

        await fileDocRef.update({ fileStatus: 'processing' });
        const docs = await textSplitter.createDocuments([text], [{ name: file.name }]);

        await fileDocRef.update({ fileStatus: 'finalising' });

        // Load memoryVectors from the storage
        const userId = context.params.userId;
        const workspace = fileData.workspace;
        const memoryVectorsPath = `user/${userId}/${workspace}.embed.json`;
        const memoryVectorsFile = bucket.file(memoryVectorsPath);
        const [memoryVectorsContent] = await memoryVectorsFile.download();
        const memoryVectors = JSON.parse(memoryVectorsContent.toString());

        const vectorStore = new MemoryVectorStore(new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY.value() }));
        vectorStore.

        vectorStore.memoryVectors = memoryVectors;

        await vectorStore.addDocuments(docs);

        await fileDocRef.update({ fileStatus: 'ready' });

        console.log('File processed:', context.params.fileId);
      } catch (error) {
        await fileDocRef.update({ fileStatus: 'error' });
        console.error('Error occurred during file processing:', error);
      }
    }
  });

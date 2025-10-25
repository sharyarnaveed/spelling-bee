import { Client, Databases, Query } from 'appwrite';
import dotenv from 'dotenv';

dotenv.config();

let client;
let databases;

export function initializeAppwrite() {
  if (!client) {
    client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID)
    
    databases = new Databases(client);
  }
  
  return { client, databases };
}

export async function saveUserScore(userId, score) {
  try {
    const { databases } = initializeAppwrite();
    
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = 'userscores'; // Collection name as requested
    
    // Validate required environment variables
    if (!databaseId) {
      throw new Error('APPWRITE_DATABASE_ID environment variable is not set');
    }
    
    // Ensure score stored as string to match collection schema
    const scoreData = {
      userid: userId,
      score: String(score),
    };
    
    const result = await databases.createDocument(
      databaseId,
      collectionId,
      'unique()', // Auto-generate document ID
      scoreData
    );
    
    console.log(`✅ Score saved for user ${userId}: ${score} points`);
    return result;
  } catch (error) {
    console.error('❌ Error saving user score:', error);
    
    // If collection doesn't exist, try to create it
    if (error.code === 404) {
      console.log('Collection not found, you may need to create it manually in Appwrite console');
    }
    
    throw error;
  }
}

export async function getUserHighScore(userId) {
  try {
    const { databases } = initializeAppwrite();
    
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = 'userscores';
    
    // Validate required environment variables
    if (!databaseId) {
      throw new Error('APPWRITE_DATABASE_ID environment variable is not set');
    }
    
    // Fetch user's documents (increase limit to cover more entries)
    const result = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal('userid', userId),
        Query.limit(1000)
      ]
    );
    
    // Compute numeric max even if 'score' is stored as string
    let max = 0;
    for (const doc of result.documents) {
      const raw = doc.score;
      const val = typeof raw === 'number' ? raw : parseFloat(raw);
      if (!Number.isNaN(val) && val > max) max = val;
    }
    
    return max;
  } catch (error) {
    console.error('❌ Error getting user high score:', error);
    return 0;
  }
}
import { Client, Databases, Account } from "appwrite"

let client: Client;
let account: Account;
let databases: Databases;

export function initializeAppwrite() {
  if (!client) {
    const config = useRuntimeConfig();
    
    client = new Client()
      .setEndpoint(config.public.appwriteEndpoint)
      .setProject(config.public.appwriteProjectId)
    
    account = new Account(client)
    databases = new Databases(client)
  }
  
  return { client, account, databases }
}

export function useAppwrite() {
  return initializeAppwrite()
}

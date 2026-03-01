
'use client';

// Estas chaves devem ser configuradas no seu painel de hospedagem ou arquivo .env
// No Firebase Console, você encontra esses valores em "Configurações do Projeto"
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForTestingPurposesOnly", 
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "leobet-pro.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "leobet-pro",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "leobet-pro.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

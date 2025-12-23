// Type definitions for environment variables
declare namespace NodeJS {
    interface ProcessEnv {
        // Firebase Configuration
        NEXT_PUBLIC_FIREBASE_API_KEY: string;
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
        NEXT_PUBLIC_FIREBASE_APP_ID: string;

        // Node Environment
        NODE_ENV: 'development' | 'production' | 'test';
    }
}

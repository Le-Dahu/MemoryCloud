import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  apiUrl: process.env.MEMORYCLOUD_API_URL || 'http://localhost:3000',
  apiKey: process.env.MEMORYCLOUD_API_KEY || '',
};

export default config;

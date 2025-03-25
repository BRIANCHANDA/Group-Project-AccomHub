import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
// src/index.ts or main app file
import 'dotenv/config'; 

// for query purposes
const queryClient = postgres(process.env.DATABASE_URL!);
export const db = drizzle(queryClient);
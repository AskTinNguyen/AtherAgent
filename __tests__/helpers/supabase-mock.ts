import { Database } from '@/lib/types/database';
import { createClient, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
    })),
  })),
}));

export const getMockedSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

type MockSupabaseResponseOverloads = {
  <T>(data: T[] | null, error?: any): PostgrestResponse<T>;
  <T>(data: T | null, error?: any): PostgrestSingleResponse<T>;
};

export const mockSupabaseResponse: MockSupabaseResponseOverloads = (data: any, error: any = null) => {
  const response = {
    data,
    error,
    count: data ? (Array.isArray(data) ? data.length : 1) : 0,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  };

  return response as any;
}; 
import { supabase } from './client';

export async function createUserProfile(userId: string, userData: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, ...userData }]);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Create user profile error:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
}

export async function listRecords(table: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`List ${table} error:`, error);
    return [];
  }
}

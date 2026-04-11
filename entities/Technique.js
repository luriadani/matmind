// Technique entity — backed by Supabase
import { supabase } from '../lib/supabase';

class Technique {
  async create(data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: result, error } = await supabase
      .from('techniques')
      .insert({
        title: data.title,
        video_url: data.video_url || null,
        thumbnail_url: data.thumbnail_url || null,
        source_platform: data.source_platform || null,
        category: data.category || null,
        notes: data.notes || null,
        tags: data.tags || null,
        training_id: data.training_id || null,
        shared_by_gym_id: data.shared_by_gym_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async get(id) {
    const { data, error } = await supabase
      .from('techniques')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async filter(criteria = {}) {
    let query = supabase.from('techniques').select('*');

    if (criteria.created_by) {
      query = query.eq('created_by', criteria.created_by);
    }
    if (criteria.shared_by_gym_id) {
      query = query.eq('shared_by_gym_id', criteria.shared_by_gym_id);
    }
    if (criteria.category) {
      query = query.eq('category', criteria.category);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) { console.error('Technique.filter error:', error); return []; }
    return data || [];
  }

  async update(id, data) {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Only include defined fields
    const fields = ['title', 'video_url', 'thumbnail_url', 'source_platform',
      'category', 'notes', 'tags', 'training_id', 'shared_by_gym_id'];
    fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

    const { data: result, error } = await supabase
      .from('techniques')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id) {
    const { error } = await supabase
      .from('techniques')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  // Legacy compat
  async ensureInitialized() {}
  async loadFromStorage() {}
  async saveToStorage() {}
}

export default new Technique();

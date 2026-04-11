// Training entity — backed by Supabase
// DB uses snake_case (day_of_week); app uses camelCase (dayOfWeek).
import { supabase } from '../lib/supabase';

// Map DB row → app object
const toApp = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    time: row.time,
    instructor: row.instructor,
    category: row.category,
    notes: row.notes,
    created_by: row.created_by,
    created_date: row.created_at,
    updated_date: row.updated_at,
  };
};

// Map app object → DB row
const toDB = (data) => ({
  day_of_week: data.dayOfWeek,
  time: data.time,
  instructor: data.instructor || null,
  category: data.category || null,
  notes: data.notes || null,
});

class Training {
  async create(data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: result, error } = await supabase
      .from('trainings')
      .insert({ ...toDB(data), created_by: user.id })
      .select()
      .single();

    if (error) throw error;
    return toApp(result);
  }

  async get(id) {
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return toApp(data);
  }

  async filter(criteria = {}) {
    let query = supabase.from('trainings').select('*');

    if (criteria.created_by) {
      query = query.eq('created_by', criteria.created_by);
    }

    query = query.order('created_at', { ascending: true });

    const { data, error } = await query;
    if (error) { console.error('Training.filter error:', error); return []; }
    return (data || []).map(toApp);
  }

  async update(id, data) {
    const updateData = { ...toDB(data), updated_at: new Date().toISOString() };
    // Remove undefined
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    const { data: result, error } = await supabase
      .from('trainings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toApp(result);
  }

  async delete(id) {
    const { error } = await supabase
      .from('trainings')
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

export default new Training();

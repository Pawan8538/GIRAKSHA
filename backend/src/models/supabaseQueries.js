const supabase = require('../config/supabase');

// Initialize users table
async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
    const { data, error } = await supabase.rpc('create_users_table');
    if (error && !error.message.includes('already exists')) {
      console.warn('Warning creating users table:', error.message);
    }
  } catch (err) {
    console.warn('Database initialization note:', err.message);
  }
}

// User queries
const queries = {
  async getUserByPhone(phone) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createUser(name, phone, email, password_hash, role) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          phone,
          email,
          password_hash,
          role,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateUserProfile(userId, name, phone) {
    const { data, error } = await supabase
      .from('users')
      .update({ name, phone })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateUserPassword(userId, password_hash) {
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async listUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
};

module.exports = {
  initializeDatabase,
  ...queries
};

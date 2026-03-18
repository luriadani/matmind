/**
 * Common formatting utilities to avoid code duplication
 */

/**
 * Format time string based on user's time format preference
 * @param {string} timeString - Time in HH:MM format
 * @param {string} timeFormat - '12h' or '24h'
 * @returns {string} Formatted time string
 */
export const formatTime = (timeString, timeFormat = '24h') => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  
  if (timeFormat === '12h') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Get color scheme for training categories (gi, no_gi, etc.)
 * @param {string} category - Training category
 * @returns {object} Color object with backgroundColor, color, and borderColor
 */
export const getTrainingCategoryColor = (category) => {
  const colors = {
    gi: { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', borderColor: '#60A5FA' },
    no_gi: { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#C4B5FD', borderColor: '#A78BFA' },
    competition: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', borderColor: '#F87171' },
    beginner: { backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#86EFAC', borderColor: '#4ADE80' },
    advanced: { backgroundColor: 'rgba(249, 115, 22, 0.2)', color: '#FED7AA', borderColor: '#FB923C' },
    open_mat: { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#D1D5DB', borderColor: '#9CA3AF' },
  };
  return colors[category] || colors.open_mat;
};

/**
 * Get color scheme for technique categories (Try Next Class, Show Coach, etc.)
 * @param {string} category - Technique category
 * @returns {object} Color object with backgroundColor, color, and borderColor
 */
export const getTechniqueCategoryColor = (category) => {
  const colors = {
    'Try Next Class': { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', borderColor: '#60A5FA' },
    'Show Coach': { backgroundColor: 'rgba(147, 51, 234, 0.2)', color: '#C4B5FD', borderColor: '#A78BFA' },
    'Favorite': { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', borderColor: '#F87171' },
  };
  return colors[category] || { backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#D1D5DB', borderColor: '#9CA3AF' };
};

/**
 * Parse array from various formats (string, array, null)
 * @param {any} val - Value to parse
 * @returns {array} Array of values
 */
export const parseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') return val.split(',').map(item => item.trim()).filter(Boolean);
  return [];
}; 
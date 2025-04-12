/**
 * Định dạng ngày tháng
 * @param {string} dateString - Chuỗi ngày tháng
 * @returns {string} - Ngày tháng đã định dạng
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date)) return 'N/A';
  
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Rút ngắn text dài
 * @param {string} text - Văn bản cần rút ngắn
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} - Văn bản đã được rút ngắn
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}; 
// Utility function to format large numbers with K for thousands and M for millions
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  const number = parseInt(num);
  
  if (isNaN(number)) return '0';
  
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  
  return number.toString();
};

// Export as default as well for convenience
export default formatNumber; 
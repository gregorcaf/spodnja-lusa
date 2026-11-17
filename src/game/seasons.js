// Seasons: derived from the month. Winter covers the land in snow, autumn colours the trees,
// and some dilemma cards and wishes only appear in their season.

export const SEASONS = {
  winter: { name: 'zima', icon: '❄️' },
  spring: { name: 'pomlad', icon: '🌸' },
  summer: { name: 'poletje', icon: '☀️' },
  autumn: { name: 'jesen', icon: '🍂' },
};

/** month: 0 = January … 11 = December */
export function seasonOf(month) {
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

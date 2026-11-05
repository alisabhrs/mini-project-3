// Shared across Fresh'd pages. Include this script before each page's own JS.
window.FreshdInventory = {
  key: 'freshd-inventory-v1',
  get() {
    try { const data = JSON.parse(localStorage.getItem(this.key)); return Array.isArray(data) ? data : []; }
    catch { return []; }
  },
  save(items) { localStorage.setItem(this.key, JSON.stringify(items)); },
  add(item) { const items = this.get(); items.push(item); this.save(items); },
  update(id, patch) { this.save(this.get().map(item => item.id === id ? {...item, ...patch} : item)); },
  remove(id) { this.save(this.get().filter(item => item.id !== id)); },

  // How many whole days until this item expires.
  // Negative = already expired, 0 = expires today.
  // null = no expiration date (purchase date, production date, or no date).
  daysUntilExpiry(item) {
    const type = item.dateType || 'expiration';
    if (type !== 'expiration' || !item.date) return null;

    const [year, month, day] = String(item.date).split('-').map(Number);
    if (!year || !month || !day) return null;

    const expiry = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round((expiry - today) / 86400000);
  },

  // Same rule as the Use By page: 0 to 3 days left = "use soon".
  isUseSoon(item) {
    const days = this.daysUntilExpiry(item);
    return days !== null && days >= 0 && days <= 3;
  }
};

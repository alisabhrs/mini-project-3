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
  remove(id) { this.save(this.get().filter(item => item.id !== id)); }
};

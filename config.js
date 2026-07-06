const API_URL = 'https://script.google.com/macros/s/AKfycbyOjmrxJ3KRW7E9WM9j7dW9cKJbb_lXMQNFNq2GXtW67dWwBFnFCmpv3imaBNlzwkAFpg/exec';

const AUTH = {
  getToken() { return localStorage.getItem('ps_token'); },
  getRole() { return localStorage.getItem('ps_role'); },
  getName() { return localStorage.getItem('ps_name'); },
  setSession(token, role, name) {
    localStorage.setItem('ps_token', token);
    localStorage.setItem('ps_role', role);
    localStorage.setItem('ps_name', name);
  },
  clear() {
    localStorage.removeItem('ps_token');
    localStorage.removeItem('ps_role');
    localStorage.removeItem('ps_name');
  },
  guard() {
    if (!this.getToken()) {
      location.href = 'login.html';
      return false;
    }
    return true;
  },
  async logout() {
    await api('logout', {});
    this.clear();
    location.href = 'login.html';
  }
};

async function api(action, payload) {
  const body = new URLSearchParams();
  body.set('action', action);
  body.set('token', AUTH.getToken() || '');
  if (payload !== undefined) body.set('payload', JSON.stringify(payload));
  const res = await fetch(API_URL, { method: 'POST', body });
  const data = await res.json();
  if (data.needLogin) {
    AUTH.clear();
    location.href = 'login.html';
    throw new Error('session expired');
  }
  if (!data.ok) throw new Error(data.error || 'request failed');
  return data;
}

async function apiGet(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('token', AUTH.getToken() || '');
  const res = await fetch(url);
  const data = await res.json();
  if (data.needLogin) {
    AUTH.clear();
    location.href = 'login.html';
    throw new Error('session expired');
  }
  if (!data.ok) throw new Error(data.error || 'request failed');
  return data;
}

const MONTH_NAMES = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function exportXLSX(filename, tableEl) {
  const wb = XLSX.utils.table_to_book(tableEl, { sheet: 'Report' });
  XLSX.writeFile(wb, filename);
}

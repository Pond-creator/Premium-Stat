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

// Google Apps Script's /exec endpoint occasionally returns an HTML error page
// instead of JSON (transient Google-side redirect flakiness). Retry a few
// times with backoff before giving up, so users don't see a raw parse error.
async function fetchJsonWithRetry(url, options, retries = 3, delayMs = 700) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        throw new Error('เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (Google หน่วงชั่วคราว)');
      }
    } catch (ex) {
      lastErr = ex;
      if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

async function api(action, payload) {
  const body = new URLSearchParams();
  body.set('action', action);
  body.set('token', AUTH.getToken() || '');
  if (payload !== undefined) body.set('payload', JSON.stringify(payload));
  const data = await fetchJsonWithRetry(API_URL, { method: 'POST', body });
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
  const data = await fetchJsonWithRetry(url);
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

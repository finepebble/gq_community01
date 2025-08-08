// Theme & helpers
(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem("aiboard/theme");
  if(saved){ if(saved==="light") root.classList.add("light"); }
  else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches){ root.classList.add("light"); }
  const btnTheme = document.getElementById('btnTheme');
  if(btnTheme){
    btnTheme.addEventListener('click', ()=>{
      root.classList.toggle('light');
      localStorage.setItem("aiboard/theme", root.classList.contains('light')?'light':'dark');
    });
  }
})();

// Crypto helpers
async function sha256Hex(input){
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function uuid(){ return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
  const v = c==='x'? r : (r&0x3)|0x8;
  return v.toString(16);
}); }
function nowISO(){ return new Date().toISOString(); }
function fmtTime(iso){ const d = new Date(iso); return d.toLocaleString(); }
function escapeHtml(s){ return s.replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

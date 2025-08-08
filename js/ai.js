// AI reply adapter
// Mode 1: Local mock (default, works on GitHub Pages)
// Mode 2: Remote endpoint (optional). Set AI_ENDPOINT to your API URL that accepts {text} and returns {reply}.
const AI_ENDPOINT = ""; // e.g., "https://your-api.example.com/ai-reply"

async function aiReply(text){
  if(AI_ENDPOINT){
    try{
      const res = await fetch(AI_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
      if(!res.ok) throw new Error('AI endpoint error');
      const data = await res.json();
      if(typeof data.reply==='string') return data.reply;
    }catch(e){ console.warn(e); }
  }
  // Local mock: short summary + 2 bullets
  const s = text.replace(/\s+/g,' ').trim();
  const short = s.length>160? s.slice(0,160)+"…" : s;
  const keywords = Array.from(new Set((s.toLowerCase().match(/[a-z가-힣0-9]{2,}/g)||[]))).slice(0,5).join(', ');
  return `요약: ${short}\n- 핵심 포인트를 조금 더 명확히 적어보면 좋아요.\n- 관련 키워드: ${keywords}`;
}

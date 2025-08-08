// Index page logic
const tpl = document.getElementById('tplPostCard');
const listEl = document.getElementById('list');
const pagerEl = document.getElementById('pager');
const qEl = document.getElementById('q');
const countEl = document.getElementById('count');

let state = { q:"", page:1, pageSize:10 };

document.getElementById('btnNew').addEventListener('click', ()=> document.getElementById('dlgWrite').showModal());
document.getElementById('btnSearch').addEventListener('click', ()=>{ state.q=qEl.value.trim(); state.page=1; render(); });
document.getElementById('btnReset').addEventListener('click', ()=>{ qEl.value=""; state.q=""; state.page=1; render(); });

document.getElementById('formWrite').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const author = fd.get('author').toString().trim();
  const password = fd.get('password').toString();
  const title = fd.get('title').toString().trim();
  const content = fd.get('content').toString().trim();
  if(!author || !password || !title || !content) return;
  await createPost({author, password, title, content});
  e.target.closest('dialog').close();
  e.target.reset();
  state.page=1; render();
});

function render(){
  const { total, items, page, pages } = listPosts({ q: state.q, page: state.page, pageSize: state.pageSize });
  countEl.textContent = total;
  listEl.innerHTML = "";
  items.forEach(p=>{
    const node = tpl.content.cloneNode(true);
    const a = node.querySelector('.title');
    a.textContent = p.title;
    a.href = `post.html?id=${p.id}`;
    node.querySelector('.preview').textContent = (p.content||"").slice(0,120);
    node.querySelector('.author').textContent = p.author;
    node.querySelector('.time').textContent = fmtTime(p.createdAt);
    node.querySelector('.comments').textContent = `댓글 ${p.commentCount}`;
    // inline edit/delete (password dialogs)
    node.querySelector('.edit').addEventListener('click', ()=> promptEditPost(p.id));
    node.querySelector('.del').addEventListener('click', ()=> promptDeletePost(p.id));
    listEl.appendChild(node);
  });
  // pager
  pagerEl.innerHTML = "";
  function btn(label, pg, active=false, disabled=false){
    const b = document.createElement('button'); b.className='page'+(active?' active':''); b.textContent=label;
    b.disabled = disabled; b.addEventListener('click', ()=>{ state.page=pg; render(); });
    pagerEl.appendChild(b);
  }
  btn('처음', 1, false, page===1);
  btn('이전', Math.max(1,page-1), false, page===1);
  const span = 2;
  const from = Math.max(1, page-span), to = Math.min(pages, page+span);
  for(let i=from;i<=to;i++) btn(String(i), i, i===page);
  btn('다음', Math.min(pages,page+1), false, page===pages);
  btn('끝', pages, false, page===pages);
}

async function promptEditPost(id){
  const pw = prompt("수정 비밀번호를 입력하세요");
  if(!pw) return;
  const ok = await verifyPostPassword(id, pw);
  if(!ok){ alert("비밀번호가 일치하지 않습니다."); return; }
  const p = getPost(id);
  const title = prompt("새 제목을 입력하세요", p.title);
  if(title && title.trim()){ await updatePost(id, {title: title.trim()}); render(); }
}
async function promptDeletePost(id){
  const pw = prompt("삭제 비밀번호를 입력하세요");
  if(!pw) return;
  const ok = await verifyPostPassword(id, pw);
  if(!ok){ alert("비밀번호가 일치하지 않습니다."); return; }
  if(confirm("정말 삭제하시겠습니까?")){ deletePost(id); render(); }
}

// initial render
render();

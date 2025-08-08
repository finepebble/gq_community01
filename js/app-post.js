// Post page logic
const url = new URL(location.href);
const postId = url.searchParams.get('id');

const elTitle = document.getElementById('title');
const elAuthor = document.getElementById('author');
const elTime = document.getElementById('time');
const elContent = document.getElementById('content');
const elTree = document.getElementById('tree');

const dlgPw = document.getElementById('dlgPassword');
const dlgEdit = document.getElementById('dlgEdit');
const formEdit = document.getElementById('formEdit');

const post = getPost(postId);
if(!post){ document.querySelector('main').innerHTML = '<p>글을 찾을 수 없습니다.</p>'; throw new Error('Not found'); }

// render post
elTitle.textContent = post.title;
elAuthor.textContent = post.author;
elTime.textContent = fmtTime(post.createdAt) + (post.updatedAt? ` (수정됨 ${fmtTime(post.updatedAt)})`:"");
elContent.textContent = post.content;

document.getElementById('btnEdit').addEventListener('click', ()=> openEditPost());
document.getElementById('btnDelete').addEventListener('click', ()=> deleteThisPost());
document.getElementById('btnAiReplyPost').addEventListener('click', ()=> aiReplyToPost());

async function openEditPost(){
  const pw = await promptPassword();
  if(!pw) return;
  const ok = await verifyPostPassword(post.id, pw);
  if(!ok){ alert("비밀번호가 일치하지 않습니다."); return; }
  formEdit.title.value = post.title;
  formEdit.content.value = post.content;
  dlgEdit.showModal();
  formEdit.onsubmit = async (e)=>{
    e.preventDefault();
    await updatePost(post.id, { title: formEdit.title.value.trim()||post.title, content: formEdit.content.value });
    dlgEdit.close();
    location.reload();
  };
}

async function deleteThisPost(){
  const pw = await promptPassword();
  if(!pw) return;
  const ok = await verifyPostPassword(post.id, pw);
  if(!ok){ alert("비밀번호가 일치하지 않습니다."); return; }
  if(confirm("정말 삭제하시겠습니까?")){ deletePost(post.id); location.href = './index.html'; }
}

function promptPassword(){
  return new Promise(resolve=>{
    dlgPw.showModal();
    dlgPw.addEventListener('close', ()=>{
      if(dlgPw.returnValue==='ok'){
        const val = dlgPw.querySelector('input[name=password]').value;
        dlgPw.querySelector('input[name=password]').value='';
        resolve(val);
      } else resolve(null);
    }, {once:true});
  });
}

// comments
document.getElementById('formComment').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const author = fd.get('author').toString().trim();
  const password = fd.get('password').toString();
  const content = fd.get('content').toString().trim();
  if(!author || !password || !content) return;
  await createComment({ postId: post.id, content, author, password });
  e.target.reset();
  renderTree();
});

document.getElementById('btnAiDraft').addEventListener('click', async ()=>{
  const ta = document.querySelector('#formComment textarea[name=content]');
  const hint = await aiReply(elContent.textContent);
  ta.value = hint;
  ta.focus();
});

async function aiReplyToPost(){
  const reply = await aiReply(elContent.textContent);
  await createComment({ postId: post.id, content: reply, author: 'AI', password: uuid(), isAI:true });
  renderTree();
}

function renderTree(){
  elTree.innerHTML = "";
  const tpl = document.getElementById('tplComment');
  const tree = listComments(post.id);
  function node(c){
    const n = tpl.content.cloneNode(true);
    n.querySelector('.author').textContent = c.author;
    n.querySelector('.time').textContent = fmtTime(c.createdAt) + (c.updatedAt? ` (수정)`:"");
    if(c.isAI) n.querySelector('.badge.ai').hidden = false;
    n.querySelector('.cmt-body').textContent = c.content;
    const childrenEl = n.querySelector('.cmt-children');
    // actions
    n.querySelector('.reply').addEventListener('click', async ()=>{
      const author = prompt("작성자명?"); if(!author) return;
      const password = prompt("수정용 비밀번호? (4자 이상)"); if(!password || password.length<4) return;
      const content = prompt("답글 내용?"); if(!content) return;
      await createComment({ postId: post.id, parentId: c.id, content, author, password });
      renderTree();
    });
    n.querySelector('.edit').addEventListener('click', async ()=>{
      const pw = prompt("수정 비밀번호 입력");
      if(!pw) return;
      const ok = await verifyCommentPassword(c.id, pw);
      if(!ok){ alert("비밀번호가 일치하지 않습니다."); return; }
      const content = prompt("새 내용", c.content); if(!content) return;
      await updateComment(c.id, { content });
      renderTree();
    });
    n.querySelector('.del').addEventListener('click', async ()=>{
      const pw = prompt("삭제 비밀번호 입력");
      if(!pw) return;
      const ok = await verifyCommentPassword(c.id, pw);
      if(!ok){ alert("비밀번호가 일치하지 않습니다."); return; }
      if(confirm("정말 삭제하시겠습니까?")){ deleteComment(c.id); renderTree(); }
    });
    n.querySelector('.ai-reply').addEventListener('click', async ()=>{
      const reply = await aiReply(c.content);
      await createComment({ postId: post.id, parentId: c.id, content: reply, author: 'AI', password: uuid(), isAI:true });
      renderTree();
    });
    // append children
    (c.children||[]).forEach(ch=> childrenEl.appendChild(node(ch)));
    return n;
  }
  tree.forEach(c=> elTree.appendChild(node(c)));
}
renderTree();

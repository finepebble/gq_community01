// LocalStorage-based storage for GitHub Pages (no server).
// Data shapes
// Post: {id,title,content,author,createdAt,updatedAt?, pwHash, salt, deletedAt?}
// Comment: {id,postId,parentId?,content,author,createdAt,updatedAt?, pwHash, salt, isAI?}
const DB_KEY = "aiboard/db/v1";

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(!raw){
    const init = { posts:[], comments:[] };
    localStorage.setItem(DB_KEY, JSON.stringify(init));
    return init;
  }
  try{ return JSON.parse(raw); } catch{ return {posts:[], comments:[]}; }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function countComments(db, postId){ return db.comments.filter(c=>c.postId===postId && !c.deletedAt).length; }

async function createPost({title, content, author, password}){
  const db = loadDB();
  const id = uuid();
  const salt = uuid();
  const pwHash = await sha256Hex(password + ":" + salt);
  const post = { id, title, content, author, createdAt: nowISO(), pwHash, salt };
  db.posts.unshift(post);
  saveDB(db);
  return post;
}
function listPosts({q="", page=1, pageSize=10}){
  const db = loadDB();
  const z = db.posts.filter(p=>!p.deletedAt && (
    !q || p.title.includes(q) || p.content.includes(q) || p.author.includes(q)
  ));
  const total = z.length;
  const start = (page-1)*pageSize;
  const items = z.slice(start, start+pageSize).map(p=>({...p, commentCount: countComments(db, p.id)}));
  return { total, items, page, pageSize, pages: Math.max(1, Math.ceil(total/pageSize)) };
}
function getPost(id){
  const db = loadDB();
  return db.posts.find(p=>p.id===id && !p.deletedAt) || null;
}
async function verifyPostPassword(id, password){
  const db = loadDB();
  const p = db.posts.find(x=>x.id===id);
  if(!p) return false;
  const hash = await sha256Hex(password + ":" + p.salt);
  return hash===p.pwHash;
}
async function updatePost(id, {title, content}){
  const db = loadDB();
  const p = db.posts.find(x=>x.id===id); if(!p) return null;
  if(title!=null) p.title = title;
  if(content!=null) p.content = content;
  p.updatedAt = nowISO();
  saveDB(db); return p;
}
function deletePost(id){
  const db = loadDB();
  const p = db.posts.find(x=>x.id===id); if(!p) return;
  p.deletedAt = nowISO();
  saveDB(db);
}

// Comments
async function createComment({postId, parentId=null, content, author, password, isAI=false}){
  const db = loadDB();
  const id = uuid();
  const salt = uuid();
  const pwHash = await sha256Hex(password + ":" + salt);
  const c = { id, postId, parentId, content, author, createdAt: nowISO(), pwHash, salt, isAI };
  db.comments.push(c);
  saveDB(db);
  return c;
}
function listComments(postId){
  const db = loadDB();
  const all = db.comments.filter(c=>c.postId===postId && !c.deletedAt);
  // build tree
  const byParent = {};
  all.forEach(c=>{
    const k = c.parentId || "_root";
    (byParent[k]||(byParent[k]=[])).push(c);
  });
  function build(parentId=null, depth=0){
    const arr = byParent[parentId || "_root"] || [];
    return arr.map(c=> ({...c, children: build(c.id, depth+1)}));
  }
  return build(null,0);
}
async function verifyCommentPassword(id, password){
  const db = loadDB();
  const c = db.comments.find(x=>x.id===id);
  if(!c) return false;
  const hash = await sha256Hex(password + ":" + c.salt);
  return hash===c.pwHash;
}
async function updateComment(id, {content}){
  const db = loadDB();
  const c = db.comments.find(x=>x.id===id); if(!c) return null;
  if(content!=null) c.content = content;
  c.updatedAt = nowISO();
  saveDB(db); return c;
}
function deleteComment(id){
  const db = loadDB();
  const c = db.comments.find(x=>x.id===id); if(!c) return;
  c.deletedAt = nowISO(); saveDB(db);
}

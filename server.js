// server/server.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const app = express();
app.use(express.json());

// --- 데이터 폴더 준비
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'threads.json');
const load = () => fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH,'utf8')) : [];
const save = (arr) => fs.writeFileSync(DB_PATH, JSON.stringify(arr, null, 2));

const ADMIN_KEY = process.env.ADMIN_KEY || 'hp4129';

// --- 관리자 확인 미들웨어
function requireAdmin(req, res, next){
  const key = req.get('X-Admin-Key');
  if(!key || key !== ADMIN_KEY) return res.status(401).json({error:'admin required'});
  next();
}

// --- 목록 (일반 유저는 비공개 글 숨김)
app.get('/api/threads', (req,res)=>{
  const data = load();
  const isAdmin = req.get('X-Admin-Key') === ADMIN_KEY;
  const filtered = isAdmin ? data : data.filter(p => !p.private);
  res.json(filtered);
});

// --- 글 등록
app.post('/api/threads', (req,res)=>{
  const data = load();
  const { title, body } = req.body || {};
  if (!body || !String(body).trim()) return res.status(400).json({error:'body required'});

  const post = {
    id: crypto.randomUUID(),
    title: (title || '').slice(0,200),
    body:  String(body).slice(0,5000),
    authorAlias: nextAlias(data), // 익명A/B/C…
    private: false,
    createdAt: Date.now(),
    children: []
  };
  data.unshift(post);
  save(data);
  res.json({ok:true, id:post.id});
});

// --- 관리자: 비공개/공개 전환
app.patch('/api/threads/:id/privacy', requireAdmin, (req,res)=>{
  const data = load();
  const t = data.find(p=>p.id===req.params.id);
  if(!t) return res.status(404).json({error:'not found'});
  t.private = !!req.body.private;
  save(data);
  res.json({ok:true, private:t.private});
});

// --- 관리자: 삭제
app.delete('/api/threads/:id', requireAdmin, (req,res)=>{
  let data = load();
  const before = data.length;
  data = data.filter(p=>p.id!==req.params.id);
  save(data);
  res.json({ok:true, removed: before - data.length});
});

// --- 익명 A/B/C… 생성기
function nextAlias(data){
  const last = data[0]?.authorAlias || '익명A';
  const code = (last.replace('익명','').charCodeAt(0) || 64); // A=65
  const nextCode = code >= 90 ? 65 : code + 1; // Z -> A
  return '익명' + String.fromCharCode(nextCode);
}

// 정적 파일 (프론트)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=> console.log(`✅ server on http://localhost:${PORT}`));

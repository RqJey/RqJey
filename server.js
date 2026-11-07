'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_TTL = 8 * 60 * 60 * 1000;
const sessions = new Map();
const attempts = new Map();
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 16) {
  console.error('CONFIG ERROR: set ADMIN_USERNAME and ADMIN_PASSWORD (password must be at least 16 characters) in hosting environment.');
  process.exit(1);
}
fs.mkdirSync(DATA_DIR, {recursive:true});
if (!fs.existsSync(CONTENT_FILE)) fs.writeFileSync(CONTENT_FILE, JSON.stringify({projects:[]}, null, 2));

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(status, {'Content-Type':typeof data === 'string'?'text/plain; charset=utf-8':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store',...headers});
  res.end(body);
}
function cookies(req) {
  const out = {};
  for (const item of (req.headers.cookie || '').split(';')) {
    const i = item.trim().indexOf('=');
    if (i < 0) continue;
    try { out[item.trim().slice(0,i)] = decodeURIComponent(item.trim().slice(i+1)); } catch {}
  }
  return out;
}
function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve,reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > limit) { reject(new Error('BODY_TOO_LARGE')); req.destroy(); }
    });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('INVALID_JSON')); } });
    req.on('error', reject);
  });
}
function currentSession(req) {
  const token = cookies(req).rqjey_admin;
  const session = token && sessions.get(token);
  if (!session) return null;
  if (session.expires < Date.now()) { sessions.delete(token); return null; }
  session.expires = Date.now() + SESSION_TTL;
  return {token,...session};
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
function authorized(req,res) {
  const session = currentSession(req);
  if (!session) { send(res,401,{error:'Требуется авторизация'}); return null; }
  if (!sameOrigin(req) || req.headers['x-csrf-token'] !== session.csrf) { send(res,403,{error:'Проверка запроса не пройдена'}); return null; }
  return session;
}
function readContent() { return JSON.parse(fs.readFileSync(CONTENT_FILE,'utf8')); }
function cleanContent(input) {
  if (!input || !Array.isArray(input.projects) || input.projects.length > 100) throw new Error('Некорректный список проектов');
  const ids = new Set();
  const projects = input.projects.map(p => {
    const id = String(p.id || '').trim().slice(0,80);
    if (!/^[a-z0-9-]+$/i.test(id) || ids.has(id)) throw new Error('ID проекта должен быть уникальным и содержать только латинские буквы, цифры и дефис');
    ids.add(id);
    const field = (v,max) => String(v ?? '').trim().slice(0,max);
    return {id,name:field(p.name,80),icon:field(p.icon,8),category:field(p.category,80),description:field(p.description,1200),minecraft:field(p.minecraft,60),accent:['violet','blue','green','purple','orange'].includes(p.accent)?p.accent:'violet',features:Array.isArray(p.features)?p.features.slice(0,12).map(v=>field(v,100)).filter(Boolean):[]};
  });
  return {projects};
}
function secureEqual(a,b) {
  const aa=Buffer.from(String(a ?? '')), bb=Buffer.from(String(b ?? ''));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
}
function loginAllowed(ip) {
  const entry=attempts.get(ip);
  return !entry || entry.until<Date.now() || entry.count<8;
}
function failedLogin(ip) {
  const entry=attempts.get(ip);
  if (!entry || entry.until<Date.now()) attempts.set(ip,{count:1,until:Date.now()+15*60*1000});
  else entry.count++;
}

const server = http.createServer(async (req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return send(res,400,'Bad request'); }

  if (req.method==='GET' && pathname==='/api/content') {
    try { return send(res,200,readContent()); }
    catch { return send(res,500,{error:'Не удалось прочитать контент'}); }
  }
  if (req.method==='GET' && pathname==='/api/admin/session') {
    const session=currentSession(req);
    return session?send(res,200,{authenticated:true,csrf:session.csrf}):send(res,401,{authenticated:false});
  }
  if (req.method==='POST' && pathname==='/api/admin/login') {
    if (!sameOrigin(req)) return send(res,403,{error:'Недопустимый источник запроса'});
    const ip=clientIp(req);
    if (!loginAllowed(ip)) return send(res,429,{error:'Слишком много попыток. Попробуй через 15 минут.'});
    let body;
    try { body=await readBody(req,4096); } catch { return send(res,400,{error:'Некорректный запрос'}); }
    if (!secureEqual(body.username,ADMIN_USERNAME) || !secureEqual(body.password,ADMIN_PASSWORD)) {
      failedLogin(ip); return send(res,401,{error:'Неверный логин или пароль'});
    }
    attempts.delete(ip);
    const token=crypto.randomBytes(32).toString('base64url');
    const csrf=crypto.randomBytes(24).toString('base64url');
    sessions.set(token,{csrf,expires:Date.now()+SESSION_TTL});
    const secure=process.env.NODE_ENV==='production'?'; Secure':'';
    return send(res,200,{authenticated:true,csrf},{'Set-Cookie':`rqjey_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL/1000}${secure}`});
  }
  if (req.method==='POST' && pathname==='/api/admin/logout') {
    const session=authorized(req,res); if (!session) return;
    sessions.delete(session.token);
    return send(res,200,{ok:true},{'Set-Cookie':'rqjey_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
  }
  if (pathname==='/api/admin/content' && req.method==='GET') {
    if (!currentSession(req)) return send(res,401,{error:'Требуется авторизация'});
    try { return send(res,200,readContent()); } catch { return send(res,500,{error:'Не удалось прочитать контент'}); }
  }
  if (pathname==='/api/admin/content' && req.method==='PUT') {
    const session=authorized(req,res); if (!session) return;
    let body;
    try { body=await readBody(req); }
    catch(e) { return send(res,e.message==='BODY_TOO_LARGE'?413:400,{error:'Не удалось прочитать данные'}); }
    try {
      const clean=cleanContent(body);
      const temp=CONTENT_FILE+'.tmp';
      fs.writeFileSync(temp,JSON.stringify(clean,null,2));
      fs.renameSync(temp,CONTENT_FILE);
      return send(res,200,{ok:true,savedAt:new Date().toISOString()});
    } catch(e) { return send(res,400,{error:e.message||'Некорректные данные'}); }
  }
  if (req.method==='GET' && pathname==='/control-room') return serveFile(path.join(ROOT,'admin.html'),res);
  if (pathname==='/admin.html' || pathname.startsWith('/data/') || pathname==='/server.js' || pathname==='/package.json' || pathname.startsWith('/.')) return send(res,404,'Not found');
  if (req.method==='GET' && pathname==='/robots.txt') return send(res,200,'User-agent: *\nDisallow: /control-room\nDisallow: /api/admin/\n');
  if (req.method==='GET' && pathname==='/') return serveFile(path.join(ROOT,'index.html'),res);
  if (req.method==='GET' && !pathname.startsWith('/api/')) {
    const allowed=new Set(['/index.html','/style.css','/app.js','/config.js','/aurora.js','/admin.css','/admin.js']);
    if (!allowed.has(pathname)) return send(res,404,'Not found');
    return serveFile(path.join(ROOT,pathname.slice(1)),res);
  }
  return send(res,404,{error:'Not found'});
});
function serveFile(file,res) {
  fs.readFile(file,(err,data) => {
    if (err) return send(res,404,'Not found');
    const ext=path.extname(file).toLowerCase();
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://api.github.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'","Cache-Control":"no-store"});
    res.end(data);
  });
}
server.listen(PORT,()=>console.log(`RqJey Mods server listening on port ${PORT}`));

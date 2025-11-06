/* script.js - Manejo local (localStorage) para prototipo */

/* ======== Helpers de almacenamiento ======== */
const STORAGE = {
  usersKey: 'csmix_users_v1',
  serversKey: 'csmix_servers_v1',
  matchesKey: 'csmix_matches_v1',
  sessionKey: 'csmix_session_v1'
};

function load(key){ return JSON.parse(localStorage.getItem(key) || '[]'); }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

/* ======== Auth / Session ======== */
function getUsers(){ return load(STORAGE.usersKey); }
function saveUsers(u){ save(STORAGE.usersKey, u); }

function getCurrentUser(){
  return JSON.parse(localStorage.getItem(STORAGE.sessionKey) || 'null');
}
function setCurrentUser(user){ localStorage.setItem(STORAGE.sessionKey, JSON.stringify(user)); }
function clearSession(){ localStorage.removeItem(STORAGE.sessionKey); }

/* registro simple */
function registerUser(username, password){
  const users = getUsers();
  if(!username || !password) throw 'Completa todos los campos.';
  if(users.find(u=>u.username===username)) throw 'Usuario ya existe';
  // user minimal: username, password, points, matchesIds
  users.push({ username, password, points:1000, matches:[] });
  saveUsers(users);
  return true;
}

/* login simple */
function loginUser(username, password){
  const users = getUsers();
  const user = users.find(u=>u.username===username && u.password===password);
  if(!user) throw 'Usuario o contraseña incorrectos';
  setCurrentUser({ username: user.username });
  return true;
}

/* logout */
function logout(){
  clearSession();
  // redirect to home
  window.location.href = '/index.html';
}

/* ======== Servidores ======== */
function getServers(){ return load(STORAGE.serversKey); }
function saveServers(s){ save(STORAGE.serversKey, s); }

/* crear servidor */
function addServer({ name, ip, port, map, location, owner }){
  const servers = getServers();
  const id = 'srv_' + Date.now();
  servers.push({ id, name, ip, port, map, location, owner, players:0, online:true });
  saveServers(servers);
  return id;
}

/* eliminar servidor (solo propietario) */
function removeServer(id){
  let servers = getServers();
  servers = servers.filter(s=>s.id!==id);
  saveServers(servers);
}

/* ======== Matches y puntos ======== */
function getMatches(){ return load(STORAGE.matchesKey); }
function saveMatches(m){ save(STORAGE.matchesKey, m); }

/* Reportar match (simple): {serverId, winnerUsernames[], loserUsernames[], mvp } */
function reportMatch({ serverId, winners, losers, mvp }){
  const matches = getMatches();
  const id = 'm_' + Date.now();
  const date = new Date().toISOString();
  matches.push({ id, serverId, winners, losers, mvp, date });
  saveMatches(matches);
  // actualizar stats y puntos de usuarios
  applyPoints(winners, losers, mvp);
  return id;
}

/* Sistema simple de puntos:
   - cada ganador +25, cada perdedor -10, MVP +10
*/
function applyPoints(winners, losers, mvp){
  const users = getUsers();
  winners.forEach(w=>{
    const u = users.find(x=>x.username===w);
    if(u){ u.points = (u.points||1000) + 25; u.matches = u.matches || []; u.matches.push({result:'win', date:new Date().toISOString()}); }
  });
  losers.forEach(l=>{
    const u = users.find(x=>x.username===l);
    if(u){ u.points = (u.points||1000) - 10; u.matches = u.matches || []; u.matches.push({result:'loss', date:new Date().toISOString()}); }
  });
  if(mvp){
    const um = users.find(x=>x.username===mvp);
    if(um){ um.points = (um.points||1000) + 10; }
  }
  saveUsers(users);
}

/* ======== Utilidades para UI en páginas ======== */
function showLoggedNav(){
  const current = getCurrentUser();
  const loginLink = document.getElementById('nav-login');
  const regLink = document.getElementById('nav-register');
  const profileLink = document.getElementById('nav-profile');
  if(current){
    if(loginLink) loginLink.textContent = `Hola, ${current.username}`;
    if(regLink) regLink.style.display = 'none';
    if(profileLink) profileLink.style.display = 'inline';
  } else {
    if(loginLink) loginLink.textContent = 'Iniciar sesión';
    if(regLink) regLink.style.display = 'inline';
    if(profileLink) profileLink.style.display = 'none';
  }
}

/* quick init: create sample data if empty */
(function initSample(){
  if(!localStorage.getItem(STORAGE.serversKey)){
    saveServers([
      { id:'srv_demo1', name:'LaBase Mix Argentina', ip:'200.10.10.10', port:'27015', map:'de_inferno', location:'Buenos Aires', owner:'community1', players:8, online:true },
      { id:'srv_demo2', name:'MixZoners Chile', ip:'190.20.20.20', port:'27015', map:'de_dust2', location:'Santiago', owner:'community2', players:5, online:true },
    ]);
  }
  if(!localStorage.getItem(STORAGE.usersKey)){
    saveUsers([{username:'playerx',password:'1234',points:1540,matches:[]},{username:'nano',password:'1234',points:1520,matches:[]}]);
  }
  showLoggedNav();
})();

// Club Caimaneros - vFinal app.js (admin preloaded)
const STORAGE_KEY = 'club_caimaneros_vfinal_v1';
let state = { users: [], athletes: [], attendance: {}, messages: [], payments: [] };
const ADMIN_INIT = { id: 'admin_vfinal', email: 'admin@caimaneros.com', name: 'Administrador General', password: 'caimaneros2025', role: 'admin', approved: true };

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function load(){ const raw = localStorage.getItem(STORAGE_KEY); if(raw) state = JSON.parse(raw); else { state.users = [ADMIN_INIT]; save(); } }
function uid(p='id'){ return p+Math.random().toString(36).slice(2,9); }
function $(s){ return document.querySelector(s); }

function buildUI(){
  const main = document.getElementById('main');
  main.innerHTML = `
  <section id="view-auth" class="view card">
    <h2>Iniciar sesión</h2>
    <form id="login-form">
      <input id="login-email" placeholder="Correo o usuario" required>
      <input id="login-password" type="password" placeholder="Contraseña" required>
      <select id="login-role"><option value="admin">Administrador</option><option value="trainer">Entrenador</option><option value="player">Deportista</option></select>
      <button type="submit">Entrar</button>
    </form>
    <hr>
    <h3>Registro - Deportista</h3>
    <form id="register-form">
      <input id="reg-name" placeholder="Nombre completo" required>
      <input id="reg-id" placeholder="Documento / ID">
      <input id="reg-email" type="email" placeholder="Correo" required>
      <input id="reg-password" type="password" placeholder="Contraseña" required>
      <button type="submit">Registrarme (pendiente aprobación)</button>
    </form>
  </section>

  <section id="view-dashboard" class="view" style="display:none;">
    <h2>Panel</h2>
    <div class="grid">
      <div class="card stat"><h3>Total deportistas</h3><div id="stat-athletes">0</div></div>
      <div class="card stat"><h3>Asistencia promedio (mes)</h3><div id="stat-attavg">0%</div></div>
      <div class="card stat"><h3>Pagos aprobados (total)</h3><div id="stat-payments">$0</div></div>
    </div>
    <div class="charts">
      <canvas id="chart-attendance" height="180"></canvas>
      <canvas id="chart-payments" height="180"></canvas>
    </div>
  </section>

  <section id="view-athletes" class="view" style="display:none;">
    <h2>Deportistas</h2>
    <div class="card">
      <form id="athlete-form" style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="athlete-name" placeholder="Nombre" required>
        <input id="athlete-id" placeholder="Documento/ID">
        <select id="athlete-trainer"><option value="">Asignar entrenador (opcional)</option></select>
        <button id="athlete-add" type="button">Agregar</button>
      </form>
      <ul id="athlete-list"></ul>
    </div>
  </section>

  <section id="view-attendance" class="view" style="display:none;">
    <h2>Asistencia</h2>
    <label>Fecha: <input type="date" id="att-date"></label>
    <button id="load-att">Cargar</button>
    <div id="attendance-area"></div>
  </section>

  <section id="view-payments" class="view" style="display:none;">
    <h2>Pagos</h2>
    <div id="payments-area"></div>
    <hr>
    <h3>Subir comprobante (deportista)</h3>
    <form id="upload-proof-form">
      <input type="file" id="proof-file" accept="image/*">
      <input type="date" id="proof-date">
      <button type="submit">Subir comprobante</button>
    </form>
    <h4>Comprobantes pendientes</h4>
    <ul id="proofs-list"></ul>
  </section>

  <section id="view-messages" class="view" style="display:none;">
    <h2>Mensajes</h2>
    <form id="message-form"><textarea id="message-text" placeholder="Mensaje..." required></textarea><button>Enviar</button></form>
    <ul id="message-list"></ul>
  </section>

  <section id="view-settings" class="view" style="display:none;">
    <h2>Ajustes & Contacto</h2>
    <div class="card">
      <h3>Contacto</h3>
      <p>Club Caimaneros<br>caimanerosbiz@gmail.com<br>+57 314 422 1984</p>
      <hr>
      <h3>Exportar / Importar datos</h3>
      <button id="export-btn">Exportar JSON</button>
      <input type="file" id="import-file" accept="application/json">
      <button id="import-btn">Importar JSON</button>
      <hr>
      <h3>Cambiar contraseña (usuario actual)</h3>
      <form id="change-pass-form">
        <input type="password" id="old-pass" placeholder="Contraseña actual" required>
        <input type="password" id="new-pass" placeholder="Nueva contraseña" required>
        <button type="submit">Cambiar contraseña</button>
      </form>
      <hr>
      <button id="clear-data">Limpiar datos (borrar todo)</button>
    </div>
  </section>

  <section id="view-approvals" class="view" style="display:none;">
    <h2>Aprobaciones</h2>
    <div class="card">
      <h3>Usuarios pendientes</h3>
      <ul id="pending-users"></ul>
      <h3>Comprobantes pendientes</h3>
      <ul id="pending-proofs"></ul>
    </div>
  </section>

  <section id="view-profile" class="view" style="display:none;">
    <h2>Mi perfil</h2>
    <div id="profile-area"></div>
  </section>
  `;
}

function init(){ load(); buildUI(); const cur = localStorage.getItem('club_current'); if(cur) currentUser = state.users.find(u=>u.id===cur) || null; setUserUI(); bindUI(); refreshAll(); if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{}); }

let currentUser = null;
function setUserUI(){ if(currentUser){ document.getElementById('app').style.display='block'; document.getElementById('splash').style.display='none'; document.getElementById('nav').style.display='flex'; document.getElementById('user-info').textContent = `${currentUser.name} (${currentUser.role})`; } else { document.getElementById('app').style.display='none'; document.getElementById('splash').style.display='block'; document.getElementById('nav').style.display='none'; } }

function login(emailOrUser, password, role){ const u = state.users.find(x=> (x.email===emailOrUser||x.id===emailOrUser) && x.role===role); if(!u) return {ok:false,msg:'Usuario no encontrado para ese rol'}; if(!u.approved) return {ok:false,msg:'Cuenta pendiente de aprobación'}; if(u.password !== password) return {ok:false,msg:'Contraseña incorrecta'}; currentUser = u; localStorage.setItem('club_current', u.id); return {ok:true}; }
function logout(){ currentUser = null; localStorage.removeItem('club_current'); setUserUI(); showView('auth'); }

function registerPlayer(name, doc, email, password){ if(state.users.find(u=>u.email===email)) return {ok:false,msg:'Correo ya registrado'}; const u = {id: uid('u'), email, name, password, role:'player', approved:false, trainerId:null}; state.users.push(u); save(); return {ok:true,msg:'Registrado. Esperando aprobación del administrador.'}; }

function bindUI(){
  document.getElementById('enter-btn').addEventListener('click', ()=> { document.getElementById('splash').style.display='none'; document.getElementById('app').style.display='block'; showView('auth'); });
  document.getElementById('logout-btn').addEventListener('click', ()=> { logout(); });
  document.getElementById('login-form').addEventListener('submit', e=>{ e.preventDefault(); const email = document.getElementById('login-email').value.trim(), pwd = document.getElementById('login-password').value, role = document.getElementById('login-role').value; const r = login(email,pwd,role); if(!r.ok) return alert(r.msg); setUserUI(); navigateAfterLogin(); });
  document.getElementById('register-form').addEventListener('submit', e=>{ e.preventDefault(); const r = registerPlayer(document.getElementById('reg-name').value.trim(), document.getElementById('reg-id').value.trim(), document.getElementById('reg-email').value.trim(), document.getElementById('reg-password').value); alert(r.msg); document.getElementById('register-form').reset(); refreshApprovals(); });
  document.querySelectorAll('nav button').forEach(btn=> btn.addEventListener('click', ()=> { showView(btn.dataset.view); if(btn.dataset.view==='dashboard') renderDashboard(); if(btn.dataset.view==='athletes') renderAthletes(); if(btn.dataset.view==='payments') renderPayments(); if(btn.dataset.view==='attendance') document.getElementById('att-date').valueAsDate = new Date(); }));
  document.getElementById('athlete-add').addEventListener('click', ()=>{ if(!currentUser || currentUser.role==='player') return alert('Sin permiso'); const name = document.getElementById('athlete-name').value.trim(), doc = document.getElementById('athlete-id').value.trim(), trainer = document.getElementById('athlete-trainer').value || null; if(!name) return alert('Ingrese nombre'); const a = {id: uid('ath'), name, doc, trainerId: trainer}; state.athletes.push(a); save(); document.getElementById('athlete-name').value=''; document.getElementById('athlete-id').value=''; renderAthletes(); });
  document.getElementById('load-att').addEventListener('click', ()=>{ const date = document.getElementById('att-date').value; if(!date) return alert('Selecciona fecha'); const area = document.getElementById('attendance-area'); area.innerHTML=''; state.athletes.forEach(a=>{ if(currentUser && currentUser.role==='trainer' && a.trainerId!==currentUser.id) return; const key = `${date}::${a.id}`; const present = !!state.attendance[key]; const div = document.createElement('div'); div.style.display='flex'; div.style.justifyContent='space-between'; div.style.padding='6px 0'; div.innerHTML = `<div>${a.name}</div><div><button data-ath="${a.id}" class="smallbtn">${present? 'Presente':'Ausente'}</button></div>`; area.appendChild(div); }); area.querySelectorAll('.smallbtn').forEach(b=> b.addEventListener('click', ()=>{ const aid = b.dataset.ath, key = `${document.getElementById('att-date').value}::${aid}`; if(state.attendance[key]) delete state.attendance[key]; else state.attendance[key]=true; save(); b.textContent = state.attendance[key]? 'Presente':'Ausente'; renderDashboard(); })); });
  document.getElementById('message-form').addEventListener('submit', e=>{ e.preventDefault(); if(!currentUser) return alert('Ingresa'); const txt = document.getElementById('message-text').value.trim(); if(!txt) return; state.messages.unshift({from:currentUser.name, role:currentUser.role, text:txt, ts:Date.now()}); save(); document.getElementById('message-text').value=''; renderMessages(); });
  document.getElementById('upload-proof-form').addEventListener('submit', e=>{ e.preventDefault(); if(!currentUser || currentUser.role!=='player') return alert('Solo deportistas'); const file = document.getElementById('proof-file').files[0]; const date = document.getElementById('proof-date').value; if(!file) return alert('Selecciona imagen'); if(!date) return alert('Selecciona fecha'); const reader = new FileReader(); reader.onload = ()=>{ const base64 = reader.result; const p = {id: uid('pay'), athleteId: currentUser.id, date, amount:0, proofBase64: base64, status:'pending', ts:Date.now(), approvedBy:null}; state.payments.unshift(p); save(); alert('Comprobante subido, pendiente aprobación'); renderPayments(); refreshApprovals(); }; reader.readAsDataURL(file); });
  document.getElementById('export-btn').addEventListener('click', ()=>{ const data = JSON.stringify(state,null,2); const blob = new Blob([data], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'club_caimaneros_export.json'; a.click(); URL.revokeObjectURL(url); });
  document.getElementById('import-btn').addEventListener('click', ()=>{ const f = document.getElementById('import-file').files[0]; if(!f) return alert('Selecciona archivo JSON'); const reader = new FileReader(); reader.onload = ()=>{ try{ const obj = JSON.parse(reader.result); state = obj; save(); alert('Importado'); refreshAll(); }catch(e){alert('JSON inválido')} }; reader.readAsText(f); });
  document.getElementById('clear-data').addEventListener('click', ()=>{ if(confirm('Borrar todos los datos?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } });
  document.getElementById('change-pass-form').addEventListener('submit', e=>{ e.preventDefault(); if(!currentUser) return alert('Ingresa'); const oldp=document.getElementById('old-pass').value, newp=document.getElementById('new-pass').value; if(currentUser.password !== oldp) return alert('Contraseña actual incorrecta'); currentUser.password = newp; const u = state.users.find(x=>x.id===currentUser.id); if(u){ u.password=newp; save(); alert('Contraseña cambiada'); document.getElementById('old-pass').value=''; document.getElementById('new-pass').value=''; } });
}

function navigateAfterLogin(){ if(currentUser.role==='admin') { showView('dashboard'); renderDashboard(); } else if(currentUser.role==='trainer'){ showView('athletes'); renderAthletes(); } else { showView('profile'); renderProfile(); } }
function showView(name){ document.querySelectorAll('.view').forEach(v=> v.style.display='none'); const map={'auth':'view-auth','dashboard':'view-dashboard','athletes':'view-athletes','attendance':'view-attendance','payments':'view-payments','messages':'view-messages','settings':'view-settings','approvals':'view-approvals','profile':'view-profile'}; const id=map[name]||'view-auth'; document.getElementById(id).style.display=''; }
function refreshAll(){ renderAthletes(); renderMessages(); renderPayments(); renderDashboard(); refreshApprovals(); renderAthleteTrainerOptions(); }
function renderAthletes(){ const ul = document.getElementById('athlete-list'); ul.innerHTML=''; state.athletes.forEach(a=>{ if(currentUser && currentUser.role==='trainer' && a.trainerId!==currentUser.id) return; const li = document.createElement('li'); li.innerHTML = `<div><strong>${a.name}</strong> ${a.doc?('• '+a.doc):''}</div><div>${a.trainerId?('Entr: '+(state.users.find(u=>u.id===a.trainerId)||{name:'(sin)'}).name):''} <button class="small action-edit" data-id="${a.id}">Editar</button> <button class="small action-del" data-id="${a.id}">Eliminar</button></div>`; ul.appendChild(li); }); ul.querySelectorAll('.action-del').forEach(b=> b.addEventListener('click', ()=>{ if(!currentUser || currentUser.role!=='admin') return alert('Solo administrador'); const id = b.dataset.id; state.athletes = state.athletes.filter(x=>x.id!==id); save(); renderAthletes(); renderDashboard(); })); renderAthleteTrainerOptions(); }
function renderMessages(){ const ul = document.getElementById('message-list'); ul.innerHTML=''; state.messages.forEach(m=>{ const li = document.createElement('li'); li.innerHTML = `<div><strong>${m.from}</strong> (${m.role})<div>${m.text}</div></div><div><small>${new Date(m.ts).toLocaleString()}</small></div>`; ul.appendChild(li); }); }
function renderPayments(){ const area = document.getElementById('payments-area'); area.innerHTML=''; state.payments.forEach(p=>{ const athleteUser = state.users.find(u=>u.id===p.athleteId) || {name:'(eliminado)'}; if(currentUser && currentUser.role==='trainer' && p.athleteId!==currentUser.id && state.athletes.find(a=>a.id===p.athleteId && a.trainerId!==currentUser.id)) return; const div = document.createElement('div'); div.className='card'; div.innerHTML = `<div><strong>${athleteUser.name}</strong> • ${p.date} • <small>${p.status}</small></div><div>${p.proofBase64?'<img src="'+p.proofBase64+'" style="max-width:120px;max-height:120px;border-radius:8px">':''}</div>`; if(currentUser && currentUser.role==='admin' && p.status==='pending'){ const ok = document.createElement('button'); ok.textContent='Aprobar'; ok.addEventListener('click', ()=>{ p.status='approved'; p.approvedBy=currentUser.id; save(); renderPayments(); refreshApprovals(); renderDashboard(); }); const rej = document.createElement('button'); rej.textContent='Rechazar'; rej.style.marginLeft='8px'; rej.addEventListener('click', ()=>{ p.status='rejected'; save(); renderPayments(); refreshApprovals(); renderDashboard(); }); div.appendChild(ok); div.appendChild(rej); } area.appendChild(div); }); const pl = document.getElementById('proofs-list'); if(pl){ pl.innerHTML=''; state.payments.filter(p=>p.status==='pending').forEach(p=>{ const li = document.createElement('li'); const uname = (state.users.find(u=>u.id===p.athleteId)||{name:'(eliminado)'}).name; li.innerHTML = `<div>${uname} • ${p.date} <button class="approve" data-id="${p.id}">Aprobar</button> <button class="reject" data-id="${p.id}">Rechazar</button></div><div><img src="${p.proofBase64}" style="max-width:160px"></div>`; pl.appendChild(li); }); pl.querySelectorAll('.approve').forEach(b=> b.addEventListener('click', ()=>{ const id=b.dataset.id; const p=state.payments.find(x=>x.id===id); if(p){ p.status='approved'; p.approvedBy=currentUser.id; save(); refreshApprovals(); renderPayments(); renderDashboard(); } })); pl.querySelectorAll('.reject').forEach(b=> b.addEventListener('click', ()=>{ const id=b.dataset.id; const p=state.payments.find(x=>x.id===id); if(p){ p.status='rejected'; save(); refreshApprovals(); renderPayments(); renderDashboard(); } })); } }
function refreshApprovals(){ const ul = document.getElementById('pending-users'); if(!ul) return; ul.innerHTML=''; state.users.filter(u=>!u.approved).forEach(u=>{ const li = document.createElement('li'); li.innerHTML = `<div>${u.name} • ${u.email} • ${u.role} <button class="approve-user" data-id="${u.id}">Aprobar</button> <button class="reject-user" data-id="${u.id}">Rechazar</button></div>`; ul.appendChild(li); }); ul.querySelectorAll('.approve-user').forEach(b=> b.addEventListener('click', ()=>{ const id=b.dataset.id; const u=state.users.find(x=>x.id===id); if(u){ u.approved=true; save(); refreshApprovals(); alert('Usuario aprobado'); } })); ul.querySelectorAll('.reject-user').forEach(b=> b.addEventListener('click', ()=>{ const id=b.dataset.id; state.users = state.users.filter(x=>x.id!==id); save(); refreshApprovals(); alert('Usuario rechazado'); })); }
function renderDashboard(){ document.getElementById('stat-athletes').textContent = state.athletes.length; const now = new Date(); const month = now.getMonth(); const year = now.getFullYear(); let totalDates = 0, totalPresent = 0; Object.keys(state.attendance).forEach(k=>{ const date = k.split('::')[0]; const d = new Date(date); if(d.getMonth()===month && d.getFullYear()===year){ totalDates++; totalPresent++; } }); const avg = totalDates && state.athletes.length ? Math.round((totalPresent/(totalDates*state.athletes.length))*100):0; document.getElementById('stat-attavg').textContent = avg + '%'; const totalPaid = state.payments.filter(p=>p.status==='approved').length * 1; document.getElementById('stat-payments').textContent = '$' + totalPaid; try{ renderCharts(); }catch(e){} }
function renderCharts(){ const labels=[]; const data=[]; for(let i=5;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); labels.push(d.toLocaleDateString()); const cnt = Object.keys(state.attendance).filter(k=>k.startsWith(d.toISOString().slice(0,10))).length; data.push(cnt); } const ctx = document.getElementById('chart-attendance').getContext('2d'); if(window._att_chart) window._att_chart.destroy(); window._att_chart = new Chart(ctx, {type:'bar', data:{labels, datasets:[{label:'Asistencias', data}]}}); const ctx2 = document.getElementById('chart-payments').getContext('2d'); if(window._pay_chart) window._pay_chart.destroy(); const approved = state.payments.filter(p=>p.status==='approved').length; const pending = state.payments.filter(p=>p.status==='pending').length; const rejected = state.payments.filter(p=>p.status==='rejected').length; window._pay_chart = new Chart(ctx2, {type:'pie', data:{labels:['Aprobados','Pendientes','Rechazados'], datasets:[{data:[approved,pending,rejected]}]}}); }
function renderProfile(){ if(!currentUser) return; const area = document.getElementById('profile-area'); area.innerHTML = `<div class="card"><h3>${currentUser.name}</h3><p>${currentUser.email}</p><p>Rol: ${currentUser.role}</p></div>`; if(currentUser.role==='player'){ const my = state.payments.filter(p=>p.athleteId===currentUser.id); my.forEach(p=>{ const d = document.createElement('div'); d.className='card'; d.innerHTML = `<div>${p.date} • <small>${p.status}</small></div><div>${p.proofBase64?'<img src="'+p.proofBase64+'" style="max-width:120px">':''}</div>`; area.appendChild(d); }); } }
function renderAthleteTrainerOptions(){ const sel = document.getElementById('athlete-trainer'); sel.innerHTML = '<option value="">Asignar entrenador (opcional)</option>'; state.users.filter(u=>u.role==='trainer').forEach(t=>{ const o = document.createElement('option'); o.value=t.id; o.textContent=t.name; sel.appendChild(o); }); }
function createTrainer(name,email,password){ if(state.users.find(u=>u.email===email)) return false; const u = {id: uid('u'), email, name, password, role:'trainer', approved:true}; state.users.push(u); save(); renderAthleteTrainerOptions(); return true; }
window.createTrainer = createTrainer; window.state = state;
function ensureDemo(){ if(!state.users.find(u=>u.role==='trainer')){ state.users.push({id:uid('u'), email:'ent1@caim.com', name:'Entrenador 1', password:'ent1', role:'trainer', approved:true}); save(); } }
ensureDemo();
init();
/* ============================================================
 * FutValleFC – UI Module v2 (7K-style)
 * ============================================================ */
const UI = (() => {
  let betTicket = [];

  const FLAGS = { Russia:'🇷🇺', Uzbequistao:'🇺🇿', Afeganistao:'🇦🇫', Bielorrussia:'🇧🇾', Turquia:'🇹🇷' };

  const fmt = n => parseFloat(n||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  // ── Toast ────────────────────────────────────────────────
  function showToast(msg, type='info', ms=3500) {
    const icons = {win:'🏆', loss:'⚽', msn:'🎯', info:'ℹ️'};
    const el = document.createElement('div');
    el.className=`toast ${type}`;
    el.innerHTML=`<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    document.getElementById('toast-cont').appendChild(el);
    requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400);},ms);
  }

  // ── Confetti ─────────────────────────────────────────────
  function fireConfetti() {
    if (typeof confetti==='undefined') return;
    const end=Date.now()+3000;
    (function f(){
      confetti({particleCount:4,angle:60,spread:60,origin:{x:0},colors:['#00e676','#00bf63','#fff']});
      confetti({particleCount:4,angle:120,spread:60,origin:{x:1},colors:['#00e676','#00bf63','#fff']});
      if(Date.now()<end) requestAnimationFrame(f);
    }());
  }

  // ── Navigation ───────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
    const sc = document.getElementById('screen-'+id);
    if (sc) sc.classList.remove('hidden');

    // Sync sidebar + header tabs
    document.querySelectorAll('.sb-item').forEach(b=>{
      b.classList.toggle('active', b.dataset.action==='screen' && b.dataset.target===id);
    });
    document.querySelectorAll('.header-tab').forEach(b=>{
      b.classList.toggle('active', b.dataset.target===id);
    });
    document.querySelectorAll('.bn-btn').forEach(b=>{
      b.classList.toggle('active', b.dataset.target===id);
    });
    window.scrollTo(0,0);
  }

  // ── Nickname modal ───────────────────────────────────────
  function showNicknameModal() {
    const modal = document.getElementById('nickname-modal');
    modal.classList.remove('hidden');
  }

  function hideNicknameModal() {
    document.getElementById('nickname-modal').classList.add('hidden');
  }
  function getNicknameInput() {
    return {
      nickname: document.getElementById('nick-input').value.trim(),
    };
  }

  // ── User display ─────────────────────────────────────────
  function updateUserDisplay() {
    const u = Storage.getUser();
    const el = document.getElementById('user-display');
    if (el) el.textContent = u ? u.nickname : 'Perfil';
    updateBalanceDisplay();
  }
  function updateBalanceDisplay() {
    const el = document.getElementById('nav-balance');
    if (el) el.textContent = fmt(Storage.getBalance());
  }

  // ── LIVE / HOME ──────────────────────────────────────────
  function renderLive(matches) {
    const bal = Storage.getBalance();
    const hist = Storage.getBetHistory();
    const u = Storage.getUser();
    const lvl = Storage.getPlayerLevel();
    const liveMatches = matches.filter(m=>m.isLive);
    document.getElementById('live-count').textContent = liveMatches.length;

    document.getElementById('live-content').innerHTML = `
      <!-- Hero -->
      <div class="hero-banner">
        <div class="hb-left">
          <div class="hb-label">Saldo Disponível</div>
          <div class="hb-balance">₡ ${fmt(bal)}</div>
          <div class="hb-level">${lvl.icon} Nível ${lvl.level} – ${lvl.name}</div>
          <div class="hb-xp"><div class="hb-xp-fill" style="width:${Math.round(lvl.progress*100)}%"></div></div>
        </div>
        <div class="hb-stats">
          <div class="hb-stat"><div class="hb-stat-num">${hist.length}</div><div class="hb-stat-lbl">Apostas</div></div>
          <div class="hb-stat"><div class="hb-stat-num">${hist.filter(b=>b.won).length}</div><div class="hb-stat-lbl">Vitórias</div></div>
          <div class="hb-stat"><div class="hb-stat-num">${hist.length?Math.round(hist.filter(b=>b.won).length/hist.length*100):0}%</div><div class="hb-stat-lbl">Acertos</div></div>
        </div>
      </div>
      <!-- Live matches -->
      <div class="section-hdr">
        <div class="section-title">🔴 Ao Vivo</div>
        <button onclick="App.loadMatches()" style="font-size:.78rem;color:var(--accent);font-weight:600;">🔄 Atualizar</button>
      </div>
      <div class="matches-grid">${liveMatches.length ? liveMatches.map(m=>matchCard(m)).join('') : '<div class="empty-state" style="grid-column:1/-1">Nenhuma partida ao vivo agora.</div>'}</div>
      <!-- Featured matches -->
      <div class="section-hdr">
        <div class="section-title">⚽ Partidas em Destaque</div>
        <span class="section-tag">Hoje</span>
      </div>
      <div class="matches-grid">${matches.slice(0,6).map(m=>matchCard(m)).join('')}</div>
    `;
  }

  // ── MATCHES ──────────────────────────────────────────────
  function renderMatches(matches, title='Todas as Partidas') {
    document.getElementById('matches-content').innerHTML = `
      <div class="section-hdr">
        <div class="section-title">⚽ ${title}</div>
        <button onclick="App.refreshOdds()" style="font-size:.78rem;color:var(--accent);font-weight:600;" id="refresh-btn">🔄 Atualizar Odds</button>
      </div>
      <div class="matches-grid" id="matches-grid">
        ${matches.map(m=>matchCard(m)).join('')}
      </div>`;
  }

  function renderCountry(country, matches) {
    const flag = FLAGS[country]||'🏳️';
    const filtered = matches.filter(m=>m.teamA.pais===country||m.teamB.pais===country);
    document.getElementById('country-content').innerHTML = `
      <div class="section-hdr">
        <div class="section-title"><span class="flag">${flag}</span> ${country}</div>
        <span class="section-tag">${filtered.length} partidas</span>
      </div>
      <div class="matches-grid">
        ${filtered.length ? filtered.map(m=>matchCard(m)).join('') : '<div class="empty-state">Sem partidas para este país agora.</div>'}
      </div>`;
  }

  function matchCard(m) {
    const sa = betTicket.find(s=>s.matchId===m.id);
    const hl = opt => sa&&sa.option===opt?'sel':'';
    const pctA = Math.round((m.teamA.rating/(m.teamA.rating+m.teamB.rating))*100);
    const f = FLAGS[m.teamA.pais]||'🏳️';
    const safeA = (m.teamA.nome||'').replace(/'/g,"\\'");
    const safeB = (m.teamB.nome||'').replace(/'/g,"\\'");
    const safeMN = (m.matchName||'').replace(/'/g,"\\'");
    return `
      <div class="match-card">
        <div class="mc-hdr">
          <span>${f} ${m.teamA.pais} • ${m.time}</span>
          ${m.isLive?'<span class="live-tag">🔴 Ao Vivo</span>':''}
        </div>
        <div class="mc-teams">
          <div class="mc-team"><span class="mc-name">${m.teamA.nome}</span><span class="mc-ovr">${(m.teamA.overallMedio||0).toFixed(0)} OVR</span></div>
          <span class="mc-sep">×</span>
          <div class="mc-team right"><span class="mc-ovr">${(m.teamB.overallMedio||0).toFixed(0)} OVR</span><span class="mc-name">${m.teamB.nome}</span></div>
        </div>
        <div class="mc-bar"><div class="mc-bar-fill" style="width:${pctA}%"></div></div>
        <div class="odds-row">
          <button class="odd-btn ${hl('A')}" onclick="App.selectBet('${m.id}','A',${m.odds.oddA},'${safeA}','${safeMN}')"><span>1</span><span>${m.odds.oddA}</span></button>
          <button class="odd-btn ${hl('X')}" onclick="App.selectBet('${m.id}','X',${m.odds.oddX},'Empate','${safeMN}')"><span>X</span><span>${m.odds.oddX}</span></button>
          <button class="odd-btn ${hl('B')}" onclick="App.selectBet('${m.id}','B',${m.odds.oddB},'${safeB}','${safeMN}')"><span>2</span><span>${m.odds.oddB}</span></button>
        </div>
      </div>`;
  }

  // ── STANDINGS TABLE ──────────────────────────────────────
  function renderStandings(teamsByCountry) {
    const countryOrder = ['Russia','Uzbequistao','Afeganistao','Bielorrussia','Turquia'];
    const html = countryOrder.map(country => {
      const flag = FLAGS[country]||'🏳️';
      const teams = teamsByCountry[country] || [];
      if (!teams.length) return '';
      return `
        <div class="standings-wrap">
          <div class="section-hdr">
            <div class="section-title"><span class="flag">${flag}</span> Liga – ${country}</div>
            <span class="section-tag">Temporada 2026</span>
          </div>
          <table class="standings-table">
            <thead>
              <tr>
                <th style="width:28px">#</th>
                <th>Time</th>
                <th title="Jogos">J</th>
                <th title="Vitórias" class="h-mob">V</th>
                <th title="Empates" class="h-mob">E</th>
                <th title="Derrotas" class="h-mob">D</th>
                <th title="Gols Pró" class="h-mob">GP</th>
                <th title="Gols Sofridos" class="h-mob">GS</th>
                <th title="Saldo">SG</th>
                <th title="Pontos">PTS</th>
              </tr>
            </thead>
            <tbody>
              ${teams.slice(0,10).map((t,i)=>`
                <tr>
                    <td class="pos ${i<4?'top':''}">${i+1}</td>
                    <td class="team-name">${t.nome}</td>
                    <td>${t.j}</td>
                    <td class="h-mob">${t.v}</td>
                    <td class="h-mob">${t.e}</td>
                    <td class="h-mob">${t.d}</td>
                    <td class="h-mob">${t.gp}</td>
                    <td class="h-mob">${t.gs}</td>
                    <td class="${t.gp-t.gs>=0?'':'red'}">${t.gp-t.gs>0?'+':''}${t.gp-t.gs}</td>
                    <td class="pts">${t.pts}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }).join('');
    document.getElementById('standings-content').innerHTML = html || '<div class="empty-state">Sem dados.</div>';
  }

  // ── HISTORY ──────────────────────────────────────────────
  function renderHistory() {
    const h = Storage.getBetHistory();
    document.getElementById('history-content').innerHTML = `
      <div class="section-hdr"><div class="section-title">📋 Histórico de Operações</div></div>
      ${!h.length ? '<div class="empty-state">Nenhuma aposta ainda.</div>' :
        `<div class="hist-list">${h.map(b=>`
          <div class="hist-item ${b.won?'won':'lost'}">
            <div class="hi-top">
              <span class="hi-match">${b.matchName}</span>
              <span class="hi-date">${new Date(b.timestamp).toLocaleString('pt-BR')}</span>
            </div>
            <div class="hi-bot">
              <span class="hi-detail">${(b.selections||[]).map(s=>s.teamName).join(' + ')||b.pick||''} × ${(b.combinedOdd||1).toFixed(2)}</span>
              <span class="hi-result ${b.won?'g':'r'}">${b.won?'+'+fmt(b.payout-b.stake):'-'+fmt(b.stake)} ₡</span>
            </div>
          </div>`).join('')}</div>`}`;
  }

  // ── PROFILE ──────────────────────────────────────────────
  function renderProfile() {
    const u = Storage.getUser() || { avatar:'⚽', nickname:'Visitante' };
    const bal = Storage.getBalance();
    const lvl = Storage.getPlayerLevel();
    const hist = Storage.getBetHistory();
    const wins = hist.filter(b=>b.won).length;
    document.getElementById('profile-content').innerHTML = `
      <div class="section-hdr"><div class="section-title">👤 Perfil do Usuário</div></div>
      <div class="profile-wrap">
        <div class="profile-card accent-border">
          <div class="pc-t">Conta</div>
          <div class="pc-avatar">👤</div>
          <div class="pc-nickname">${u.nickname}</div>
          <div class="pc-level">${lvl.icon} ${lvl.name}</div>
          <div class="xp-bar"><div class="xp-fill" style="width:${Math.round(lvl.progress*100)}%"></div></div>
          <div class="pc-balance">₡ ${fmt(bal)}</div>
        </div>
        <div class="profile-card">
          <div class="pc-t">Estatísticas</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
            ${[['Total Apostas',hist.length],['Vitórias',wins],['Derrotas',hist.length-wins],['Taxa',hist.length?Math.round(wins/hist.length*100)+'%':'0%'],
               ['Volume Apostado','₡ '+fmt(Storage.getTotalWagered())],['Nível',lvl.level+' / 5']]
               .map(([l,v])=>`<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:10px;text-align:center;"><div style="font-size:1.1rem;font-weight:700;color:var(--accent)">${v}</div><div style="font-size:.7rem;color:var(--muted)">${l}</div></div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  // ── MISSIONS ─────────────────────────────────────────────
  function renderMissions() {
    const ms = Storage.getMissions();
    const pending = ms.filter(m=>!m.done);
    const el = document.getElementById('miss-badge');
    if (el) el.style.display = pending.length ? '' : 'none';
    document.getElementById('missions-content').innerHTML = `
      <div class="section-hdr"><div class="section-title">🎯 Missões de Treinamento</div><span class="section-tag">Reset Diário</span></div>
      <div class="profile-card" style="max-width:500px;">
        ${ms.map(m=>`
          <div class="mission-item ${m.done?'done':''}">
            <span class="mi-icon">${m.icon}</span>
            <div class="mi-info">
              <div class="mi-name">${m.title}</div>
              <div class="mi-bar"><div class="mi-fill" style="width:${Math.min(100,Math.round(m.current/m.target*100))}%"></div></div>
            </div>
            <div class="mi-right">
              <span class="mi-prog">${m.current}/${m.target}</span>
              <span class="mi-reward">+${m.reward}₡</span>
              ${m.done?'<span class="mi-done-icon">✓</span>':''}
            </div>
          </div>`).join('')}
      </div>`;
  }



  // ── BET TICKET ────────────────────────────────────────────
  function addToBetTicket(sel) {
    const idx = betTicket.findIndex(s=>s.matchId===sel.matchId);
    if (idx!==-1) {
      if (betTicket[idx].option===sel.option) betTicket.splice(idx,1);
      else betTicket[idx]=sel;
    } else {
      if (betTicket.length>=5) { showToast('Máximo 5 seleções!'); return; }
      betTicket.push(sel);
    }
    renderTicket();
    const badge = document.getElementById('ticket-badge');
    if (badge) badge.textContent = betTicket.length || '';
  }

  function renderTicket() {
    const el = document.getElementById('bet-ticket');
    if (!el) return;
    if (!betTicket.length) {
      el.innerHTML=`<div class="ticket-empty"><div class="te-icon">🎫</div><p style="font-size:.85rem;">Selecione uma odd</p><p style="font-size:.75rem;color:var(--muted);margin-top:4px;">Clique em 1, X ou 2</p></div>`;
      return;
    }
    const combo = betTicket.reduce((a,s)=>a*s.odd,1);
    el.innerHTML=`
      <div class="ticket-title">🎫 Bilhete ${betTicket.length>1?'<span class="multi-tag">MÚLTIPLA</span>':''}
        <button class="t-clear" onclick="UI.clearTicket()">✕ Limpar</button>
      </div>
      ${betTicket.map((s,i)=>`
        <div class="tsel">
          <div class="tsel-match">${s.matchName}</div>
          <div class="tsel-row"><span class="tsel-pick">${s.teamName}</span>
            <span style="display:flex;gap:6px;align-items:center"><span class="tsel-odd">${s.odd}</span>
              <button class="tsel-rm" onclick="UI.removeSel(${i})">✕</button></span>
          </div>
        </div>`).join('')}
      ${betTicket.length>1?`<div class="combo-odd">Odd Combinada: <strong>${combo.toFixed(2)}×</strong></div>`:''}
      <div class="stake-sec">
        <label>Valor da Aposta (₡)</label>
        <input id="stake-input" type="number" min="1" placeholder="0" oninput="UI.updReturn()">
        <div class="quick-stakes">${[50,100,250,500].map(v=>`<button onclick="UI.addStake(${v})">+${v}</button>`).join('')}</div>
      </div>
      <div class="ret-block">
        <div class="ret-row"><span>Apostado:</span><span id="r-stake">₡ 0,00</span></div>
        <div class="ret-row hl"><span>Retorno Potencial:</span><span id="r-pot">₡ 0,00</span></div>
      </div>
      <button class="confirm-btn" onclick="App.confirmBet()">⚡ Confirmar Aposta</button>`;
  }

  function removeSel(i){ betTicket.splice(i,1); renderTicket(); App.refreshMatchCards(); }
  function clearTicket(){ betTicket=[]; renderTicket(); document.getElementById('ticket-badge').textContent=''; App.refreshMatchCards(); }
  function clearBetTicket(){ clearTicket(); }
  function addStake(v){ const i=document.getElementById('stake-input'); if(i){i.value=(parseFloat(i.value||0)+v);updReturn();} }
  function updReturn(){
    const i=document.getElementById('stake-input'); if(!i)return;
    const st=parseFloat(i.value)||0;
    const combo=betTicket.reduce((a,s)=>a*s.odd,1);
    const rs=document.getElementById('r-stake'), rp=document.getElementById('r-pot');
    if(rs) rs.textContent=`₡ ${fmt(st)}`;
    if(rp) rp.textContent=`₡ ${fmt(st*combo)}`;
  }
  function getTicketData(){
    const i=document.getElementById('stake-input');
    const stake=parseFloat(i?.value)||0;
    const combo=betTicket.reduce((a,s)=>a*s.odd,1);
    return{selections:[...betTicket],stake,combinedOdd:combo,payout:stake*combo,isMultiple:betTicket.length>1};
  }
  function toggleTicket(){
    document.getElementById('bet-ticket').classList.toggle('open');
  }

  // ── SIMULATION ───────────────────────────────────────────
  function showSimulation(tA, tB) {
    showScreen('simulation');
    document.getElementById('sim-content').innerHTML=`
      <div class="sim-wrap">
        <div class="sim-league">🏆 FutValleFC Championship • 2026</div>
        <div class="scoreboard">
          <div class="sb-team"><div class="sb-name">${tA.nome}</div><div class="sb-score" id="sc-a">0</div></div>
          <div class="sb-mid"><div class="sb-min" id="sim-min">0'</div><div class="sb-vs">×</div></div>
          <div class="sb-team"><div class="sb-score" id="sc-b">0</div><div class="sb-name">${tB.nome}</div></div>
        </div>
        <div id="sim-events" class="sim-events"></div>
        <div id="sim-status" class="sim-status">⚽ Partida em andamento...</div>
      </div>`;
  }
  function updateScore(a,b){ document.getElementById('sc-a').textContent=a; document.getElementById('sc-b').textContent=b; }
  function updateMinute(m){ const e=document.getElementById('sim-min'); if(e)e.textContent=m+"'"; }
  function addGoalEvent(team,min,name){
    const ev=document.getElementById('sim-events'); if(!ev)return;
    const d=document.createElement('div'); d.className='goal-ev';
    d.textContent=`⚽ GOL! ${name} – ${min}'`;
    ev.appendChild(d);
    setTimeout(()=>d.classList.add('show'),50);
    const sc=document.getElementById(team==='A'?'sc-a':'sc-b');
    if(sc){sc.classList.add('pulse');setTimeout(()=>sc.classList.remove('pulse'),600);}
  }
  function showResult(sA,sB,won,payout,stake){
    const el=document.getElementById('sim-status'); if(!el)return;
    if(won){el.innerHTML=`<div class="result-win">🏆 VOCÊ GANHOU! +₡${fmt(payout-stake)}</div>`;fireConfetti();}
    else el.innerHTML=`<div class="result-loss">😔 Placar Final ${sA}×${sB} — Tente novamente!</div>`;
  }

  return {
    showScreen, showToast, fireConfetti,
    renderLive, renderMatches, renderCountry, matchCard,
    renderStandings, renderHistory, renderProfile, renderMissions,
    showNicknameModal, hideNicknameModal, getNicknameInput, updateUserDisplay, updateBalanceDisplay,
    addToBetTicket, renderTicket, clearTicket, clearBetTicket, removeSel, addStake, updReturn, getTicketData, toggleTicket,
    showSimulation, updateScore, updateMinute, addGoalEvent, showResult,
    getBetTicket: ()=>betTicket,
  };
})();

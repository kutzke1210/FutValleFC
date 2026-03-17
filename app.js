/* ============================================================
 * FutValleFC – App Controller v2
 * ============================================================ */
const App = (() => {
  let matches = [];
  let standings = {};
  let refreshTimer = null;
  const COUNTRIES = ['Russia','Uzbequistao','Afeganistao','Bielorrussia','Turquia'];

  // ── Generate match list ───────────────────────────────────
  function generateMatches(count = 30) {
    const teams = window.TEAMS;
    if (!teams || !teams.length) return [];
    
    const list = [];
    while (list.length < count) {
      const a = teams[Math.floor(Math.random()*teams.length)];
      const b = teams[Math.floor(Math.random()*teams.length)];
      if (a.id===b.id) continue;
      
      const key = `${a.id}-${b.id}-${Date.now()}-${Math.random()}`; // Unique ID for endless rotation
      const baseOdds = Odds.calcOdds(a.rating, b.rating);
      const hour = Math.floor(Math.random()*24);
      const min  = ['00','15','30','45'][Math.floor(Math.random()*4)];
      
      list.push({
        id: key,
        teamA: a, teamB: b,
        odds: baseOdds, baseOdds,
        matchName: `${a.nome} × ${b.nome}`,
        time: `${String(hour).padStart(2,'0')}:${min}`,
        isLive: Math.random()<0.3,
        createdAt: Date.now()
      });
    }
    return list;
  }

  // ── Generate standings (simulated season) ─────────────────
  function generateStandings() {
    const teams = window.TEAMS;
    if (!teams) return {};
    const grouped = {};
    COUNTRIES.forEach(c => { grouped[c] = []; });
    teams.forEach(t => {
      if (grouped[t.pais]) grouped[t.pais].push(t);
    });

    const result = {};
    Object.entries(grouped).forEach(([country, cTeams]) => {
      // Simulate a mini-season using rating-weighted random results
      const table = cTeams.map(t => ({
        nome: t.nome, rating: t.rating,
        j:0, v:0, e:0, d:0, gp:0, gs:0, pts:0
      }));
      // Each team plays 8 simulated games
      for (let round=0; round<8; round++) {
        for (let i=0; i<table.length; i++) {
          const j = Math.floor(Math.random()*table.length);
          if (i===j) continue;
          const tA=table[i], tB=table[j];
          const expA=(tA.rating/65)*1.5, expB=(tB.rating/65)*1.5;
          let gA=Simulation.poissonRandom(expA), gB=Simulation.poissonRandom(expB);
          tA.j++; tB.j++;
          tA.gp+=gA; tA.gs+=gB; tB.gp+=gB; tB.gs+=gA;
          if(gA>gB){tA.v++;tA.pts+=3;tB.d++;}
          else if(gA===gB){tA.e++;tB.e++;tA.pts++;tB.pts++;}
          else{tB.v++;tB.pts+=3;tA.d++;}
        }
      }
      table.sort((a,b)=>b.pts-a.pts||(b.gp-b.gs)-(a.gp-a.gs));
      result[country]=table;
    });
    return result;
  }

  // ── Load matches ─────────────────────────────────────────
  function loadMatches() {
    matches = generateMatches();
    UI.renderMatches(matches);
  }

  // ── Refresh odds ─────────────────────────────────────────
  function refreshOdds() {
    if (!matches.length) { loadMatches(); return; }
    matches.forEach(m=>{ m.odds = Odds.jitterOdds(m.baseOdds); });
    const grid = document.getElementById('matches-grid');
    if (grid) grid.innerHTML = matches.map(m=>UI.matchCard(m)).join('');
  }

  function refreshMatchCards() {
    const grid = document.getElementById('matches-grid');
    if (grid) grid.innerHTML = matches.map(m=>UI.matchCard(m)).join('');
  }

  // ── Select bet ────────────────────────────────────────────
  function selectBet(matchId, option, odd, teamName, matchName) {
    UI.addToBetTicket({ matchId, option, odd, teamName, matchName });
    const tk = document.getElementById('bet-ticket');
    if (tk && window.innerWidth < 1280) tk.classList.add('open');
    refreshMatchCards();
  }

  // ── Confirm bet ───────────────────────────────────────────
  function confirmBet() {
    const data = UI.getTicketData();
    if (!data.selections.length) { UI.showToast('Selecione uma odd primeiro!'); return; }
    if (data.stake <= 0) { UI.showToast('Digite o valor da aposta!'); return; }
    if (data.stake > Storage.getBalance()) { UI.showToast('Saldo insuficiente!'); return; }
    if (data.stake < 1) { UI.showToast('Aposta mínima: ₡ 1'); return; }

    Storage.setBalance(Storage.getBalance() - data.stake);
    Storage.addWagered(data.stake);
    UI.updateBalanceDisplay();

    // Mission triggers
    Storage.updateMissions('bet_placed').forEach(m=>UI.showToast(`🎯 Missão: ${m.title}! +${m.reward}₡`,'msn',4000));
    Storage.updateMissions('volume').forEach(m=>UI.showToast(`🎯 Missão: ${m.title}! +${m.reward}₡`,'msn',4000));
    if (data.isMultiple) Storage.updateMissions('multiple_bet').forEach(m=>UI.showToast(`🎯 ${m.title}! +${m.reward}₡`,'msn',4000));

    const firstSel = data.selections[0];
    const match = matches.find(m=>m.id===firstSel.matchId);
    if (!match) { UI.showToast('Partida não encontrada. Tente novamente.'); return; }

    document.getElementById('bet-ticket').classList.remove('open');
    UI.clearBetTicket();
    UI.showSimulation(match.teamA, match.teamB);

    Simulation.run(match.teamA, match.teamB, firstSel.option, {
      onGoal: (sA, sB, team, min) => {
        UI.updateScore(sA, sB);
        UI.addGoalEvent(team, min, team==='A'?match.teamA.nome:match.teamB.nome);
      },
      onMinute: m => UI.updateMinute(m),
      onEnd: (sA, sB, won, result) => {
        let payout = 0;
        if (won) {
          // In a multiple, all matches must win. Here we check the others if it's a multiple.
          if (data.isMultiple) {
            const others = data.selections.slice(1);
            const allWin = others.every(s => {
              const m = matches.find(match => match.id === s.matchId);
              // Since we don't have real-time simulation for all, we 'coin-flip' or 
              // check their current rating-based probability for the remaining matches.
              // For simplicity in this simulator, if the first one won, we check the others 
              // by simulating their scores instantly.
              const expA = (m.teamA.rating / 65) * 1.5;
              const expB = (m.teamB.rating / 65) * 1.5;
              const sA = Simulation.poissonRandom(expA);
              const sB = Simulation.poissonRandom(expB);
              const res = sA > sB ? 'A' : sA < sB ? 'B' : 'X';
              return s.option === res;
            });
            if (!allWin) {
              UI.showToast(`Operação Finalizada: Um ou mais jogos na múltipla não bateram.`,'loss',4000);
              Storage.addBetHistory({
                matchName: data.selections.map(s=>s.matchName).join(' | '),
                selections: data.selections,
                combinedOdd: data.combinedOdd,
                stake: data.stake,
                payout: 0,
                won: false,
              });
              UI.updateBalanceDisplay();
              UI.showResult(sA, sB, false, 0, data.stake);
              setTimeout(()=>{ UI.showScreen('live'); renderHome(); loadMatches(); }, 4500);
              return;
            }
          }
          const mods = Storage.getModifiers();
          let multi = 1;
          if (mods.multiplier_x2) multi *= 2;
          if (mods.vip_x2) multi *= 2;
          if (mods.strat_multi) {
            multi *= mods.strat_multi.val;
            // Strategic multiplier accumulates or resets
            const nextVal = Math.min(5, mods.strat_multi.val + 0.5);
            Storage.setModifier('strat_multi', nextVal);
          }
          if (mods.max_risk) {
            multi *= (4 + Math.random() * 2);
            Storage.removeModifier('max_risk');
          }
          
          payout = data.payout * multi;
          Storage.addBalance(payout);
          Storage.updateMissions('bet_won').forEach(m=>UI.showToast(`🎯 ${m.title}! +${m.reward}₡`,'msn',4000));
          UI.showToast(`🏆 Vitória! Retorno de ₡${(payout).toFixed(2)}` + (multi > 1 ? ` (Multi x${multi.toFixed(1)})` : ''),'win',5000);
        } else {
          const mods = Storage.getModifiers();
          if (mods.strat_multi) Storage.removeModifier('strat_multi');
          if (mods.combo_luck_count) {
             const count = (mods.combo_luck_count.val || 0) - 1;
             if (count <= 0) Storage.removeModifier('combo_luck_count');
             else {
               Storage.setModifier('combo_luck_count', count);
               Storage.setModifier('combo_luck', 1.10); // Reduces to 10% on loss
             }
          }
          UI.showToast(`Operação Finalizada: ${sA}×${sB}.`,'loss',4000);
        }
        Storage.addBetHistory({
          matchName: data.selections.map(s=>s.matchName).join(' | '),
          selections: data.selections,
          combinedOdd: data.combinedOdd,
          stake: data.stake,
          payout,
          won,
        });
        UI.updateBalanceDisplay();
        UI.showResult(sA, sB, won, payout, data.stake);
        setTimeout(()=>{ UI.showScreen('live'); renderHome(); loadMatches(); }, 4500);
      },
    });
  }

  // ── Confirm nickname ──────────────────────────────────────
  function confirmNickname() {
    const { nickname } = UI.getNicknameInput();
    if (!nickname || nickname.length < 3) { UI.showToast('O nome deve ter ao menos 3 caracteres'); return; }
    Storage.saveUser({ nickname, avatar: '👤' });
    UI.hideNicknameModal();
    UI.updateUserDisplay();
    UI.showToast(`Bem-vindo, ${nickname}. Seu saldo foi inicializado.`,'msn');
  }

  function redeemPromoCode() {
    const input = document.getElementById('promo-input');
    const result = document.getElementById('promo-result');
    const code = input.value.trim();
    if (!code) return;
    
    const res = Codes.redeem(code);
    result.textContent = res.msg;
    result.style.color = res.success ? 'var(--accent)' : 'var(--loss)';
    if (res.success) {
      input.value = '';
      UI.fireConfetti();
      UI.showToast(res.msg, 'msn');
    }
  }

  // ── Render home/live ─────────────────────────────────────
  function renderHome() {
    UI.renderLive(matches);
    UI.updateUserDisplay();
  }

  // ── Navigation setup ─────────────────────────────────────
  function setupNav() {
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-action]');
      if (!el) return;

      const action = el.dataset.action, target = el.dataset.target;
      if (action === 'screen') {
        UI.showScreen(target);
        if (target==='matches') loadMatches();
        if (target==='standings') UI.renderStandings(standings);
        if (target==='history') UI.renderHistory();
        if (target==='profile') UI.renderProfile();
        if (target==='missions') UI.renderMissions();
        if (target==='codes') { document.getElementById('promo-result').textContent = ''; }
        if (target==='live') renderHome();
      } else if (action === 'country') {
        UI.showScreen('country');
        UI.renderCountry(target, matches);
        // Sync sidebar
        document.querySelectorAll('[data-action="country"]').forEach(b=>b.classList.toggle('active',b.dataset.target===target));
      }
      
      // Close sidebar on mobile after action
      if (window.innerWidth < 900) {
        const sb = document.getElementById('sidebar');
        if (sb) sb.classList.remove('open');
      }
    });

    // Sidebar toggle (mobile)
    const sbTgl = document.getElementById('sb-toggle');
    if (sbTgl) sbTgl.addEventListener('click', ()=>{
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  // ── Init ─────────────────────────────────────────────────
  async function init() {
    Storage.initDefaults();
    await Data.load();

    matches = generateMatches();
    standings = generateStandings();

    // Check if user has nickname
    const user = Storage.getUser();
    if (!user || !user.nickname) {
      UI.showNicknameModal();
    } else {
      UI.updateUserDisplay();
    }

    renderHome();
    UI.renderTicket();
    setupNav();

    // Endless rotation loop: Every 30s, update live status and maybe replace some matches.
    refreshTimer = setInterval(()=>{
      // Jitter existing odds
      matches.forEach(m => { m.odds = Odds.jitterOdds(m.baseOdds); });
      
      // Randomly expire 1-2 old matches and add new ones to keep the "action" going
      if (Math.random() < 0.3 && matches.length > 20) {
        matches.splice(Math.floor(Math.random()*matches.length), 1);
        matches.push(...generateMatches(1));
      }
      
      const sc = document.querySelector('.screen:not(.hidden)');
      if (sc && (sc.id==='screen-matches'||sc.id==='screen-live')) {
        if (sc.id==='screen-matches') UI.renderMatches(matches);
        else renderHome();
      }
    }, 30000);
  }

  return { init, loadMatches, refreshOdds, selectBet, confirmBet, confirmNickname, redeemPromoCode, refreshMatchCards, renderHome };
})();

document.addEventListener('DOMContentLoaded', ()=>App.init());

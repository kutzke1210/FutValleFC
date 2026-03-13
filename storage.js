/* ============================================================
 * FutValleFC – Storage Module
 * Toda persistência via localStorage
 * ============================================================ */
const Storage = (() => {
  const K = {
    balance: 'futv_balance',
    history: 'futv_history',
    missions: 'futv_missions',
    missDate: 'futv_miss_date',
    wagered: 'futv_wagered',
    user: 'futv_user',
  };

  const DEFAULT_MISSIONS = [
    { id:1, title:'Aposte 5 vezes',             icon:'🎯', target:5, current:0, reward:300,  done:false },
    { id:2, title:'Ganhe uma aposta',            icon:'🏆', target:1, current:0, reward:500,  done:false },
    { id:3, title:'Tente 3 partidas diferentes', icon:'⚽', target:3, current:0, reward:200,  done:false },
    { id:4, title:'Faça uma aposta múltipla',    icon:'🎰', target:1, current:0, reward:400,  done:false },
    { id:5, title:'Aposte 1000 créditos total',  icon:'💰', target:1000, current:0, reward:600, done:false, isVolume:true },
  ];



  // ─── Inicialização ───────────────────────────────────────
  function initDefaults() {
    if (localStorage.getItem(K.balance) === null) localStorage.setItem(K.balance,'5000.00');
    if (!localStorage.getItem(K.history))  localStorage.setItem(K.history,'[]');
    if (!localStorage.getItem(K.wagered))  localStorage.setItem(K.wagered,'0');
    resetMissionsIfNewDay();
  }

  // ─── Saldo ───────────────────────────────────────────────
  function getBalance()      { return parseFloat(localStorage.getItem(K.balance)||'5000'); }
  function setBalance(n)     { localStorage.setItem(K.balance, Math.max(0,n).toFixed(2)); }
  function addBalance(amt)   { setBalance(getBalance()+amt); }

  // ─── Histórico ───────────────────────────────────────────
  function getBetHistory() {
    try { return JSON.parse(localStorage.getItem(K.history)||'[]'); } catch { return []; }
  }
  function addBetHistory(bet) {
    const h = getBetHistory();
    h.unshift({...bet, timestamp: Date.now()});
    if (h.length > 100) h.splice(100);
    localStorage.setItem(K.history, JSON.stringify(h));
  }

  // ─── Volume apostado ──────────────────────────────────────
  function getTotalWagered()  { return parseFloat(localStorage.getItem(K.wagered)||'0'); }
  function addWagered(amt)    { localStorage.setItem(K.wagered,(getTotalWagered()+amt).toFixed(2)); }

  // ─── Nível do jogador ────────────────────────────────────
  function getPlayerLevel() {
    const w = getTotalWagered();
    if (w < 1000)  return { level:1, name:'Novato',      icon:'🌱', next:1000,  progress: w/1000  };
    if (w < 5000)  return { level:2, name:'Apostador',   icon:'🎮', next:5000,  progress: w/5000  };
    if (w < 15000) return { level:3, name:'Especialista',icon:'⚡', next:15000, progress: w/15000 };
    if (w < 40000) return { level:4, name:'Mestre',      icon:'👑', next:40000, progress: w/40000 };
    return                 { level:5, name:'Lendário',   icon:'🔱', next:null,  progress: 1       };
  }

  // ─── Missões ──────────────────────────────────────────────
  function resetMissionsIfNewDay() {
    const today = new Date().toDateString();
    if (localStorage.getItem(K.missDate) !== today) {
      localStorage.setItem(K.missions, JSON.stringify(DEFAULT_MISSIONS));
      localStorage.setItem(K.missDate, today);
    }
  }
  function getMissions() {
    try { return JSON.parse(localStorage.getItem(K.missions)||JSON.stringify(DEFAULT_MISSIONS)); }
    catch { return JSON.parse(JSON.stringify(DEFAULT_MISSIONS)); }
  }
  function saveMissions(m) { localStorage.setItem(K.missions, JSON.stringify(m)); }

  /**
   * Atualiza progresso das missões.
   * event: 'bet_placed' | 'bet_won' | 'multiple_bet' | 'volume'
   * @returns {Array} missões completadas nesta rodada
   */
  function updateMissions(event, extra={}) {
    const missions = getMissions();
    const completed = [];
    missions.forEach(m => {
      if (m.done) return;
      let hit = false;
      if (m.isVolume && event==='volume') {
        m.current = Math.min(getTotalWagered(), m.target);
        hit = true;
      } else if (!m.isVolume) {
        if ((event==='bet_placed') && (m.id===1||m.id===3)) { m.current = Math.min(m.current+1, m.target); hit=true; }
        if ((event==='bet_won')    && m.id===2)              { m.current = Math.min(m.current+1, m.target); hit=true; }
        if ((event==='multiple_bet')&&m.id===4)              { m.current = Math.min(m.current+1, m.target); hit=true; }
      }
      if (hit && m.current >= m.target) {
        m.done = true;
        addBalance(m.reward);
        completed.push(m);
      }
    });
    saveMissions(missions);
    return completed;
  }



  // ─── Perfil do usuário (apelido, avatar) ──────────────────
  function saveUser(data) {
    localStorage.setItem(K.user, JSON.stringify({ ...data, savedAt: Date.now() }));
  }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(K.user)||'null'); } catch { return null; }
  }

  return {
    initDefaults, getBalance, setBalance, addBalance,
    getBetHistory, addBetHistory,
    getTotalWagered, addWagered,
    getPlayerLevel,
    getMissions, resetMissionsIfNewDay, updateMissions,

    saveUser, getUser,
  };
})();

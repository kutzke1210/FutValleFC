/* ============================================================
 * FutValleFC – Codes & Rewards Module
 * Logic for the 10 complex promo codes.
 * ============================================================ */
const Codes = (() => {

  const PROMO_CODES = {
    '837462': (u, lvl) => {
      const amt = 100 + Math.floor(Math.random() * 401);
      Storage.addBalance(amt);
      let msg = `Recebeu ₡ ${amt.toFixed(2)}!`;
      if (Math.random() < 0.2) {
        Storage.setModifier('multiplier_x2', 2, 5 * 60 * 1000);
        msg += " + Multiplicador x2 Ativado por 5 min!";
      }
      return { success: true, msg };
    },
    '911177': (u, lvl) => {
      const hist = Storage.getBetHistory();
      const today = new Date().toDateString();
      const betsToday = hist.filter(b => new Date(b.timestamp).toDateString() === today).length;
      let amt = betsToday * 50;
      if (betsToday > 50) amt *= 1.5;
      Storage.addBalance(amt);
      return { success: true, msg: `Jackpot Progressivo! Recebeu ₡ ${amt.toFixed(2)} based on ${betsToday} bets.` };
    },
    '246801': (u, lvl) => {
      Storage.setModifier('strat_multi', 2.5);
      return { success: true, msg: "Próxima aposta ganha x2.5 acumulativo!" };
    },
    '314159': (u, lvl) => {
      // For simplicity, a direct reward for now, can be expanded to UI spin
      const rewards = [200, 500, 1000, "X3_BOOST", "MISSION_SKIP"];
      const r = rewards[Math.floor(Math.random() * rewards.length)];
      if (typeof r === 'number') Storage.addBalance(r);
      return { success: true, msg: `Lucky Spin: Ganhou ${r}!` };
    },
    '999888': (u, lvl) => {
      const amt = 1000 + Math.floor(Math.random() * 4001);
      Storage.addBalance(amt);
      Storage.setModifier('luck_max', 1, 10 * 60 * 1000);
      return { success: true, msg: `JACKPOT MÁXIMO! +₡ ${amt.toFixed(2)} + Modo Sorte Ativado!` };
    },
    '271828': (u, lvl) => {
      // Reset missions as a "new day" event
      localStorage.removeItem('futv_miss_date');
      Storage.resetMissionsIfNewDay();
      return { success: true, msg: "Evento Secreto: Missões diárias resetadas!" };
    },
    '8675309': (u, lvl) => {
      if (lvl.level < 5) return { success: false, msg: "Necessário nível 5 para este código." };
      Storage.addBalance(200);
      Storage.setModifier('vip_x2', 2, 15 * 60 * 1000);
      return { success: true, msg: "Bônus VIP: ₡ 200 + Multiplicador x2 Ativado por 15 min!" };
    },
    '112358': (u, lvl) => {
      Storage.setModifier('combo_luck', 1.25);
      Storage.setModifier('combo_luck_count', 5);
      return { success: true, msg: "Combo de Sorte: Próximas 5 apostas com +25% chance!" };
    },
    '404040': (u, lvl) => {
      Storage.addBalance(404);
      return { success: true, msg: "Easter Egg: Ganhou ₡ 404!" };
    },
    '246012': (u, lvl) => {
      Storage.setModifier('max_risk', 1);
      return { success: true, msg: "Risco Máximo Ativado: Potencial x4-x6 na próxima aposta!" };
    }
  };

  function redeem(code) {
    const used = Storage.getUsedCodes();
    if (used.includes(code)) return { success: false, msg: "Código já utilizado." };

    const action = PROMO_CODES[code];
    if (action) {
      const res = action(Storage.getUser(), Storage.getPlayerLevel());
      if (res.success) {
        Storage.addUsedCode(code);
        UI.updateBalanceDisplay();
      }
      return res;
    }
    return { success: false, msg: "Código inválido." };
  }

  return { redeem };
})();

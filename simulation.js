/* ============================================================
 * FutValleFC – Simulation Module
 *
 * Algoritmo Poisson para gols:
 *   expectedGoals = (rating / 65) * 1.85
 *   poissonRandom(λ): amostragem inversa padrão
 *
 * A simulação dura entre 20 e 45 segundos com placar animado.
 * ============================================================ */
const Simulation = (() => {
  let _running = false;
  let _timers  = [];

  /**
   * Gera número aleatório com distribuição de Poisson.
   * @param {number} lambda - média de gols esperada
   * @returns {number} número de gols
   */
  function poissonRandom(lambda) {
    const L = Math.exp(-lambda);
    let p = 1.0, k = 0;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }

  /**
   * Executa a simulação completa de uma partida.
   *
   * @param {Object} teamA      - { nome, rating }
   * @param {Object} teamB      - { nome, rating }
   * @param {string} selection  - 'A' | 'X' | 'B'
   * @param {Object} cbs        - { onGoal(sA,sB,team,min), onMinute(min), onEnd(sA,sB,won,result) }
   */
  function run(teamA, teamB, selection, cbs) {
    if (_running) return;
    _running = true;
    _timers = [];

    const { onGoal, onMinute, onEnd } = cbs;

    // Gols esperados pela fórmula especificada
    let expA = (teamA.rating / 65) * 1.85;
    let expB = (teamB.rating / 65) * 1.85;

    // Apply Luck Modifiers from Storage
    if (typeof Storage !== 'undefined') {
      const mods = Storage.getModifiers();
      let luck = 1.0;
      if (mods.luck_max) luck = 2.0;
      else if (mods.combo_luck) luck = mods.combo_luck.val;

      if (luck > 1.0) {
        if (selection === 'A') expA *= luck;
        else if (selection === 'B') expB *= luck;
        else if (selection === 'X') { expA *= (luck * 0.8); expB *= (luck * 0.8); }
      }
    }

    const finalA = poissonRandom(expA);
    const finalB = poissonRandom(expB);

    // Duração: 20–45 segundos
    const duration = 20000 + Math.random() * 25000;

    // ── Gera momentos aleatórios para os gols ──────────────
    const events = [];
    const spread = (n, team) => {
      for (let i = 0; i < n; i++) {
        events.push({
          team,
          minute: Math.floor(Math.random() * 90) + 1,
          time: duration * 0.05 + Math.random() * duration * 0.90,
        });
      }
    };
    spread(finalA, 'A');
    spread(finalB, 'B');
    events.sort((a,b) => a.time - b.time);

    const startTime = Date.now();
    let scoreA = 0, scoreB = 0;

    // ── Contador de minutos (a cada 500ms) ─────────────────
    const minTimer = setInterval(() => {
      if (!_running) return clearInterval(minTimer);
      const elapsed  = Date.now() - startTime;
      const simMin   = Math.min(90, Math.floor((elapsed / duration) * 90));
      if (onMinute) onMinute(simMin);
    }, 500);
    _timers.push(minTimer);

    // ── Agenda eventos de gol ──────────────────────────────
    events.forEach(ev => {
      const t = setTimeout(() => {
        if (!_running) return;
        if (ev.team === 'A') scoreA++; else scoreB++;
        if (onGoal) onGoal(scoreA, scoreB, ev.team, ev.minute);
      }, ev.time);
      _timers.push(t);
    });

    // ── Fim da partida ─────────────────────────────────────
    const endTimer = setTimeout(() => {
      clearInterval(minTimer);
      _running = false;
      const result = scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'X';
      const won    = selection === result;
      if (onEnd) onEnd(scoreA, scoreB, won, result);
    }, duration);
    _timers.push(endTimer);
  }

  function stop() {
    _running = false;
    _timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    _timers = [];
  }

  return { run, stop, poissonRandom };
})();

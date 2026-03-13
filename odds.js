/* ============================================================
 * FutValleFC – Odds Module
 *
 * Algoritmo:
 *   1. Probabilidade Elo: P(A) = 1 / (1 + 10^(-diff/400))
 *   2. Empate fixo: P(X) = 0.28 (média real do futebol)
 *   3. House edge ~6%: odd = (1/prob) * 1.06
 *   4. Odd mínima garantida: 1.30
 * ============================================================ */
const Odds = (() => {
  const HOUSE_EDGE = 1.06;
  const PROB_DRAW  = 0.28;
  const MIN_ODD    = 1.30;

  /**
   * Calcula odds 1X2 para uma partida.
   * @param {number} rA - rating do Time A
   * @param {number} rB - rating do Time B
   * @returns {{ oddA, oddX, oddB, probA, probB }}
   */
  function calcOdds(rA, rB) {
    const diff = rA - rB;
    // Fórmula Elo simplificada
    const probA = 1 / (1 + Math.pow(10, -diff / 400));
    const probB = 1 - probA;

    const oddA = Math.max(MIN_ODD, +((1/probA) * HOUSE_EDGE).toFixed(2));
    const oddX = Math.max(MIN_ODD, +((1/PROB_DRAW) * HOUSE_EDGE).toFixed(2));
    const oddB = Math.max(MIN_ODD, +((1/probB) * HOUSE_EDGE).toFixed(2));

    return { oddA, oddX, oddB, probA, probB };
  }

  /**
   * Varia levemente uma odd (±pct) para simular mercado ao vivo.
   * @param {number} odd - valor base
   * @param {number} pct - variação máxima (padrão 5%)
   */
  function jitter(odd, pct = 0.05) {
    const factor = 1 + (Math.random() * 2 - 1) * pct;
    return Math.max(MIN_ODD, +(odd * factor).toFixed(2));
  }

  /** Aplica jitter em todo o objeto de odds */
  function jitterOdds(o) {
    return { ...o, oddA: jitter(o.oddA), oddX: jitter(o.oddX), oddB: jitter(o.oddB) };
  }

  return { calcOdds, jitter, jitterOdds };
})();

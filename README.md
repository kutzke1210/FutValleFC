# FutValleFC – Simulador de Apostas Esportivas ⚽

> **100% fictício e educativo.** Sem dinheiro real. Moedas virtuais apenas.

---

## 🚀 Como rodar localmente

```bash
# Opção recomendada: servidor local (evita CORS no fetch do JSON)
npx serve .
# Acesse: http://localhost:3000

# Alternativa Python:
python -m http.server 8080
# Acesse: http://localhost:8080
```

> ⚠️ Abrir `index.html` diretamente pelo duplo-clique pode dar erro de CORS no `fetch('jogadores.json')`. Use um servidor local.

---

## 🎮 Funcionalidades

| Recurso | Descrição |
|---|---|
| Saldo virtual | 5.000 créditos iniciais (localStorage) |
| 168 times | 5 países: Russia, Uzbequistão, Afeganistão, Bielorrússia, Turquia |
| Odds 1X2 | Elo + house edge 6%, mínimo 1.30 |
| Aposta simples e múltipla | Até 5 seleções com odd combinada |
| Simulação Poisson | 20–45 s, placar animado com eventos de gol |
| Confete dourado 🎉 | Dispara ao ganhar |
| Histórico | Últimas 100 apostas |
| Nível do jogador | 5 níveis por volume apostado |
| Missões diárias | Reset automático à meia-noite |
| Leaderboard | Top 10 fictício |
| Refresh automático | Odds variam ±5% a cada 45 s |
| Mobile-first | Funciona de 320px a monitores 4K |

---

## 🧮 Algoritmo de Odds

```js
// 1. Rating do time
teamRating = (overallMedio * 0.80) + (idadeMedia * 0.20)

// 2. Probabilidades via Elo
diff  = ratingA - ratingB
probA = 1 / (1 + Math.pow(10, -diff / 400))
probB = 1 - probA
probX = 0.28  // média real de empates no futebol

// 3. Aplicar house edge (~6%) e mínimo 1.30
oddA = Math.max(1.30, (1/probA) * 1.06)
oddX = Math.max(1.30, (1/probX) * 1.06)  // ≈ 3.79
oddB = Math.max(1.30, (1/probB) * 1.06)

// 4. Jitter de mercado (±5% a cada refresh)
odd = odd * (1 + (Math.random()*2 - 1) * 0.05)
```

## ⚽ Simulação Poisson

```js
// Gols esperados por time
expectedA = (ratingA / 65) * 1.85
expectedB = (ratingB / 65) * 1.85

// Amostragem Poisson (inversa)
function poissonRandom(lambda) {
  let L = Math.exp(-lambda), p = 1.0, k = 0;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}
```

---

## 📁 Estrutura

```
FUTVALLEFC/
├── index.html        # SPA principal
├── jogadores.json    # 168 times × 11 jogadores
├── css/style.css     # Design premium cinza + neon verde
├── js/
│   ├── storage.js    # localStorage
│   ├── odds.js       # Cálculo Elo + house edge
│   ├── simulation.js # Simulação Poisson
│   ├── data.js       # Processamento dos times
│   ├── ui.js         # Renderização
│   └── app.js        # Controller
└── README.md
```

---

## 🌐 Deploy GitHub Pages

1. Crie repositório público no GitHub
2. Faça push de todos os arquivos
3. Settings → Pages → Source: **main / root**
4. Acesse: `https://seu-usuario.github.io/FUTVALLEFC/`

---

*FutValleFC © 2026 – Eduardo Kutzke | Projeto educativo*

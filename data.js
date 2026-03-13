/* ============================================================
 * FutValleFC – Data Module
 *
 * Carrega jogadores.json, agrupa por time_id,
 * calcula overallMedio e idadeMedia, gera nomes criativos
 * e produz window.TEAMS com o array final de times.
 *
 * Rating: teamRating = (overallMedio*0.80) + (idadeMedia*0.20)
 * ============================================================ */
const Data = (() => {

  // ── Apenas os 5 países da lista original ───────────────────
  const NAMES_BY_COUNTRY = {
    'Russia':       ['Spartak Volga','Dynamo Novosk','CSKA Ural','Zenit Baikal','Lokomotiv Sibir','Torpedo Moskva','Rubin Kasan','FK Samara','Amkar Perm','Arsenal Tula','Krylia Sovetov','FK Ufa','Tambov FC','Kamaz FK','Tosno FC','Orenburg FC','Neftekhimik','FK Chita','Metallurg FC','Enisei FC','Luch Vladivostok','Kuban Krasnodar','Shinnik FC','Khimki FC','Zenit-2 FC','Spartak-2 FC','Dynamo-2 FC','CSKA-2 FC','Lokomotiv-2 FC','Torpedo-2 FC'],
    'Uzbequistao':  ['Pakhtakor SC','Nasaf FC','Bunyodkor FC','Lokomotiv Tash','Navbahor FC','AGMK FC','FC Andijan','Surkhon FC','Sogdiana FC','Shurtan FC','Metallurg UZ','Neftchi FC','Dinamo Sam','FK Kokand','Turan FC','Kyzylqum FC','FC Qarshi','Bobur FC','Buxoro FC','Mubarek FK','Olimpik UZ','Yangi FC','Mashal FC','Hamkor FC'],
    'Afeganistao':  ['Kabul United','Herat Stars','Kandahar FC','Mazar Falcons','Jalalabad XI','Kunduz Wolves','Ghazni Eagles','Bamyan FC','Khost Rovers','Baghlan City','Nimroz Desert','Badakhshan FC','Logar Lions','Paktia FC','Ghor FC','Nuristan FC','Panjshir FC','Samangan FC','Farah FC','Hilmand FC','Takhar FC','Faryab FC','Sripul FC','Zabul FC'],
    'Bielorrussia': ['Dinamo Minsk','BATE Borisov','Torpedo Grodno','Shakhter Soligorsk','Isloch Minsk','Neman Grodno','Gorodeya FC','Vitebsk FC','Slavia Mozyr','Energetik BGU','Minsk FC','Smolevichi FC','Rukh Brest','Belshina FC','Naftan FC','Granit FC','Vedrich FC','Krumkachy FC','Lida FC','Lokomotiv Brest','Spartak Brest','Zvezda Minsk','Dnepr Mogilev','Zaria FC'],
    'Turquia':      ['Galata FC','Trabzon United','Besiktas City','Ankaragucu FC','Sivasspor FC','Konyaspor FC','Fenerbahce B','Kasimpasa FC','Kayserispor','Giresunspor','Hatayspor','Rizespor','Alanyaspor','Basaksehir B','Goztepe FC','Altay Izmir','Erzurumspor','Adanaspor','Bursaspor','Eskisehir FC','Boluspor','Samsunspor','Antalyaspor','Istanbulspor','Umraniyespor'],
  };

  // Nomes para geração sintética dos 5 países originais
  const GEN_NAMES = {
    russia:     ['Ivan','Alexei','Dmitri','Pavel','Sergey','Nikolai','Boris','Andrei','Viktor','Yuri','Stanislav','Kirill','Oleg','Roman','Anton','Maxim','Evgeny','Igor','Fedor','Stepan'],
    uzbekistan: ['Jasur','Rustam','Sherzod','Bahodir','Odil','Mirzo','Farhod','Jahongir','Umid','Aziz','Daler','Murod','Islom','Sardor','Oybek','Said','Ravshan','Nodir','Shavkat','Azizbek'],
    afghanistan:['Ahmad','Rashid','Khalid','Wahid','Sami','Karim','Habib','Fayez','Nawid','Ramin','Omid','Hamid','Ibrahim','Asad','Bilal','Haroon','Shahbaz','Feroz','Samir','Yasin'],
    belarus:    ['Pavel','Andrei','Viktor','Dmitri','Evgeny','Sergei','Nikolay','Anton','Vladimir','Oleg','Kirill','Denis','Maxim','Fedor','Igor','Yuri','Leonid','Vadim','Roman','Grigori'],
    turkey:     ['Mehmet','Ahmet','Mert','Burak','Deniz','Arda','Hakan','Kerem','Furkan','Baran','Selim','Kaan','Yigit','Volkan','Orhan','Taylan','Alperen','Tunç','Ozan','Tuncay'],
  };

  const SURNAMES = {
    russia:     ['Petrov','Ivanov','Sokolov','Volkov','Smirnov','Fedorov','Kuznetsov','Kovalev','Morozov','Nikolaev','Zhukov','Bogdanov','Medvedev','Klimov','Baranov','Orlov','Tikhonov','Gavrilov','Andreev','Stepanov'],
    uzbekistan: ['Karimov','Tashkentov','Mirzaev','Rakhimov','Davronov','Yusupov','Olimov','Sattorov','Abdullayev','Saidov','Fazilov','Zokirov','Ilkhomov','Kurbanov','Muminov','Tursunov','Akbarov','Rahimov','Bekmurodov','Nazarov'],
    afghanistan:['Ahmadi','Nazari','Karimi','Haqmal','Samadi','Wardak','Osmani','Karzai','Noorzai','Rahimi','Habibi','Qadiri','Sadiqi','Majidi','Azizi','Barakzai','Zadran','Rashidi','Mohammadi','Esmat'],
    belarus:    ['Kovalev','Klimov','Korolev','Karpov','Tikhonov','Ivanenko','Shevchenko','Melnik','Kuzmin','Moroz','Bogdanov','Vasiliev','Antonov','Belov','Novik','Kalashnikov','Orlov','Pavlov','Solovyov','Mikhailov'],
    turkey:     ['Yilmaz','Kaya','Celik','Demir','Arslan','Ozturk','Çelik','Günel','Karaman','Toprak','Dogan','Aksoy','Kilic','Başar','Korkmaz','Aydin','Karaca','Aslan','Kurt','Bayraktar'],
  };

  const COUNTRY_TO_KEY = {
    'Russia':'russia','Uzbequistao':'uzbekistan','Afeganistao':'afghanistan',
    'Bielorrussia':'belarus','Turquia':'turkey',
  };

  function getLangKey(pais) { return COUNTRY_TO_KEY[pais] || 'russia'; }

  function rnd(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

  function generatePlayer(timeId, pais, posicao) {
    const lk = getLangKey(pais);
    const overall = 56 + Math.floor(Math.random()*20);
    return {
      time_id: timeId,
      nome: `${rnd(GEN_NAMES[lk])} ${rnd(SURNAMES[lk])}`,
      pais,
      posicao,
      idade: 17 + Math.floor(Math.random()*20),
      overall,
    };
  }

  function generateTeamPlayers(timeId, pais) {
    const positions = ['GK','DF','DF','DF','DF','MF','MF','MF','MF','FW','FW'];
    return positions.map(pos => generatePlayer(timeId, pais, pos));
  }

  // ── Times sintéticos: apenas os 5 países originais ─────────
  // Distribui IDs 105–168 (64 times) entre os 5 países
  const ORIG_COUNTRIES = ['Russia','Uzbequistao','Afeganistao','Bielorrussia','Turquia'];
  const SYNTHETIC_TEAMS = Array.from({length:64}, (_,i) => ({
    id:  105 + i,
    pais: ORIG_COUNTRIES[i % ORIG_COUNTRIES.length],
  }));

  /**
   * Constrói o array final de times a partir dos jogadores.
   * @param {Array} players - array do jogadores.json
   * @returns {Array} TEAMS
   */
  function buildTeams(players) {
    // Agrupa por time_id
    const map = {};
    players.forEach(p => {
      if (!map[p.time_id]) map[p.time_id] = [];
      map[p.time_id].push(p);
    });

    // Adiciona times sintéticos ausentes (105–168)
    SYNTHETIC_TEAMS.forEach(st => {
      if (!map[st.id]) {
        map[st.id] = generateTeamPlayers(st.id, st.pais);
      }
    });

    // Garante que times 1–104 existam (caso JSON esteja vazio ou incompleto)
    for (let id=1; id<=104; id++) {
      if (!map[id]) {
        const pais = ORIG_COUNTRIES[(id-1) % ORIG_COUNTRIES.length];
        map[id] = generateTeamPlayers(id, pais);
      }
    }

    // Converte mapa em array de times
    const teams = Object.entries(map).map(([id, ps]) => {
      const idNum = parseInt(id);
      const pais  = ps[0].pais;
      const overallMedio = ps.reduce((s,p)=>s+p.overall,0)/ps.length;
      const idadeMedia   = ps.reduce((s,p)=>s+p.idade,0)/ps.length;

      // Rating: especificado no projeto
      const rating = (overallMedio * 0.80) + (idadeMedia * 0.20);

      // Nome criativo baseado no país
      const namelist = NAMES_BY_COUNTRY[pais] || [];
      const offset   = (idNum - 1) % Math.max(1, namelist.length);
      const nome     = namelist[offset] || `${pais} FC ${idNum}`;

      return { id:idNum, nome, pais, overallMedio, idadeMedia, rating, jogadores:ps };
    });

    return teams.sort((a,b)=>a.id-b.id);
  }

  /** Carrega jogadores.json e inicializa window.TEAMS */
  async function load() {
    try {
      const res     = await fetch('jogadores.json');
      const players = await res.json();
      window.TEAMS  = buildTeams(players);
    } catch (e) {
      console.warn('Erro ao carregar jogadores.json – gerando times sintéticos.', e);
      // Fallback: gera todos os 168 times sinteticamente (só países originais)
      const allPlayers = [];
      const countries  = ['Russia','Uzbequistao','Afeganistao','Bielorrussia','Turquia'];
      for (let id=1; id<=168; id++) {
        const pais = countries[(id-1) % countries.length];
        generateTeamPlayers(id, pais).forEach(p => allPlayers.push(p));
      }
      window.TEAMS = buildTeams(allPlayers);
    }
    return window.TEAMS;
  }

  return { load, buildTeams };
})();

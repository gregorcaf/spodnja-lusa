// All player-facing game text (Slovenian). All characters, places and companies are fictional.
// Template tokens: {loc} {Loc} {what} {whatGen} {from} {homeName}
// and {male form|female form} for grammatical gender.

export const MUNICIPALITY = 'Naša občina';
export const NEIGHBOR = { name: 'Zgornje Žlampe', loc: 'v Zgornjih Žlampah' };

export const MONTHS = [
  'januar', 'februar', 'marec', 'april', 'maj', 'junij',
  'julij', 'avgust', 'september', 'oktober', 'november', 'december',
];

export const BUILDINGS = {
  road: { name: 'Cesta', what: 'novo cesto', short: 'cesta' },
  house: { name: 'Hiša', what: 'novo hišo', short: 'hiša' },
  roundabout: { name: 'Krožišče', what: 'krožišče', short: 'krožišče' },
  firehouse: { name: 'Gasilski dom', what: 'gasilski dom', short: 'gasilski dom' },
  hall: { name: 'Večnamenska dvorana', what: 'večnamensko dvorano', short: 'večnamenska dvorana' },
  church: { name: 'Cerkev', what: 'cerkev', short: 'cerkev' },
};

export const TOOL_INFO = {
  inspect: { name: 'Opazuj', icon: '🔍', note: 'klik na občana' },
  road: { name: 'Cesta', icon: '🛣️', note: 'na travnik' },
  house: { name: 'Hiša', icon: '🏠', note: 'prinaša davke' },
  roundabout: { name: 'Krožišče', icon: '⭕', note: 'samo na cesto, s kipom' },
  firehouse: { name: 'Gasilski dom', icon: '🚒', note: 'na travnik' },
  hall: { name: 'Večnamenska dvorana', icon: '🏟️', note: 'na travnik' },
  demolish: { name: 'Podiranje', icon: '🚜', note: 'cerkve ne' },
};

export const CHARACTERS = {
  grumbler: ['Večni nergač', 'Večna nergačica'],
  firefighter: ['Prostovoljni gasilec', 'Prostovoljna gasilka'],
  inspector: ['Upokojenec nadzornik', 'Upokojenka nadzornica'],
  commenter: ['Facebook komentator', 'Facebook komentatorka'],
  entrepreneur: ['Mali podjetnik', 'Mala podjetnica'],
  gardener: ['Vrtičkar', 'Vrtičkarica'],
};

// Even indices are male, odd indices female.
export const CITIZEN_NAMES = [
  'Janez Novak', 'Mojca Horvat', 'Jože Kranjc', 'Francka Zupan', 'Lojze Potočnik',
  'Marija Kovačič', 'Franc Mlakar', 'Anica Vidmar', 'Tone Kos', 'Metka Golob',
  'Štefan Turk', 'Pepca Božič', 'Rudi Krajnc', 'Zdenka Zorman', 'Miran Kralj',
  'Vida Hribar', 'Boris Dolenc', 'Nada Petek', 'Silvo Rozman', 'Danica Medved',
  'Marjan Zajc', 'Jožica Kastelic', 'Darko Pirc', 'Branka Oblak', 'Matjaž Žagar',
];

export const THOUGHTS = {
  envy: [
    'Zakaj imajo {loc} {what}, mi pa samo luknje?',
    '{Loc} so dobili {what}. Mi pa? Obljube in en koš za smeti.',
    'Seveda, {loc} ima župan sorodnike.',
    'Če imajo {loc} {what}, hočem jaz dva.',
    'Na seji bom {vprašal|vprašala}, zakaj so {what} postavili {loc} in ne pri nas.',
  ],
  envyGeneric: [
    'Tisti {from} so mi že od nekdaj sumljivi.',
    '{Loc} imajo vedno vse prvi. Že od Marije Terezije.',
  ],
  envyNeighbor: [
    'V Zgornjih Žlampah imajo dražji vrtec. Prav jim je.',
    'Kaj si ti Žlampovci mislijo, da so?',
    'Bolje naša luknja kot njihov asfalt v Zgornjih Žlampah.',
  ],
  lowHappy: [
    'Ta občina gre k vragu. Počasi, ampak zanesljivo.',
    'Še malo, pa se preselim v Zgornje Žlampe. Tam imajo vsaj semafor.',
    'Dvajset let plačujem davke, za kaj? Za eno klop.',
    'Na naslednjih volitvah bom obkrožil{|a} vse kandidate, da bo jasno.',
  ],
  highHappy: [
    'Ne bom {rekel|rekla} na glas, ampak letos je kar v redu.',
    'Župan je dober človek. Kdo bi si mislil.',
    'Danes sem {pozdravil|pozdravila} soseda. Prvič po letu 2009.',
    'Če bo šlo tako naprej, bom nehal{|a} pisati pritožbe. Mogoče.',
  ],
  snow: [
    'Sneg sredi pomladi? To je zagotovo zarota zimske službe.',
    'Paradižniki so zmrznili. Zimska služba pa je zaslužila.',
    'Zimske gume sem {dal|dala} dol včeraj. Seveda.',
  ],
  party: [
    'Še en šnops, pa grem domov. (Ne grem domov.)',
    'Ta ansambel igra isto pesem že tretjič. Super!',
    'Na veselici smo vsi prijatelji. Do ponedeljka.',
    'Gasilci znajo žurati. Gasiti mogoče tudi.',
  ],
  propaganda: [
    'V glasilu piše, da je župan zgradil več kot Rimljani.',
    'Glasilo pravi, da smo najsrečnejša občina. Kdo sem jaz, da bi {oporekal|oporekala}?',
    'Na naslovnici glasila je spet župan. Tokrat s kravo.',
  ],
  character: {
    grumbler: [
      'Včasih je bilo vse boljše. Tudi slabše je bilo boljše.',
      'Spet so nekaj prekopali. Mene seveda nihče ni vprašal.',
      'Tudi če bi asfaltirali z zlatom, bi bil asfalt preveč rumen.',
    ],
    firefighter: [
      'Cisterna je oprana, zdaj manjka samo še požar.',
      'Vaja ob sobotah, golaž ob nedeljah. Tako se gradi skupnost.',
      'Brez gasilcev bi ta vas že zdavnaj pogorela. Ali vsaj ne bi imela veselice.',
    ],
    inspector: [
      'Delavci so imeli danes že tri malice. {Štel|Štela} sem.',
      'Ta jama se koplje že četrti dan. Jaz bi jo v dveh.',
      'Če ne bi jaz {gledal|gledala}, bi ta cesta šla po zlu.',
    ],
    commenter: [
      'Delim, preden zbrišejo!!!',
      'Kdo ve, zakaj ima župan nov avto? Samo vprašam.',
      '{Napisal|Napisala} sem 300 komentarjev in nihče ni nič naredil. Sramota.',
    ],
    entrepreneur: [
      'Če dobim ta razpis, odprem s. p. še za taščo.',
      'Račun brez DDV? Seveda, za domače.',
      'Bratranec ima vse razpise. Moram si najti bratranca.',
    ],
    gardener: [
      'Moji paradižniki so večji od sosedovih. To je glavno.',
      'Polži so letos posebej predrzni.',
      'Županu bi {dal|dala} solato, pa se bojim, da bi jo objavil v glasilu.',
    ],
  },
  general: [
    'Kdaj bodo že pokosili ob cesti?',
    'Bencin je spet dražji. Pa kruh. Pa vse.',
    'A je danes ponedeljek? Se mi je zdelo.',
    'Nekdo je parkiral na mojem mestu pred cerkvijo. Ki sicer ni moje. Ampak vseeno.',
    'Sosed ima nov traktor. Moram ugotoviti, od kod mu denar.',
    'Še vedno pravim, da je {homeName} najlepši konec.',
  ],
};

export const FIXED_NEWS = [
  'Župan ob 10. uri napihal 2 promila. Pojasnilo: »Bil sem na degustaciji v okviru projekta Okusi naše občine.«',
  'Novo krožišče ima štiri izvoze. Vsi vodijo do iste gostilne.',
  'Gasilci so v rekordnih štirih minutah pogasili požar. Gorel je žar pri gasilskem domu.',
  'Francka je prijavila soseda, ker je v nedeljo kosil ob 7.01.',
  'Na razpis za čiščenje snega se je prijavil en sam ponudnik. Ima en plug in tri Audije.',
  'Lojze trdi, da je videl medveda. Medved zanika.',
  'Občinski svet je po treh urah razprave sklenil, da bo o tem razpravljal na naslednji seji.',
  'Luknja na glavni cesti je praznovala peti rojstni dan. Torto so prinesli krajani, župana ni bilo.',
  'Turistično društvo je predstavilo novo znamenitost: tablo, ki opozarja na znamenitost, ki jo še gradijo.',
  'Pevski zbor išče tenorje. Pogoj: da vsaj približno zadenejo ton in na vajo pridejo trezni.',
  'V vaški trgovini je zmanjkalo kruha. Krivca iščejo med tistimi, ki so ga kupili.',
  'Občinska uprava je uvedla e-poslovanje. Obrazec je treba natisniti, izpolniti in prinesti osebno.',
  'Kozolec pri Hribarjevih je razglašen za kulturno dediščino. Hribarjevi bi ga raje podrli in tam parkirali.',
  'V Facebook skupini »Opazili ste v naši občini« je že 400 komentarjev o enem parkiranem avtomobilu.',
  'Lokalna kmetija je dobila evropska sredstva za digitalizacijo. Krava ima zdaj Instagram.',
  'Vremenarji napovedujejo lepo vreme. Vrtičkarji napovedujejo, da se motijo.',
  'Projekt kanalizacije je prestavljen na leto 2031. Iz istega razloga kot leta 2019, 2023 in 2027.',
  'Na avtobusni postaji so namestili novo klop. Avtobus še vedno ne vozi.',
];

export const BUILD_NEWS = {
  road: [
    '{Loc} je zrasla nova cesta. Krajani že sprašujejo, kdaj jo bodo prekopali.',
    'Nova cesta {loc}: deset metrov asfalta, trije govorniki, en trak.',
  ],
  house: [
    '{Loc} je zrasla nova hiša. Sosedje so takoj preverili, ali ima večjo teraso od njihove.',
    'Nova hiša {loc}. Na občino je že prispela prva pritožba zaradi sence.',
  ],
  roundabout: [
    '{Loc} so odprli krožišče. Kip na sredini menda predstavlja »duh skupnosti«, nekoliko pa spominja na župana.',
    'Krožišče {loc}: vozniki krožijo že tretji dan, ker ne vedo, kateri izvoz je pravi.',
  ],
  firehouse: [
    'Nov gasilski dom {loc}. Gasilci pravijo, da je odličen za veselice in, če bo treba, tudi za gašenje.',
    'Gasilski dom {loc} ima novo garažo za cisterno in še večjo za šotor.',
  ],
  hall: [
    '{Loc} so odprli večnamensko dvorano. Namen še iščejo.',
    'Večnamenska dvorana {loc} bo gostila šport, kulturo in predvsem predvolilni shod.',
  ],
};

export const DEMOLISH_NEWS = [
  '{Loc} so podrli {what}. Krajani so na kraj dogodka prinesli sveče in tri pritožbe.',
  'Bager je {loc} odstranil {what}. Upokojenci so delo nadzirali z vso resnostjo.',
  '{Loc} ni več {whatGen}. Na Facebooku so že ustanovili skupino »Vrnite nam {what}«.',
];

export const BUILDING_GENITIVE = {
  road: 'ceste',
  house: 'hiše',
  roundabout: 'krožišča',
  firehouse: 'gasilskega doma',
  hall: 'večnamenske dvorane',
};

export const NO_MONEY = [
  'Ni denarja. Proračun je tanjši od izgovora za zamudo na sejo.',
  'Za to ni denarja. Še bratranec ti ne bi posodil.',
  'Blagajna je prazna. Računovodkinja je odprla že drugo kavo.',
];

export const BUILD_ERRORS = {
  roundaboutNeedsRoad: 'Krožišče gre na cesto. Na travnik ga postaviš šele v drugem mandatu.',
  roundaboutTwice: 'Tu že je krožišče. Krožišče v krožišču bomo preizkusili v tretjem mandatu.',
  occupied: 'Tu že nekaj stoji. Dve stvari na enem mestu gradimo samo v proračunu.',
  church: 'Na cerkev ne gradimo. Župnik ima višje zveze od tebe.',
  demolishChurch: 'Cerkve ni mogoče podreti. Župnik ima boljše zveze kot ti.',
  demolishGrass: 'Travnika ne moreš podreti. Lahko ga kvečjemu pokosiš, ampak ne v nedeljo.',
};

export const LEVER_TEXTS = {
  cousin: {
    name: 'Razpis za bratranca',
    icon: '🤝',
    desc: 'Skrivni račun +12–25 tisoč, tveganje afere +10–18',
    projects: ['obnovo pločnika', 'barvanje klopi', 'svetovanje o svetovanju', 'študijo izvedljivosti študije', 'košnjo občinske trave'],
    companies: ['Bratranec Gradnje d.o.o.', 'Rodbina Inženiring d.o.o.', 'Žlahta in partnerji d.o.o.', 'Svak Consulting s.p.'],
    news: 'Razpis za {project} je dobilo podjetje {company}, katerega lastnik je županov bratranec. Seveda čisto naključje.',
    toast: 'Razpis je zaključen. Skrivni račun +{amount}. Nihče nič ne ve. (Vsi vedo.)',
  },
  praise: {
    name: 'Glasilo: Hvalospevi županu',
    icon: '📰',
    desc: 'Propaganda gor, nergači se razjezijo',
    news: [
      'Izšlo je novo občinsko glasilo. Na 24 straneh je župan omenjen 61-krat, vreme pa enkrat.',
      'Glasilo poroča: župan je osebno zasadil 300 tulipanov. Fotografija prikazuje enega.',
    ],
    toast: 'Glasilo je natisnjeno. Propaganda +{n}.',
  },
  neighbor: {
    name: 'Glasilo: Glejte sosednjo občino!',
    icon: '👉',
    desc: 'Vsem fovšija dol, jeza gre na Zgornje Žlampe',
    news: [
      'Glasilo razkriva: v Zgornjih Žlampah imajo dražji vrtec, slabše ceste in bolj zoprnega župana.',
      'Ekskluzivno: v Zgornjih Žlampah je krožišče, ki ima samo en izvoz. In še ta je zaprt.',
    ],
    toast: 'Občani so se spomnili, da je drugje še slabše. Fovšija −{n}.',
  },
  snow: {
    name: 'Nenadni sneg sredi maja',
    icon: '❄️',
    desc: 'Sreča dol, zimska služba zasluži, mediji pozabijo na afere',
    news: [
      'Sredi pomladi je zapadlo 30 cm snega. Zimska služba je bila nenavadno pripravljena.',
      'Sneg je presenetil vse razen ponudnika zimske službe, ki je pluge naoljil že prejšnji teden.',
    ],
    toast: 'Sneži! Zimska služba zasluži, mediji fotografirajo zasnežene tulipane.',
  },
  party: {
    name: 'Gasilska veselica',
    icon: '🎉',
    desc: 'Vsi na ples k gasilskemu domu. Fovšija dol, sreča gor.',
    news: [
      'Gasilska veselica: ansambel je igral do treh, šotor je stal do štirih, gasilci so stali do petih.',
      'Na veselici so prodali 400 klobas in 900 piv. Gasilska cisterna je bila uporabljena za hlajenje.',
    ],
    toast: 'Veselica pri gasilskem domu! Vsi gremo plesat.',
  },
};

export const LEVER_ERRORS = {
  snowActive: 'Že sneži. Še več snega bi bilo sumljivo celo za zimsko službo.',
  partyActive: 'Veselica je že v teku. Dveh hkrati ne zmore niti ansambel.',
  noFirehouse: 'Brez gasilskega doma ni veselice. Najprej dom, potem šotor.',
};

export const MOOD_LABELS = {
  happy: ['zadovoljen', 'zadovoljna'],
  neutral: ['neodločen', 'neodločena'],
  unhappy: ['nezadovoljen', 'nezadovoljna'],
};

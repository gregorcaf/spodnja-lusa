// All player-facing game text (Slovenian). All characters, places and companies are fictional.
// Template tokens: {loc} {Loc} {what} {whatGen} {from} {homeName}
// and {male form|female form} for grammatical gender.

export const NEIGHBOR = { name: 'Zgornje Žlampe', loc: 'v Zgornjih Žlampah' };

// Names for the newcomers in hamlets (even = male, odd = female). All fictional.
export const NEWCOMER_NAMES = [
  'Albin Gorjup', 'Irena Sever', 'Bojan Rupnik', 'Tatjana Hribernik', 'Stane Jereb', 'Majda Bizjak',
  'Ivo Petrič', 'Saša Žnidaršič', 'Milan Kosmač', 'Polona Pečnik', 'Jure Logar', 'Breda Kovač',
  'Vlado Turnšek', 'Mojca Rozina', 'Ciril Ambrož', 'Darja Kunstelj', 'Peter Mrak', 'Andreja Lipovšek',
  'Rok Zalar', 'Simona Čebulj', 'Aleš Rebolj', 'Katja Gregorič', 'Damjan Pušnik', 'Urška Mohorič',
];

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
  inn: { name: 'Gostilna', what: 'gostilno', short: 'gostilna' },
  factory: { name: 'Tovarna', what: 'tovarno', short: 'tovarna' },
  flats: { name: 'Blok', what: 'blok', short: 'blok' },
  tower: { name: 'Stolpnica', what: 'stolpnico', short: 'stolpnica' },
  clinic: { name: 'Zdravstveni dom', what: 'zdravstveni dom', short: 'zdravstveni dom' },
  police: { name: 'Policijska postaja', what: 'policijsko postajo', short: 'policija' },
  shop: { name: 'Trgovina', what: 'trgovino', short: 'trgovina' },
  vineyard: { name: 'Vinograd', what: 'vinograd', short: 'vinograd' },
  cemetery: { name: 'Pokopališče', what: 'pokopališče', short: 'pokopališče' },
  kindergarten: { name: 'Vrtec', what: 'vrtec', short: 'vrtec' },
  school: { name: 'Osnovna šola', what: 'osnovno šolo', short: 'osnovna šola' },
  highschool: { name: 'Srednja šola', what: 'srednjo šolo', short: 'srednja šola' },
  faculty: { name: 'Fakulteta', what: 'fakulteto', short: 'fakulteta' },
  church: { name: 'Cerkev', what: 'cerkev', short: 'cerkev' },
};

export const TOOL_INFO = {
  inspect: { name: 'Na teren', icon: '🎩', note: 'ljudje · stavbe · sprehod' },
  road: { name: 'Cesta', icon: '🛣️', note: 'povleci' },
  house: { name: 'Hiša', icon: '🏠', note: 'davek' },
  roundabout: { name: 'Krožišče', icon: '⭕', note: 'na cesto' },
  firehouse: { name: 'Gasilski dom', icon: '🚒', note: '' },
  hall: { name: 'Večnamenska dvorana', label: 'Dvorana', icon: '🏟️', note: '' },
  inn: { name: 'Gostilna', icon: '🍺', note: '' },
  factory: { name: 'Tovarna', icon: '🏭', note: 'smrdi' },
  flats: { name: 'Blok', icon: '🏢', note: '5 gospodinjstev' },
  tower: { name: 'Stolpnica', icon: '🏙️', note: '12 gospodinjstev' },
  clinic: { name: 'Zdravstveni dom', label: 'Zdr. dom', icon: '🏥', note: 'malo fovšije' },
  police: { name: 'Policijska postaja', label: 'Policija', icon: '👮', note: 'manj škode' },
  shop: { name: 'Trgovina', icon: '🛒', note: '' },
  vineyard: { name: 'Vinograd', icon: '🍇', note: 'trgatev jeseni' },
  cemetery: { name: 'Pokopališče', icon: '⚰️', note: 'nihče ga ne želi' },
  kindergarten: { name: 'Vrtec', icon: '🧸', note: '1. stopnja' },
  school: { name: 'Osnovna šola', label: 'OŠ', icon: '🏫', note: '2. stopnja' },
  highschool: { name: 'Srednja šola', label: 'Srednja', icon: '📚', note: '3. stopnja' },
  faculty: { name: 'Fakulteta', icon: '🎓', note: '4. stopnja' },
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
  protest: [
    'Kje je denar?!',
    'Bratranca v zapor!',
    'Odstop! Odstop!',
    'Hočemo krožišče brez korupcije!',
    'Danes protestiram, jutri pa spet na kavo k županu.',
    'Transparent sem {napisal|napisala} sam{|a}. Brez razpisa.',
  ],
  riot: [
    'Zdaj je pa dovolj!!!',
    'Gori, gori, gori! (Ampak ne pri meni.)',
    'Kje so zdaj gasilci? Ah, saj so tukaj, z nami.',
    'To je za vse luknje na cesti!',
  ],
  nearFactory: [
    'Spet smrdi iz tovarne. Ampak vsaj proračun diši.',
    'Perila ne morem več sušiti zunaj. Hvala, tovarna.',
    'V tovarni iščejo delavce. Jaz bi {šel|šla}, če ne bi bilo dela.',
  ],
  nearClinic: [
    'Končno imamo zdravstveni dom. Na pregled grem leta 2031.',
    'V čakalnici sem izvedel več kot v trgovini.',
    'Zdravnica mi je rekla, naj manj berem Facebook. Kaj pa ona ve.',
  ],
  nearPolice: [
    'Policija me je ustavila, ker sem peljal prepočasi. Za traktorjem!',
    'Odkar imamo policijo, sosed ne parkira več na mojem dvorišču. Zdaj parkira policija.',
    'Radar pri šoli je nov. Zato vsi vozimo po stari cesti.',
  ],
  nearShop: [
    'V trgovini so rekli, da spet nekaj gradijo. Ne vem, kaj, ampak sem proti.',
    'Kruha spet ni bilo. Zato pa so bile novice.',
    'Prodajalka ve, kaj kdo kupuje. In s kom.',
  ],
  noCemetery: [
    'Kje nas bodo pa pokopali, ko bo čas? V Žlampah?',
    'Občina raste, pokopališča pa ni. Kam bomo, ko bomo šli?',
  ],
  nearInn: [
    'Gremo na eno v gostilno? Samo na eno.',
    'V gostilni imajo nov golaž. Politika pa ista.',
    'Natakarica ve več o občini kot župan.',
  ],
  grudge: [
    'Še vedno čakam. Ampak župan ima čas samo za bratranca.',
    'Obljube, obljube. Na volitvah se bomo pogovarjali.',
    'Nič več ne prosim. Samo še pišem. Na Facebook.',
  ],
  loyal: [
    'Župan drži besedo. Na volitvah vem, koga obkrožim.',
    'Ne bom rekel{|a} nič slabega o županu. Vsaj ne do volitev.',
  ],
  bought: [
    'Za koga bom volil{|a}? Težko vprašanje. Za župana, seveda.',
    'Župan je dober človek. In radodaren. Predvsem radodaren.',
    'Nič nisem dobil{|a}. Nobene kuverte. Zakaj sprašujete?',
  ],
  campaign: [
    'Kampanja je. Župan me je pozdravil kar dvakrat na dan.',
    'Kandidira {opponent}. Hm. Ne vem, ne vem.',
    'Na plakatu je župan videti mlajši. Fotošop ali čudež?',
    'Kdo bo dal več obljub, ta bo dobil moj glas.',
  ],
  highTax: [
    'Davki so spet višji. Kmalu bom plačeval{|a} še za sence na dvorišču.',
    'V Žlampah imajo nižje davke. In slabše ceste. Ampak nižje davke.',
    'Položnica je prišla. Sedel{|a} sem, preden sem jo odprl{|a}.',
  ],
  lowTax: [
    'Davki so nizki. Kdo bo pa plačal ceste? Ah, saj ni moja skrb.',
    'Letos sem s prihranjenim davkom kupil{|a} novo kosilnico. In jo takoj posodil{|a} sosedu.',
  ],
  drunk: [
    'Hik! Še enega za pot!',
    'Ti si moj najboljši prijatelj. Kako ti je že ime?',
    'Kje sem pustil{|a} kolo? Kje sem pustil{|a} hišo?',
    'Ta cesta je bila včeraj bolj ravna.',
    'Župan je car! Hik! Zjutraj bom premislil{|a}.',
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
  'Župan ob 10. uri napihal 2 promila. Pojasnilo: »Bil sem na degustaciji v okviru projekta Okusi {obcine}.«',
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
  'V Facebook skupini »Opazili ste v {obcini}« je že 400 komentarjev o enem parkiranem avtomobilu.',
  'Lokalna kmetija je dobila evropska sredstva za digitalizacijo. Krava ima zdaj Instagram.',
  'Vremenarji napovedujejo lepo vreme. Vrtičkarji napovedujejo, da se motijo.',
  'Projekt kanalizacije je prestavljen na leto 2031. Iz istega razloga kot leta 2019, 2023 in 2027.',
  'Na avtobusni postaji so namestili novo klop. Avtobus še vedno ne vozi.',
  'Občina je kupila nov semafor. Postavili so ga na edino križišče brez prometa, da se v miru navadi.',
  'Upokojenci so ustanovili društvo za nadzor gradbišč. Člani se dobivajo vsak dan ob sedmih, z rokami na hrbtu.',
  'Na oglasni deski pred trgovino visi listek »Najden ključ«. Visi od leta 2014. Ključa nihče ne pogreša.',
  'Gostilničar je kavo podražil za deset centov. Vas je razdeljena na dva tabora, ki ne pijeta več skupaj.',
  'Mežnar je zvonil eno uro prezgodaj. Pol vasi je prišlo k maši, druga polovica na kosilo.',
  'Na seji občinskega sveta je svetnik zaspal in glasoval »za«. Predlog je bil sprejet soglasno.',
  'Domači čebelar je dobil zlato medaljo za med. Sosed trdi, da so čebele njegove.',
  'Trgovina je uvedla samopostrežno blagajno. Prodajalka stoji zraven in pove, kaj je treba stisniti.',
  'Pred šolo so narisali nov prehod za pešce. Po mnenju krajanov je preveč bel.',
  'Krajevna skupnost je za 3.000 evrov naročila študijo, ali je študija potrebna. Odgovor: da.',
  'Na pošti so odprli drugo okence. Odprto je ob sredah, od 10.15 do 10.30.',
  'Domači ansambel je izdal novo zgoščenko. Mama basista jo je kupila dvakrat.',
  'Vaški pes Floki je tretjič zapored izbran za najbolj priljubljenega krajana. Župan je bil spet drugi.',
  'Sosedov petelin je dobil tretji opomin zaradi kikirikanja ob 4.30. Petelin opominov ne bere.',
  'Na igrišču so postavili nov koš. Žoge še niso kupili, ker razpis še teče.',
  'Mlekarna je spremenila embalažo. Babice so prepričane, da je spremenila tudi okus.',
  'Gospod Kranjc že 40 let z iste klopi komentira promet. Občina mu je podelila priznanje za prostovoljno delo.',
  'Najbolj izposojana knjiga v knjižnici je letos »Kako se pritožiti na občino«.',
  'Domača gostilna se hvali z Michelinovo zvezdico. Izkazalo se je, da je nalepka s pnevmatike.',
  'Na glavni cesti so zamenjali luči. Zdaj so tako svetle, da sosedje ponoči berejo časopis brez očal.',
  'Vaška klepetulja je izvedela novico, še preden se je zgodila.',
  'Kmet Jože je s traktorjem 40 minut vozil pred kolono avtomobilov. Pravi, da je imel lep dan.',
  'Na občini so izgubili načrt nove ceste. Ker je cesta že zgrajena, zdaj iščejo, kje točno stoji.',
  'Gasilci so z drevesa reševali mačko. Mačka je sestopila sama, gasilce pa so morali reševati sosedje.',
  'Novi župnik je pridigo skrajšal na 15 minut. Verniki so zaskrbljeni, da je bolan.',
  'Zaživela je nova občinska spletna stran. Prvi dan je imela 14 obiskov, 12 z občine.',
  'Lokalni vplivnež je posnel video o luknji na glavni cesti. Luknja ima zdaj več sledilcev kot občina.',
  'Na zboru krajanov so se dogovorili, da se ne bodo dogovorili.',
  'Uvedli so ločeno zbiranje odpadkov. Sosed Franc vse tri vrečke še vedno odpelje v isti gozd.',
  'Lokalni radio je 24 ur predvajal isto polko. Poslušanost se je podvojila.',
  'Ob igrišču so odprli fitnes na prostem. Najbolj priljubljena naprava je klop zraven.',
  'Gostilna Pri lipi je po 50 letih spremenila jedilnik. Dodali so ričet.',
  'Na vasi so dobili optični internet. Najhitrejši je še vedno ustni.',
  'Šolarji so na natečaju narisali občino prihodnosti. Na vseh risbah je luknja na glavni cesti še vedno tam.',
  'Lovska družina je na lovu ujela predvsem prehlad.',
  'Krajani so zbrali podpise proti novi trafo postaji. Peticijo so natisnili s tiskalnikom, priklopljenim nanjo.',
  'Na pokopališču so uvedli parkirnino. Stalni obiskovalci so ogorčeni, a se ne pritožujejo.',
  'Zgornje Žlampe so dobile nov vodnjak. Pri nas so takoj ustanovili komisijo za ugotavljanje, zakaj mi ne.',
  'Napovedovalec na radiu je ime {obcine} izgovoril narobe. Trikrat. Zadnjič namenoma.',
  'Turistična zveza je {obcino} uvrstila med deset najlepših krajev. Na seznamu je enajst krajev.',
  'Zgornje Žlampe so {obcini} poslale voščilo za praznik. Na kuverti je bil napačen naslov.',
  'Nova spletna stran {obcine} ima 14 podstrani in nobene uporabne informacije.',
  'Na tablo ob vstopu v {obcino} je nekdo dopisal »Dobrodošli. Še.«',
];

/** Ticker news that only fits one season (keys match seasons.js). */
export const SEASON_NEWS = {
  winter: [
    'Zimska služba je plužila tako vneto, da je odstranila tudi tri poštne nabiralnike in vrtnega palčka.',
    'Na hribu so odprli smučišče: ena vlečnica, en snežni top in malo snega.',
    'Na božičnem sejmu je kuhanega vina zmanjkalo po 20 minutah. Kuhanega čaja niso niti odprli.',
    'Dedek Mraz je zamudil, ker je obtičal za plugom.',
    'Sosedje tekmujejo, kdo ima več lučk na hiši. Elektro je poslal čestitke in račun.',
  ],
  spring: [
    'Začela se je sezona košnje. Prva kosilnica je zabrnela v nedeljo ob šestih zjutraj.',
    'Na vrtovih so posadili prve sadike. Babice že stavijo, čigav fižol bo višji.',
    'Spomladanska čistilna akcija: ob cesti so našli 40 vreč smeti in avto iz leta 1987.',
    'Prispele so prve lastovke. Isti dan je prispela tudi prva pritožba zaradi lastovk.',
    'Gasilci so začeli pripravljati veselico. Šotor stoji, ansambel je potrjen, vaja je prestavljena.',
  ],
  summer: [
    'Ob reki so postavili tablo »Kopanje prepovedano«. Ob njej se je kopalo rekordno število ljudi.',
    'Vročinski val: v trgovini je zmanjkalo sladoleda, v gostilni piva, na občini pa potrpežljivosti.',
    'Turisti so odkrili {obcino}. Iskali so sicer sosednjo.',
    'Komarji letos letijo v organiziranih skupinah. Krajani sumijo, da jih pošiljajo iz Zgornjih Žlamp.',
    'Na vaškem kopališču so podaljšali delovni čas. Reševalec ne ve za to.',
  ],
  autumn: [
    'Na sejmu je zmagala buča, težka 312 kilogramov. Lastnik trdi, da jo je zalival samo z dežnico.',
    'Trgatev je uspela. Količina je skromna, kakovost pa po besedah vinogradnika »boljša kot pri sosedu«.',
    'Gobarji so v gozdu našli 30 kilogramov jurčkov. Kje točno, ne povedo niti pod prisego.',
    'Listje pada na cesto. Krajani sprašujejo, kdo bo za to odgovarjal.',
    'Martinovanje: mošt je postal vino, nekaj krajanov pa zelo zgovornih.',
  ],
};

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
  inn: [
    '{Loc} so odprli gostilno. Prvi dan so prodali 300 malic in pojedli vse zaloge zaseke.',
    'Nova gostilna {loc}: kuhinja do 22. ure, debate o politiki do treh zjutraj.',
  ],
  tower: [
    '{Loc} so zgradili stolpnico. Z vrha se vidi do Zgornjih Žlamp. Žal tudi obratno.',
    'Nova stolpnica {loc}: 12 stanovanj, eno dvigalo in hišni svet, ki se ne bo nikoli zedinil.',
  ],
  flats: [
    '{Loc} je zrasel blok. Sosedje so dobili senco, parkirišče pa dvajset novih prepirov.',
    'Novi blok {loc}: arhitekt pravi, da gre za »sodobno interpretacijo socialističnega realizma«.',
  ],
  factory: [
    '{Loc} je zrasla tovarna. Kaj proizvaja, še ni znano, smrdi pa že zdaj.',
    'Nova tovarna {loc} obljublja 40 delovnih mest. Zaenkrat je zaposlila direktorja, njegovo ženo in bratranca.',
  ],
  clinic: [
    '{Loc} so odprli zdravstveni dom. Prvi prosti termin pri zobozdravniku je marca 2031.',
    'Nov zdravstveni dom {loc}: čakalnica ima 40 stolov, ordinacija enega zdravnika.',
  ],
  police: [
    '{Loc} so odprli policijsko postajo. Radar je v prvem tednu ujel župana. Dvakrat.',
    'Nova policijska postaja {loc}. Policista sta prvi dan rešila primer izginule kokoši. Kokoš je bila doma.',
  ],
  shop: [
    '{Loc} so odprli trgovino. Prvi dan je zmanjkalo kruha, drugi dan pa tem za pogovor.',
    'Nova trgovina {loc}: odprta do 19. ure, opravljanje sosedov do zaprtja.',
  ],
  vineyard: [
    '{Loc} so zasadili vinograd. Lastnik že zdaj ve, da bo vino »boljše kot pri sosedu«.',
    'Nov vinograd {loc}. Zidanica ima že zdaj več obiskovalcev kot knjižnica.',
  ],
  cemetery: [
    '{Loc} so uredili pokopališče. Domačini so jezni, vsi ostali pa so si oddahnili.',
    'Novo pokopališče {loc}. Upokojenci so si takoj ogledali najlepše parcele.',
  ],
  kindergarten: [
    '{Loc} so odprli vrtec. Čakalna vrsta za vpis je daljša od čakalne vrste pri zobozdravniku.',
    'Nov vrtec {loc}: 24 otrok, 2 vzgojiteljici in 40 staršev z mnenjem.',
  ],
  school: [
    '{Loc} so odprli osnovno šolo. Starši so na prvem roditeljskem sestanku izvolili tri predsednike.',
    'Nova osnovna šola {loc}. Telovadnica je večja od zbornice, kar pove vse.',
  ],
  highschool: [
    '{Loc} so odprli srednjo šolo. Avtobusna postaja pred njo je že dobila prve grafite.',
    'Nova srednja šola {loc}. Mladina ostaja doma – vsaj do mature.',
  ],
  faculty: [
    '{Loc} so odprli fakulteto. Občina ima zdaj več doktorjev znanosti kot traktorjev.',
    'Nova fakulteta {loc}. Prvi diplomant je napisal nalogo o županu. Ocena: 10.',
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
  inn: 'gostilne',
  factory: 'tovarne',
  flats: 'bloka',
  tower: 'stolpnice',
  clinic: 'zdravstvenega doma',
  police: 'policijske postaje',
  shop: 'trgovine',
  vineyard: 'vinograda',
  cemetery: 'pokopališča',
  kindergarten: 'vrtca',
  school: 'osnovne šole',
  highschool: 'srednje šole',
  faculty: 'fakultete',
};

export const NO_MONEY = [
  'Ni denarja. Proračun je tanjši od izgovora za zamudo na sejo.',
  'Za to ni denarja. Še bratranec ti ne bi posodil.',
  'Blagajna je prazna. Računovodkinja je odprla že drugo kavo.',
];

// What a building without road access says (building panel and toast).
export const NO_ROAD = {
  house: 'Do stavbe ni ceste, nihče se ne vseli.',
  flats: 'Do stavbe ni ceste, nihče se ne vseli.',
  tower: 'Do stavbe ni ceste, nihče se ne vseli.',
  inn: 'Do stavbe ni ceste, gostov ni.',
  factory: 'Do stavbe ni ceste, delavcev ni.',
  firehouse: 'Do stavbe ni ceste, gasilcev ni.',
  hall: 'Do stavbe ni ceste, nihče ne pride.',
  clinic: 'Do stavbe ni ceste, zdravnika ni.',
  police: 'Do stavbe ni ceste, policistov ni.',
  shop: 'Do stavbe ni ceste, kupcev ni.',
  kindergarten: 'Do stavbe ni ceste, otrok ni.',
  school: 'Do stavbe ni ceste, učencev ni.',
  highschool: 'Do stavbe ni ceste, dijakov ni.',
  faculty: 'Do stavbe ni ceste, študentov ni.',
};

export const BUILD_ERRORS = {
  roundaboutNeedsRoad: 'Krožišče gre na cesto. Na travnik ga postaviš šele v drugem mandatu.',
  roundaboutTwice: 'Tu že je krožišče. Krožišče v krožišču bomo preizkusili v tretjem mandatu.',
  occupied: 'Tu že nekaj stoji. Dve stvari na enem mestu gradimo samo v proračunu.',
  church: 'Na cerkev ne gradimo. Župnik ima višje zveze od tebe.',
  outside: 'To je gozd izven občine. Tu lahko gradijo samo medvedi.',
  notOwned: 'To zemljišče še ni naše. Najprej ga kupi – klikni nanj, ko nimaš izbranega orodja.',
  factoryPopulation: 'Za tovarno potrebuješ vsaj {min} prebivalcev, zdaj jih je {now}. Kdo bo pa delal? Bratranec?',
  clinicPopulation: 'Za zdravstveni dom potrebuješ vsaj {min} prebivalcev, zdaj jih je {now}. Za tako malo ljudi noben zdravnik ne pride.',
  eduPopulation: '{what} potrebuje vsaj {min} prebivalcev, zdaj jih je {now}.',
  eduNeedsPrev: '{Name} brez {prevGen}? Najprej zgradi {prev}.',
  demolishChurch: 'Cerkve ni mogoče podreti. Župnik ima boljše zveze kot ti.',
  demolishGrass: 'Travnika ne moreš podreti. Lahko ga kvečjemu pokosiš, ampak ne v nedeljo.',
};

export const LEVER_TEXTS = {
  cousin: {
    name: 'Razpis za bratranca',
    label: 'Bratranec',
    icon: '🤝',
    desc: 'Skrivni račun +12–25 tisoč, tveganje afere +10–18',
    projects: ['obnovo pločnika', 'barvanje klopi', 'svetovanje o svetovanju', 'študijo izvedljivosti študije', 'košnjo občinske trave'],
    companies: ['Bratranec Gradnje d.o.o.', 'Rodbina Inženiring d.o.o.', 'Žlahta in partnerji d.o.o.', 'Svak Consulting s.p.'],
    news: 'Razpis za {project} je dobilo podjetje {company}, katerega lastnik je županov bratranec. Seveda čisto naključje.',
    toast: 'Razpis je zaključen. Skrivni račun +{amount}. Nihče nič ne ve. (Vsi vedo.)',
  },
  praise: {
    name: 'Glasilo: Hvalospevi županu',
    label: 'Hvalospevi',
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
    label: 'Glejte Žlampe',
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
    label: 'Sneg v maju',
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
    label: 'Veselica',
    icon: '🎉',
    desc: 'Vsi na ples k gasilskemu domu. Fovšija dol, sreča gor, tveganje afere −5. Pozor: alkohol.',
    news: [
      'Gasilska veselica: ansambel je igral do treh, šotor je stal do štirih, gasilci so stali do petih.',
      'Na veselici so prodali 400 klobas in 900 piv. Gasilska cisterna je bila uporabljena za hlajenje.',
    ],
    toast: 'Veselica pri gasilskem domu! Vsi gremo plesat.',
  },
  holiday: {
    name: 'Krajevni praznik',
    label: 'Praznik',
    icon: '🎊',
    desc: 'Enkrat na leto: vsi praznujejo skupaj.',
    cooldown: 'Praznik je že bil',
    news: [
      'Krajevni praznik: župan je imel govor, godba je igrala, vsak zaselek je trdil, da je bil njegov šotor najlepši.',
      'Na krajevnem prazniku so podelili 14 priznanj. Prejemniki so bili po naključju vsi iz odbora za priznanja.',
    ],
    toast: 'Krajevni praznik! Vsi so ena velika družina – do ponedeljka.',
  },
  contest: {
    name: 'Gasilsko tekmovanje',
    label: 'Gasilska tekma',
    icon: '🏆',
    desc: 'Tekma z Zgornjimi Žlampami: fovšija gre čez mejo občine.',
    win: [
      'Naši gasilci so na tekmovanju premagali Zgornje Žlampe. Pokal je večji od cisterne.',
      'Zmaga! Desetina iz naše občine je bila hitrejša za 0,3 sekunde. Žlampe zahtevajo ponovno štetje.',
    ],
    lose: [
      'Gasilci so tekmo izgubili proti Zgornjim Žlampam. Krivi so sodniki, veter in nova cev.',
      'Poraz na gasilskem tekmovanju. Žlampe so slavile, pri nas pa vsi skupaj jezni nanje.',
    ],
    brawl: 'Po tekmi je prišlo do pretepa z ekipo iz Žlamp. Škoda: {cost}, fotografije: na Facebooku.',
    toastWin: 'Zmaga nad Žlampami! Fovšija −{n}, ponos gor.',
    toastLose: 'Poraz proti Žlampam. Fovšija vseeno −{n}: zdaj so vsi jezni nanje.',
  },
  assembly: {
    name: 'Zbor krajanov',
    label: 'Zbor krajanov',
    icon: '🗣️',
    desc: 'Župan posluša najbolj fovšljiv konec občine.',
    cooldown: 'Zbor krajanov je bil pred kratkim',
    news: [
      'Zbor krajanov {loc}: tri ure pritožb, dve kavi in en sklep, da se bo »zadeva preučila«.',
      'Župan je {loc} poslušal krajane. Najdaljši govor je imel nekdo, ki tam sploh ne živi.',
    ],
    toast: 'Zbor krajanov {loc}: fovšija tam pade, nekdo pa že ima željo.',
  },
  minister: {
    name: 'Kosilo z ministrom',
    label: 'Minister',
    icon: '🍽️',
    desc: 'Plača skrivni račun. Čez 2 meseca 70 % možnosti za 70.000 € v proračun.',
    fromSecret: true,
    news: [
      'Župan je ministra peljal na kosilo. Pet hodov, tri vina, račun plačan v gotovini.',
      'Minister je bil na kosilu v {obcini}. Pohvalil je žgance in obljubil »da bo videl, kaj se da«.',
    ],
    toast: 'Kosilo je bilo odlično. Zdaj čakamo, ali se bo minister spomnil na nas.',
    success: 'Ministrstvo je občini nakazalo 70.000 € za »razvoj podeželja«. Kosilo se je obrestovalo.',
    failure: 'Minister se kosila spominja z veseljem. Naše občine pa ne.',
  },
  media: {
    name: 'Utišaj medije',
    label: 'Utišaj medije',
    icon: '🙊',
    desc: 'Plača skrivni račun. Tveganje afere −20.',
    fromSecret: true,
    news: [
      'Lokalni portal je nepričakovano objavil 14 člankov o rekordni buči. O aferi niti besede.',
      'Urednik lokalnega časopisa je odšel na dopust na Maldive. Naključje, pravijo.',
    ],
    toast: 'Mediji so utihnili. Tveganje afere −{n}.',
  },
};

export const UNREST = {
  protest: {
    label: 'PROTESTI',
    toast: 'Občani so prišli na ulice. Transparenti so ročno izdelani, pravopis tudi.',
    news: 'Pri cerkvi se je zbrala množica protestnikov. Zahtevajo odstop, pojasnila in brezplačno parkiranje.',
  },
  riot: {
    label: 'NEREDI',
    toast: 'Protest je ušel izpod nadzora! Mesečno bo nekaj zgorelo.',
    news: 'Protest se je sprevrgel v nerede. Gasilci so prišli hitro, a so najprej postavili šotor.',
  },
  // Unrest out of plain unhappiness (no scandal needed).
  protestMood: {
    label: 'PROTESTI',
    toast: 'Občani so nezadovoljni in so prišli na ulice. Škandala ne potrebujejo, dovolj jim je vsakdan.',
    news: 'Pri cerkvi protestirajo nezadovoljni občani. Na transparentih piše »Dovolj je!« in »Kje je moje krožišče?«.',
  },
  riotMood: {
    label: 'NEREDI',
    toast: 'Nezadovoljstvo je prekipelo – neredi! Če trajajo 3 mesece, bo svet izglasoval nezaupnico.',
    news: 'Nezadovoljstvo v občini je prekipelo v nerede. Občinski svetniki že šepetajo o nezaupnici.',
  },
  // Riot cooling down to a protest.
  cooling: {
    toast: 'Neredi so se polegli. Protestniki ostajajo, a so pospravili bakle.',
    news: 'Po neredih spet le protest. Protestniki so si razdelili čiščenje in sendviče.',
  },
  calm: {
    toast: 'Protestniki so se razšli. Uradno zaradi dežja, neuradno zaradi nogometne tekme.',
    news: 'V občini je spet mirno. Edini ostanek protesta je transparent, ki ga zdaj uporabljajo za kokošnjak.',
  },
};

/** A party broken up because the crowd turned into a protest. */
export const PARTY_BROKEN_UP = 'Veselico so prekinili protestniki. Ansambel je pobegnil s harmoniko, šotor je ostal brez gostov.';

export const BURN_NEWS = {
  house: 'Med neredi je {loc} zgorela hiša. Lastnik pravi, da je bila zavarovana bolje kot občina.',
  firehouse: 'Ironija meseca: med neredi je {loc} zgorel gasilski dom.',
  hall: 'Večnamenska dvorana {loc} je med neredi končno našla namen: gorela je.',
  roundabout: 'Protestniki so {loc} prevrnili kip v krožišču. Ostala je le cesta in pločevinka barve.',
  inn: 'Med neredi je {loc} zgorela gostilna. Gostje so vztrajali do zadnjega piva.',
  factory: 'Med neredi je {loc} zgorela tovarna. Sosedje pravijo, da smrdi enako kot prej.',
  tower: 'Med neredi je {loc} gorela stolpnica. Gasilci so prvič uporabili lestev do konca.',
  flats: 'Med neredi je {loc} gorel blok. Stanovalci so se prvič v zgodovini vsi pozdravili – na parkirišču.',
  clinic: 'Med neredi je {loc} gorel zdravstveni dom. Čakalna vrsta je ostala nepoškodovana.',
  police: 'Med neredi je {loc} gorela policijska postaja. Policista sta požar zapisala v zapisnik.',
  shop: 'Med neredi je {loc} zgorela trgovina. Prej so jo še na hitro izpraznili – brez blagajne.',
  kindergarten: 'Med neredi je {loc} gorel vrtec. Otroci so požar narisali bolje kot novinarji.',
  school: 'Med neredi je {loc} gorela osnovna šola. Učenci so prvič v zgodovini želeli v šolo.',
  highschool: 'Med neredi je {loc} gorela srednja šola. Dijaki pravijo, da niso bili oni. Tokrat res.',
  faculty: 'Med neredi je {loc} gorela fakulteta. Rektor je napovedal simpozij o požaru.',
};

/** News from the public buildings (services.js). */
export const SERVICE_NEWS = {
  harvest: [
    'Trgatev: vinogradi so občini prinesli {money}. Degustacije s pravimi ljudmi so se zavlekle do jutra.',
    'Letošnja trgatev je prinesla {money}. Vino je po besedah vinogradnikov »boljše kot v Zgornjih Žlampah«.',
  ],
  noCemetery: [
    'Občani sprašujejo, kje jih bodo pokopali. Občina odgovarja, da se o tem še ne pogovarja.',
    'Pogreb je moral v Zgornje Žlampe. Tamkajšnji župan je imel govor. O nas.',
    'Upokojenci zahtevajo pokopališče. »Ne bomo hodili umirat v sosednjo občino!«',
  ],
  policeSaved: 'Policija je med neredi {loc} preprečila požar. Napisala je tudi tri kazni za parkiranje.',
};

export const TAX_NEWS = {
  raised: [
    'Občina je davek na hišo dvignila na {rate}. Občani so odlok prvič v zgodovini prebrali do konca.',
    'Novi davek na hišo: {rate}. V Facebook skupini so v eni uri napisali 300 komentarjev in en pravilen.',
  ],
  lowered: [
    'Občina je znižala davek na hišo na {rate}. Občani sumijo, da se pripravlja nekaj velikega.',
    'Davek na hišo je odslej {rate}. Upokojenci so to proslavili z dodatno kavo.',
  ],
  veryHigh: [
    'Davki so višji kot v Zgornjih Žlampah. Tam to radi poudarjajo.',
    'Občan je davčno položnico uokviril in obesil v dnevno sobo. »Za spomin, kako je bilo, ko sem še imel denar.«',
    'Na avtobusni postaji se je pojavil napis: »Davek na hišo, davek na zrak, kaj je naslednje?«',
  ],
};

// Protest damage (milder than riots: nothing burns).
export const VANDAL_NEWS = {
  roundabout: 'Protestniki so {loc} prevrnili kip v krožišču. Kip je zdaj vodoraven, krožišče pa navadno križišče.',
  road: 'Protestniki so {loc} razkopali cesto in iz asfalta zgradili barikado. Barikada je bolj ravna od ceste.',
  graffiti: [
    'Protestniki so popisali občinsko stavbo z grafiti. Pravopisne napake bo popravila občina, na svoje stroške.',
    'Ponoči je nekdo razbil tri klopi in na avtobusno postajo napisal »ODSTOP«. Klopi bodo nove, napis ostaja.',
    'Protestniki so županov plakat okrasili z brki in rogovi. Po mnenju nekaterih je zdaj bolj podoben.',
  ],
};

export const LEVER_ERRORS = {
  snowActive: 'Že sneži. Še več snega bi bilo sumljivo celo za zimsko službo.',
  snowWinter: 'Pozimi sneg nikogar ne preseneti. Počakaj na pomlad, ko bo spet pravi šok.',
  partyActive: 'Veselica je že v teku. Dveh hkrati ne zmore niti ansambel.',
  partyUnrest: 'Med protesti ni veselice. Ansambel ne igra pred transparenti.',
  noSecret: 'Na skrivnem računu ni dovolj. Bratranec bo moral spet na razpis.',
  firehouseNoRoad: 'Do gasilskega doma ni ceste. Gasilci ne bodo nosili šotora čez travnik.',
  ministerPending: 'Minister še prebavlja zadnje kosilo. Počakaj, da se odloči.',
  noFirehouse: 'Brez gasilskega doma ni veselice. Najprej dom, potem šotor.',
  contestNoFirehouse: 'Brez gasilskega doma ni gasilske desetine. Žlampe bi se smejale.',
  cousinLimit: 'Ta mesec je bratranec dobil že {n} razpisa. Še eden in bi postal sumljiv celo njegovi mami.',
  gatheringActive: 'Občani so že zbrani drugje. Ena prireditev naenkrat, prosim.',
  holidayUnrest: 'Med protesti ni praznika. Godba ne igra pred transparenti.',
};

export const MOOD_LABELS = {
  happy: ['zadovoljen', 'zadovoljna'],
  neutral: ['neodločen', 'neodločena'],
  unhappy: ['nezadovoljen', 'nezadovoljna'],
};

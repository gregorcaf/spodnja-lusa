// Dilemma cards (Slovenian player-facing text). All people, places and companies are fictional.
//
// Card fields:
//   id, title, text           text may use {loc} {Loc} {district} {name} {first} and {male|female}
//   district: 'random' | building type   how the card's district is picked (type = where such a building stands)
//   citizen: true | character key        pick a random citizen (optionally of a given character)
//   when(state)                          optional extra condition
//   season: 'winter' | 'spring' | 'summer' | 'autumn'   only in that season
//   yearly: month (0–11)                 a yearly event: shown once in that month every year
//   options: [{ label, effect, later: [{ in, chance, effect, news, elseEffect, elseNews }], news }]
//     effect is shown on the button; `later` stays hidden (only hinted at).

export const DILEMMAS = [
  {
    id: 'cheap-asphalt',
    title: 'Asfalt po pol cene',
    text: 'Bratranec ponuja, da vse ceste {loc} asfaltira za pol cene. Asfalt je »ekonomične debeline«.',
    district: 'random',
    options: [
      {
        label: 'Sprejmi ponudbo',
        effect: { budget: -3000, secret: 4000, districtHappy: 6, affair: 4 },
        news: 'Ceste {loc} so asfaltirane v rekordnem času. Delavci so delali tudi ponoči, da jih ne bi kdo videl.',
        later: [
          {
            in: 3,
            chance: 0.7,
            effect: { destroy: { type: 'road', count: 2 }, districtHappy: -8 },
            news: 'Se spomnite asfalta po pol cene {loc}? Odnesel ga je prvi dež. Skupaj s cesto.',
            elseNews: 'Poceni asfalt {loc} še drži. Strokovnjaki so presenečeni, bratranec tudi.',
          },
        ],
      },
      {
        label: 'Zavrni bratranca',
        effect: { modifier: { key: 'cousin-offended', label: 'Bratranec užaljen', months: 3, blockLever: 'cousin' } },
        news: 'Bratranec je užaljen in ne pride več na nedeljska kosila. Razpisov tudi ne bo.',
      },
    ],
  },
  {
    id: 'church-bells',
    title: 'Novi zvonovi',
    text: 'Župnik želi nove zvonove. Pravi, da stari zvonijo »nekam razglašeno, skoraj protestantsko«.',
    options: [
      {
        label: 'Plačaj zvonove',
        effect: { budget: -12000, happy: 4 },
        news: 'Novi zvonovi so blagoslovljeni. Prvič so zazvonili ob 6. zjutraj in zbudili pol občine.',
        later: [{ in: 2, effect: { propaganda: 6 }, news: 'Župnik je v nedeljski pridigi pohvalil župana. Dvakrat. Z imenom.' }],
      },
      {
        label: 'Ni denarja',
        effect: { happy: -3 },
        news: 'Župnik je sprejel odločitev občine »s krščansko potrpežljivostjo«. Zvonovi zvonijo še bolj razglašeno.',
        later: [
          {
            in: 1,
            chance: 0.5,
            effect: { affair: 6 },
            news: 'Župnik je v pridigi omenil »nekatere, ki skrbijo samo za svoje bratrance«. Vsi so vedeli, koga misli.',
          },
        ],
      },
    ],
  },
  {
    id: 'bear',
    title: 'Medved',
    text: '{name} trdi, da je {loc} videl{|a} medveda. Zahteva lovsko opazovalnico in polovico lovske družine.',
    district: 'random',
    citizen: true,
    options: [
      {
        label: 'Postavi opazovalnico',
        effect: { budget: -4000, districtHappy: 4, citizenHappy: 15 },
        news: 'Opazovalnica {loc} stoji. Medveda zaenkrat ni na spregled.',
        later: [
          {
            in: 2,
            effect: { happy: 3 },
            news: 'Opazovalnica {loc} je postala priljubljena točka za zmenke. Medved je ni obiskal.',
          },
        ],
      },
      {
        label: 'Medvedov pri nas ni',
        effect: { citizenHappy: -10, citizenEnvy: 8 },
        news: 'Občina uradno: medvedov ni. Medved se ni odzval.',
        later: [
          {
            in: 2,
            chance: 0.45,
            effect: { budget: -6000, districtHappy: -6 },
            news: 'Medved je obiskal čebelnjak {loc}. Odškodnina: 6.000 €. Medved zanika.',
          },
        ],
      },
    ],
  },
  {
    id: 'reality-show',
    title: 'Resničnostni šov',
    text: 'Televizija bi pri nas snemala resničnostni šov »Kmetija išče župana«. Plačajo dobro, a kamere so povsod.',
    options: [
      {
        label: 'Dovoli snemanje',
        effect: { budget: 15000, propaganda: 6, envy: 5 },
        news: 'Snemanje se je začelo. Polovica občanov je kupila nova oblačila, druga polovica je užaljena.',
        later: [
          {
            in: 2,
            chance: 0.6,
            effect: { affair: 14 },
            news: 'V šovu je kamera po nesreči posnela pogodbo z bratrancem. Gledanost je poskočila.',
            elseNews: 'Šov je končan. Zmagala je krava Liza, ki ima zdaj več sledilcev kot župan.',
          },
        ],
      },
      {
        label: 'Zavrni',
        effect: { happy: -3 },
        news: 'Šov bodo snemali v Zgornjih Žlampah. Naši so užaljeni, da niso dovolj zanimivi.',
      },
    ],
  },
  {
    id: 'eu-funds',
    title: 'Evropska sredstva',
    text: 'Svetovalec ponuja pomoč pri prijavi na evropski razpis. Honorar je »simboličen« in plačljiv vnaprej.',
    options: [
      {
        label: 'Najmi svetovalca',
        effect: { budget: -8000 },
        news: 'Svetovalec je oddal prijavo na 340 straneh. Polovica je v angleščini, polovica v slovenščini.',
        later: [
          {
            in: 4,
            chance: 0.55,
            effect: { budget: 40000, propaganda: 4 },
            news: 'Evropska sredstva so odobrena! Porabiti jih moramo za »trajnostno digitalno inovativnost«.',
            elseNews: 'Prijava na evropski razpis je zavrnjena. Svetovalec pravi, da je bilo »zelo blizu«.',
          },
        ],
      },
      {
        label: 'Ne zaupam svetovalcem',
        effect: {},
        news: 'Zgornje Žlampe so najele istega svetovalca in dobile kolesarsko stezo do nikamor.',
      },
    ],
  },
  {
    id: 'garbage-strike',
    title: 'Komunalci stavkajo',
    text: 'Komunalci zahtevajo povišico. Sicer ne bodo več odvažali smeti, ampak jih bodo zlagali pred občino.',
    options: [
      {
        label: 'Daj povišico',
        effect: { happy: 2, modifier: { key: 'garbage-raise', label: 'Povišica komunalcem', months: 6, monthlyBudget: -800 } },
        news: 'Komunalci so dobili povišico. Prvič v zgodovini so smeti odpeljali pred rokom.',
      },
      {
        label: 'Ni govora',
        effect: { propaganda: 2 },
        news: 'Župan je ostal neomajen. Komunalci tudi.',
        later: [
          {
            in: 1,
            effect: { happy: -8, envy: 4 },
            news: 'Smeti se kopičijo pred občino. Vonj je dosegel Zgornje Žlampe, kar je edina dobra novica.',
          },
        ],
      },
    ],
  },
  {
    id: 'green-fish',
    title: 'Zelene ribe',
    text: 'Tovarna {loc} je po nesreči spustila v potok nekaj »popolnoma neškodljivega«. Ribe so zdaj zelene.',
    district: 'factory',
    options: [
      {
        label: 'Zataškaj (iz skrivnega računa)',
        effect: { secret: -5000 },
        news: 'Potok {loc} je spet čist. Ribe so pa še vedno zelene. Uradno gre za novo vrsto.',
        later: [
          {
            in: 3,
            chance: 0.4,
            effect: { affair: 20 },
            news: 'Novinar je našel zeleno ribo in jo prinesel na tiskovno konferenco. Afera!',
          },
        ],
      },
      {
        label: 'Kaznuj tovarno',
        effect: {
          budget: 6000,
          districtHappy: 5,
          modifier: { key: 'factory-angry', label: 'Užaljena tovarna', months: 3, monthlyBudget: -1500 },
        },
        news: 'Tovarna {loc} je plačala kazen in se pritožila. Direktor je zagrozil s selitvijo v Žlampe.',
      },
    ],
  },
  {
    id: 'wedding',
    title: 'Poroka leta',
    text: '{name} se poroči in vabi celo občino. Pričakuje, da župan prispeva harmonikarja. In pečenko.',
    citizen: true,
    options: [
      {
        label: 'Plačaj harmonikarja',
        effect: { budget: -2000, citizenHappy: 20, happy: 2 },
        news: 'Poroka je uspela. Harmonikar je igral 9 ur, ženin je zaspal po treh.',
      },
      {
        label: 'Pošlji voščilnico',
        effect: { citizenHappy: -10, citizenEnvy: 10 },
        news: '{first} je dobil{|a} voščilnico od župana. Uporabil{|a} jo je za podstavek pod mizo.',
      },
    ],
  },
  {
    id: 'pothole-art',
    title: 'Umetnost v luknji',
    text: 'Lokalni umetnik je luknjo na cesti {loc} razglasil za umetniško instalacijo »Praznina sistema«. Hoče subvencijo.',
    district: 'random',
    options: [
      {
        label: 'Subvencioniraj umetnost',
        effect: { budget: -3000, propaganda: 2, districtHappy: -3 },
        news: 'Instalacija »Praznina sistema« {loc} je uradno odprta. Avtomobili jo obvozijo s spoštovanjem.',
        later: [
          {
            in: 2,
            effect: { propaganda: 4, budget: 2000 },
            news: 'Luknja {loc} je dobila nagrado na bienalu. Turisti jo fotografirajo, vozniki preklinjajo.',
          },
        ],
      },
      {
        label: 'Zakrpaj luknjo',
        effect: { budget: -1500, districtHappy: 4 },
        news: 'Luknja {loc} je zakrpana. Umetnik je napovedal novo delo: »Krpa na rani«.',
      },
    ],
  },
  {
    id: 'inn-curfew',
    title: 'Policijska ura',
    text: 'Sosedje gostilne {loc} se pritožujejo nad petjem po polnoči. Gostje se pritožujejo nad sosedi.',
    district: 'inn',
    options: [
      {
        label: 'Uvedi policijsko uro',
        effect: { districtHappy: 3, happy: -2, modifier: { key: 'inn-curfew', label: 'Policijska ura', months: 4, monthlyBudget: -300 } },
        news: 'V gostilni {loc} velja policijska ura. Petje se je preselilo na parkirišče.',
      },
      {
        label: 'Naj pojejo',
        effect: { districtHappy: -5, happy: 3 },
        news: 'Petje v gostilni {loc} se nadaljuje. Sosedje so se naučili vseh besedil.',
      },
    ],
  },
  {
    id: 'snow-flat-rate',
    season: 'autumn',
    title: 'Pavšal za zimsko službo',
    text: 'Ponudnik zimske službe ponuja letni pavšal. Plačljiv vsak mesec, ne glede na to, ali sneži.',
    options: [
      {
        label: 'Podpiši pogodbo',
        effect: {
          secret: 10000,
          affair: 6,
          modifier: { key: 'snow-flat-rate', label: 'Pavšal zimske službe', months: 12, monthlyBudget: -1000 },
        },
        news: 'Pogodba z zimsko službo je podpisana. Ponudnik je takoj kupil nov plug. In Audi.',
      },
      {
        label: 'Ne, hvala',
        effect: {},
        news: 'Občina je zavrnila pavšal. Ponudnik je užaljen in pravi, da »bomo še videli, ko bo snežilo«.',
        later: [
          {
            in: 3,
            chance: 0.5,
            effect: { happy: -5 },
            news: 'Prvi sneg je zapadel in nihče ga ni plužil. Ponudnik je bil ravno na dopustu.',
          },
        ],
      },
    ],
  },
  {
    id: 'mayor-statue',
    title: 'Kip župana',
    text: 'Občinski svetniki predlagajo kip župana pred cerkvijo. »Iz hvaležnosti,« pravijo. In ker so na seznamu za razpis.',
    options: [
      {
        label: 'Skromno sprejmi',
        effect: { budget: -10000, propaganda: 10, envy: 6 },
        news: 'Kip župana je odkrit. Kipar je bil velikodušen pri višini in skromen pri trebuhu.',
        later: [
          {
            in: 2,
            chance: 0.5,
            effect: { affair: 6 },
            news: 'Neznanci so kipu župana nadeli brke in napis »Bratranec d.o.o.«.',
          },
        ],
      },
      {
        label: 'Zavrni, skromnost!',
        effect: { propaganda: 4, happy: 2 },
        news: 'Župan je kip zavrnil. Glasilo je o njegovi skromnosti napisalo šest strani.',
      },
    ],
  },
  {
    id: 'mushrooms',
    season: 'autumn',
    title: 'Gobarska vojna',
    text: 'Gobarji iz Zgornjih Žlamp nam pobirajo jurčke {loc}. Domačini zahtevajo ukrepe.',
    district: 'random',
    options: [
      {
        label: 'Table »Samo za domače«',
        effect: { budget: -1000, districtHappy: 6 },
        news: 'Ob gozdu {loc} stojijo table »Gobe samo za domače«. Gobe se niso opredelile.',
        later: [
          {
            in: 2,
            effect: { happy: -3, envy: 3 },
            news: 'Žlampe so odgovorile s tablami »Samo za Žlampovce« na edini cesti do avtoceste.',
          },
        ],
      },
      {
        label: 'Gozd je za vse',
        effect: { districtHappy: -6 },
        news: 'Župan: »Gozd je za vse.« Gobarji {loc} so to razumeli kot osebno žalitev.',
      },
    ],
  },
  {
    id: 'bus-line',
    title: 'Avtobusna linija',
    text: 'Prevoznik bi ukinil edino avtobusno linijo. Ohrani jo lahko, če občina doplačuje 1.000 € na mesec.',
    options: [
      {
        label: 'Ohrani avtobus',
        effect: { happy: 3, modifier: { key: 'bus', label: 'Doplačilo za avtobus', months: 6, monthlyBudget: -1000 } },
        news: 'Avtobus ostaja. Še naprej bo vozil dvakrat na dan, obakrat ob napačni uri.',
      },
      {
        label: 'Ukini ga',
        effect: { happy: -6 },
        news: 'Avtobusa ni več. Na postaji še vedno stoji nova klop. Za spomin.',
      },
    ],
  },
  {
    id: 'viral-dance',
    title: 'Viralni posnetek',
    text: 'Posnetek, kako župan na veselici pleše polko z gasilsko čelado na glavi, ima milijon ogledov.',
    options: [
      {
        label: 'Izkoristi slavo',
        effect: { propaganda: 8, affair: -5 },
        news: 'Župan je posnetek delil z zapisom »Tudi župan je človek«. Mediji pozabljajo na afere.',
      },
      {
        label: 'Zahtevaj umik',
        effect: { affair: 6 },
        news: 'Župan je zahteval umik posnetka. Zdaj ima dva milijona ogledov in remiks.',
      },
    ],
  },
  {
    id: 'hayrack',
    title: 'Kozolec',
    text: 'Domačini {loc} bi podrli star kozolec, ki je kulturna dediščina, in tam parkirali traktor.',
    district: 'random',
    options: [
      {
        label: 'Kdo bo pa vedel',
        effect: { districtHappy: 5 },
        news: 'Kozolca {loc} ni več. Traktor je zadovoljen.',
        later: [
          {
            in: 2,
            chance: 0.6,
            effect: { affair: 8, budget: -4000 },
            news: 'Zavod za varstvo dediščine je ugotovil, da kozolca {loc} ni več. Kazen: 4.000 €.',
          },
        ],
      },
      {
        label: 'Odkupi kozolec',
        effect: { budget: -7000, propaganda: 3, districtHappy: -2 },
        news: 'Občina je odkupila kozolec {loc}. Zdaj ima kozolec in nobene ideje, kaj z njim.',
      },
    ],
  },
  {
    id: 'nephew-job',
    title: 'Služba za nečaka',
    text: 'Bratranec prosi, da njegov sin dobi službo na občini. »Je zelo priden za računalnikom,« pravi.',
    options: [
      {
        label: 'Zaposli nečaka',
        effect: {
          secret: 6000,
          affair: 6,
          modifier: { key: 'nephew', label: 'Nečak na občini', months: 12, monthlyBudget: -1200 },
        },
        news: 'Občina ima novega svetovalca za digitalizacijo. Prvi dan je zamenjal ozadje na vseh računalnikih.',
      },
      {
        label: 'Ni prostega mesta',
        effect: { modifier: { key: 'cousin-offended', label: 'Bratranec užaljen', months: 2, blockLever: 'cousin' } },
        news: 'Nečak ni dobil službe. Bratranec je zamenjal telefonsko številko.',
      },
    ],
  },
  {
    id: 'facebook-group',
    title: 'Facebook skupina',
    text: 'Komentatorji so ustanovili skupino »Občani proti vsemu«. V enem dnevu je imela 400 članov.',
    options: [
      {
        label: 'Pridruži se pod lažnim imenom',
        effect: { propaganda: 4 },
        news: 'V skupini »Občani proti vsemu« je nov član »Janez Pravičnik«, ki vse zagovarja. Sumljivo.',
        later: [
          {
            in: 1,
            chance: 0.5,
            effect: { affair: 10, propaganda: -4 },
            news: 'Razkrito: »Janez Pravičnik« je župan. Skupina ima zdaj 1.200 članov.',
          },
        ],
      },
      {
        label: 'Ignoriraj',
        effect: { envy: 4 },
        news: 'Skupina »Občani proti vsemu« je razpravljala o vsem. Sklep: proti.',
      },
    ],
  },
  {
    id: 'drought',
    season: 'summer',
    title: 'Suša',
    text: 'Vrtičkarji pravijo, da so paradižniki v smrtni nevarnosti. Zahtevajo brezplačno vodo za zalivanje.',
    options: [
      {
        label: 'Brezplačna voda',
        effect: { budget: -5000, happy: 5 },
        news: 'Voda za vrtičkarje je brezplačna. Poraba je zrasla za 400 %, tudi pri tistih brez vrta.',
      },
      {
        label: 'Naj molijo za dež',
        effect: { happy: -4 },
        news: 'Župan je vrtičkarjem svetoval molitev. Župnik se je strinjal, vrtičkarji ne.',
        later: [
          {
            in: 1,
            chance: 0.5,
            effect: { happy: 6 },
            news: 'Deževalo je! Vrtičkarji pripisujejo zasluge sebi, župnik sebi, župan glasilu.',
          },
        ],
      },
    ],
  },
  {
    id: 'sausage-festival',
    title: 'Festival klobas',
    text: 'Turistično društvo {loc} predlaga Festival klobas. »Prinesel bo turiste,« pravijo. In holesterol.',
    district: 'random',
    options: [
      {
        label: 'Financiraj festival',
        effect: { budget: -8000, districtHappy: 8, othersEnvy: 6 },
        news: 'Festival klobas {loc} je odprt. Vegetarijanec je bil eden in je prinesel svoj sendvič.',
        later: [{ in: 1, effect: { budget: 6000 }, news: 'Festival klobas {loc} je prodal 3.000 klobas. Kardiologi so zadovoljni.' }],
      },
      {
        label: 'Ni denarja za klobase',
        effect: { districtHappy: -4 },
        news: 'Festivala klobas ne bo. Turistično društvo {loc} razmišlja o festivalu solate. Iz protesta.',
      },
    ],
  },
  {
    id: 'cell-tower',
    title: 'Bazna postaja',
    text: 'Operater bi {loc} postavil bazno postajo in občini plačeval najemnino. Nekateri se bojijo sevanja.',
    district: 'random',
    options: [
      {
        label: 'Dovoli',
        effect: { districtHappy: -8, modifier: { key: 'cell-tower', label: 'Najemnina bazne postaje', months: 12, monthlyBudget: 700 } },
        news: 'Bazna postaja {loc} stoji. Trije občani trdijo, da zdaj slišijo radio v zobeh.',
      },
      {
        label: 'Ne, hvala',
        effect: { happy: 1 },
        news: 'Signal ostaja slab. Upokojenci so zadovoljni, ker jih vnuki ne morejo klicati.',
      },
    ],
  },
  {
    id: 'miracle',
    title: 'Čudež na fasadi',
    text: 'Na zidu cerkve se je pojavila podoba svetnika. Ali pa vlaga. Romarji že prihajajo.',
    options: [
      {
        label: 'Razglasi čudež',
        effect: { budget: 8000, propaganda: 3 },
        news: 'Romarji prihajajo v trumah. Gostilne so prazne zalog, parkirišča polna.',
        later: [
          {
            in: 3,
            effect: { propaganda: -3 },
            news: 'Strokovnjak je potrdil: vlaga. Romarji so vseeno zadovoljni, gostilničarji še bolj.',
          },
        ],
      },
      {
        label: 'Popravi fasado',
        effect: { budget: -4000 },
        news: 'Fasada cerkve je popravljena. Svetnik je izginil. Župnik je razočaran.',
      },
    ],
  },
  {
    id: 'minister-visit',
    title: 'Obisk ministra',
    text: 'Na obisk prihaja minister. Pričakuje kosilo, trak za prerezat in fotografijo pred nečim novim.',
    options: [
      {
        label: 'Velika pogostitev',
        effect: { budget: -6000, propaganda: 6 },
        news: 'Minister je prerezal trak pred novim košem za smeti. Kosilo je trajalo pet ur.',
        later: [
          {
            in: 2,
            chance: 0.5,
            effect: { budget: 25000 },
            news: 'Minister je obljubil sredstva. In presenetljivo: res so prispela!',
            elseNews: 'Minister je obljubil sredstva. Kot vedno.',
          },
        ],
      },
      {
        label: 'Skromen sprejem',
        effect: { propaganda: -2 },
        news: 'Minister je dobil kavo in piškote. Odšel je po desetih minutah, užaljen.',
      },
    ],
  },
  {
    id: 'protest-deal',
    title: 'Pogajanja s protestniki',
    text: 'Protestniki ponujajo dogovor: odstop podžupana v zameno za mir na ulicah.',
    when: (s) => s.unrest !== 'calm',
    options: [
      {
        label: 'Žrtvuj podžupana',
        effect: { affair: -15, propaganda: -3 },
        news: 'Podžupan je odstopil »iz osebnih razlogov«. Osebni razlog je bil župan.',
      },
      {
        label: 'Ne popusti',
        effect: { affair: 5, happy: -3 },
        news: 'Župan ne popušča. Protestniki tudi ne. Prodajalec kave je zadovoljen.',
      },
    ],
  },
  {
    id: 'cousin-dog',
    title: 'Bratrančev pes',
    text: 'Bratrančev pes je ugriznil poštarja. Bratranec prosi, da »se to uredi po domače«.',
    options: [
      {
        label: 'Uredi po domače',
        effect: { secret: -3000, affair: 4 },
        news: 'Poštar je dobil nov kolesarski dres in pozabil, kaj se je zgodilo. Pes ne.',
      },
      {
        label: 'Naj odgovarja',
        effect: { propaganda: 3, modifier: { key: 'cousin-offended', label: 'Bratranec užaljen', months: 2, blockLever: 'cousin' } },
        news: 'Bratranec je plačal kazen. Na kosilu je rekel, da »nekateri pozabljajo, od kod so prišli«.',
      },
    ],
  },
  {
    id: 'hall-disco',
    title: 'Prazna dvorana',
    text: 'Večnamenska dvorana {loc} nima namena. Podjetnik ponuja, da tam odpre diskoteko.',
    district: 'hall',
    options: [
      {
        label: 'Diskoteka!',
        effect: { districtHappy: -6, othersEnvy: 4, modifier: { key: 'disco', label: 'Najemnina diskoteke', months: 6, monthlyBudget: 1500 } },
        news: 'V dvorani {loc} je diskoteka. Bas se sliši do Zgornjih Žlamp.',
      },
      {
        label: 'Šahovski krožek',
        effect: { districtHappy: 3 },
        news: 'V dvorani {loc} je šahovski krožek. Na prvi uri sta bila dva člana in en remi.',
      },
    ],
  },
  {
    id: 'tourist-tax',
    title: 'Turistična taksa',
    text: 'Svetniki predlagajo turistično takso za vse obiskovalce iz Zgornjih Žlamp.',
    options: [
      {
        label: 'Uvedi takso',
        effect: { modifier: { key: 'tourist-tax', label: 'Taksa za Žlampovce', months: 6, monthlyBudget: 800 } },
        news: 'Taksa za Žlampovce velja. Prvi dan so pobrali 40 € in eno grožnjo.',
        later: [
          {
            in: 1,
            effect: { envy: 4 },
            news: 'Žlampe so uvedle takso za nas. Taksna vojna se je začela.',
          },
        ],
      },
      {
        label: 'Ne bodimo smešni',
        effect: {},
        news: 'Takse ne bo. Žlampovci še naprej parkirajo pred našo cerkvijo. Zastonj.',
      },
    ],
  },
  {
    id: 'pumpkin',
    title: 'Rekordna buča',
    text: '{name} je vzgojil{|a} rekordno bučo (212 kg). Zahteva, da jo občina razstavi pred cerkvijo.',
    citizen: 'gardener',
    options: [
      {
        label: 'Razstavi jo',
        effect: { budget: -500, citizenHappy: 20, happy: 2, envy: 3 },
        news: 'Rekordna buča stoji pred cerkvijo. Ostali vrtičkarji so jo ponoči premerili. Trikrat.',
      },
      {
        label: 'Buča ostane doma',
        effect: { citizenHappy: -10, citizenEnvy: 8 },
        news: '{first} je bučo razstavil{|a} na domačem dvorišču, s tablo »Občina je ni hotela«.',
      },
    ],
  },
  {
    id: 'speed-camera',
    title: 'Radar',
    text: 'Policija ponuja radar na glavni cesti. Kazni bi šle v občinski proračun.',
    options: [
      {
        label: 'Postavi radar',
        effect: { happy: -5, modifier: { key: 'speed-camera', label: 'Kazni z radarja', months: 6, monthlyBudget: 1200 } },
        news: 'Radar stoji. Prvi teden je ujel župnika, dva gasilca in županovega bratranca.',
      },
      {
        label: 'Ne nagajajmo ljudem',
        effect: { happy: 1 },
        news: 'Radarja ne bo. Traktorji še naprej vozijo 25 km/h, kar je itak njihov maksimum.',
      },
    ],
  },
  {
    id: 'audit',
    title: 'Revizija',
    text: 'Računsko sodišče napoveduje revizijo občinskih financ. Računovodkinja je bleda kot stena.',
    when: (s) => s.secret >= 15000,
    options: [
      {
        label: 'Prestavi denar k teti',
        effect: { secret: -10000, affair: -8 },
        news: 'Revizija je potekala brez posebnosti. Županova teta si je kupila nov avto.',
      },
      {
        label: 'Tvegaj',
        effect: {},
        news: 'Revizorji so prišli. Računovodkinja jim je postregla s kavo in štrudlom.',
        later: [
          {
            in: 1,
            chance: 0.5,
            effect: { affair: 20 },
            news: 'Revizorji so našli »nenavadne« račune za razpise. Mediji že kličejo.',
            elseNews: 'Revizorji so odšli brez pripomb. Štrudl je bil menda odličen.',
          },
        ],
      },
    ],
  },
  {
    id: 'firemen-truck',
    title: 'Nova cisterna',
    text: 'Gasilci želijo novo cisterno. Stara je iz leta 1984 in ugasne, ko jo kdo pogleda.',
    district: 'firehouse',
    options: [
      {
        label: 'Kupi cisterno',
        effect: { budget: -15000, happy: 5, districtHappy: 4 },
        news: 'Nova cisterna je prispela. Gasilci so jo predstavili na veselici in jo napolnili s pivom.',
      },
      {
        label: 'Stara še gre',
        effect: { districtHappy: -5 },
        news: 'Gasilci so staro cisterno pobarvali. Zdaj ugasne v novi barvi.',
        later: [
          {
            in: 2,
            chance: 0.35,
            effect: { destroy: { type: 'house', count: 1 }, happy: -5 },
            news: 'Cisterna ni vžgala. Gorela je hiša {loc}. Gasilci so jo gasili z vedri.',
          },
        ],
      },
    ],
  },
  {
    id: 'investor',
    title: 'Investitor',
    text: 'Tuji investitor bi {loc} zgradil tovarno. Pravi, da prinaša delovna mesta in »majhen vonj«.',
    district: 'random',
    options: [
      {
        label: 'Dobrodošli!',
        effect: { build: { type: 'factory' }, secret: 5000, districtHappy: -6, othersEnvy: 4 },
        news: 'Investitor je {loc} postavil tovarno. Ob otvoritvi je imel govor v jeziku, ki ga nihče ni razumel.',
      },
      {
        label: 'Ne pri nas',
        effect: { districtHappy: 4 },
        news: 'Investitor je odšel v Zgornje Žlampe. Tam so ga sprejeli z godbo.',
      },
    ],
  },
  {
    id: 'inn-gift',
    title: 'Gostilničar ponuja',
    text: 'Gostilničar bi {loc} odprl novo gostilno, če mu občina »malo pomaga« pri dovoljenjih.',
    district: 'random',
    options: [
      {
        label: 'Pomagaj mu',
        effect: { build: { type: 'inn' }, affair: 5, districtHappy: 6 },
        news: 'Nova gostilna {loc} je dobila dovoljenje v rekordnih dveh dneh. Župan ima stalno mizo.',
      },
      {
        label: 'Naj čaka v vrsti',
        effect: { propaganda: 2 },
        news: 'Gostilničar čaka na dovoljenje. Že tretji mesec. Medtem toči na črno.',
      },
    ],
  },

  // --- Yearly events -----------------------------------------------------------
  {
    id: 'christmas-fair',
    yearly: 11,
    title: 'Božični sejem',
    text: 'Turistično društvo bi pred cerkvijo postavilo božični sejem: stojnice, kuhano vino in ansambel z zvončki.',
    options: [
      {
        label: 'Organiziraj sejem',
        effect: { budget: -8000, happy: 8, envy: -4 },
        news: 'Božični sejem je odprt. Kuhano vino teče, ansambel z zvončki igra že tretjo uro isto pesem.',
        later: [{ in: 1, effect: { budget: 6000 }, news: 'Božični sejem je prinesel 6.000 € prihodka. In dva primera opeklin s kuhanim vinom.' }],
      },
      {
        label: 'Letos ga ne bo',
        effect: { happy: -6, envy: 4 },
        news: 'Božičnega sejma letos ne bo. Občani hodijo na sejem v Zgornje Žlampe in se vračajo slabe volje.',
      },
    ],
  },
  {
    id: 'summer-festival',
    yearly: 6,
    title: 'Poletni festival',
    text: 'Tri dni glasbe, piva in pritožb sosedov. Organizatorji računajo na občino. In na lepo vreme.',
    options: [
      {
        label: 'Financiraj festival',
        effect: { budget: -12000, happy: 10, envy: -5 },
        news: 'Poletni festival se je začel. Glavni nastopajoči je ansambel, ki ga nihče ne pozna, a vsi znajo njegove pesmi.',
        later: [
          {
            in: 1,
            chance: 0.75,
            effect: { budget: 9000 },
            news: 'Festival je prodal rekordnih 12.000 piv. Prihodek: 9.000 €. Odpadki: neprecenljivi.',
            elseEffect: { happy: -3 },
            elseNews: 'Festival je trikrat prekinila nevihta. Nastopajoči so igrali pod šotorom za tri gledalce.',
          },
        ],
      },
      {
        label: 'Ni denarja za zabavo',
        effect: { happy: -5 },
        news: 'Festivala letos ne bo. Mladina se zabava na avtobusni postaji, ker drugega ni.',
      },
    ],
  },

  // --- Seasonal cards ---------------------------------------------------------
  {
    id: 'ice-rink',
    season: 'winter',
    title: 'Drsališče na trgu',
    text: 'Turistično društvo bi pred cerkvijo postavilo drsališče. Elektriko za hlajenje plača občina.',
    options: [
      {
        label: 'Postavi drsališče',
        effect: { budget: -6000, happy: 5 },
        news: 'Drsališče pred cerkvijo je odprto. Prvi dan so imeli tri zvine gležnjev in eno zaroko.',
        later: [
          {
            in: 1,
            chance: 0.4,
            effect: { budget: -3000 },
            news: 'Drsališče se je stopilo, ker je bil januar pretopel. Račun za elektriko pa se ni.',
          },
        ],
      },
      { label: 'Imamo zamrznjen ribnik', effect: { happy: -2 }, news: 'Občina pravi, da je ribnik brezplačno drsališče. Ribe se niso strinjale.' },
    ],
  },
  {
    id: 'plow-contract',
    season: 'winter',
    title: 'Kdo bo plužil?',
    text: 'Za pluženje sta se prijavila dva: bratranec s starim traktorjem in resen ponudnik iz Zgornjih Žlamp.',
    options: [
      {
        label: 'Bratranec',
        effect: { secret: 5000, affair: 5 },
        news: 'Pluženje je dobil bratranec. Traktor je star, a cena je moderna.',
        later: [
          {
            in: 1,
            chance: 0.5,
            effect: { happy: -5 },
            news: 'Bratranec je splužil samo cesto do svoje hiše. In do gostilne.',
          },
        ],
      },
      {
        label: 'Ponudnik iz Žlamp',
        effect: { budget: -3000, happy: 2, envy: 4 },
        news: 'Naše ceste pluži Žlampovec. Ceste so čiste, ponos pa ranjen.',
      },
    ],
  },
  {
    id: 'flower-contest',
    season: 'spring',
    title: 'Najlepše urejen kraj',
    text: 'Občina se lahko prijavi na tekmovanje za najlepše urejen kraj. Komisija pride čez dva meseca.',
    options: [
      {
        label: 'Prijavi se in uredi',
        effect: { budget: -7000, happy: 3 },
        news: 'Občani sadijo rože. Nekateri tudi pri sosedih, »da bo enotno«.',
        later: [
          {
            in: 2,
            chance: 0.5,
            effect: { propaganda: 8, budget: 5000 },
            news: 'Zmaga! Naša občina je najlepše urejen kraj. Nagrado so porabili za nove rože.',
            elseEffect: { envy: 5 },
            elseNews: 'Zmagale so Zgornje Žlampe. Spet. Komisija je bila menda na kosilu pri njihovem županu.',
          },
        ],
      },
      { label: 'Lepota je v očeh opazovalca', effect: {}, news: 'Občina se ni prijavila. Regrat ob cesti je ostal neomajen.' },
    ],
  },
  {
    id: 'spring-cleanup',
    season: 'spring',
    title: 'Čistilna akcija',
    text: 'Društva predlagajo čistilno akcijo »Očistimo občino«. Občina bi plačala rokavice, vreče in malico.',
    options: [
      {
        label: 'Organiziraj akcijo',
        effect: { budget: -1000, happy: 2, propaganda: 2 },
        news: 'Na čistilni akciji so našli tri kolesa, en hladilnik in županov plakat iz leta 2014.',
      },
      { label: 'Saj je čisto', effect: { envy: 2 }, news: 'Čistilne akcije ne bo. Hladilnik ob potoku ostaja kulturna znamenitost.' },
    ],
  },
  {
    id: 'swimming-pool',
    season: 'summer',
    title: 'Kopališče',
    text: 'Vroče je. Občani zahtevajo kopališče, saj ga imajo v Zgornjih Žlampah. Seveda.',
    options: [
      {
        label: 'Uredi kopališče',
        effect: { budget: -25000, happy: 8, modifier: { key: 'pool', label: 'Vzdrževanje kopališča', months: 12, monthlyBudget: -800 } },
        news: 'Kopališče je odprto. Reševalec iz vode je bratranec, ki ne zna plavati, zna pa piskati.',
      },
      { label: 'Imamo potok', effect: { happy: -5, envy: 5 }, news: 'Župan: »Imamo potok.« Potok je globok 20 centimetrov.' },
    ],
  },
  {
    id: 'hailstorm',
    season: 'summer',
    title: 'Toča',
    text: 'Toča je poškodovala strehe in vrtove. Vrtičkarji jokajo, krovci se smejijo.',
    options: [
      {
        label: 'Pomoč prizadetim',
        effect: { budget: -10000, happy: 6 },
        news: 'Občina je razdelila pomoč po toči. Nekateri so prijavili škodo tudi na strehah, ki jih nimajo.',
      },
      {
        label: 'To je višja sila',
        effect: { happy: -6 },
        news: 'Župan: »Toča je višja sila.« Prizadeti: »Župan tudi.«',
        later: [
          {
            in: 2,
            chance: 0.5,
            effect: { affair: 6 },
            news: 'Razkrito: razpis za popravilo streh je dobil bratranec. Strehe še vedno niso popravljene.',
          },
        ],
      },
    ],
  },
  {
    id: 'martinovanje',
    season: 'autumn',
    title: 'Martinovanje',
    text: 'Vinarji bi pred cerkvijo krstili mošt. Pričakujejo, da župan nastopi kot boter. In plača pogostitev.',
    options: [
      {
        label: 'Bodi boter mošta',
        effect: { budget: -3000, happy: 6 },
        news: 'Mošt je krščen v vino. Župan je bil boter, pevski zbor je bil glasnejši kot ponavadi.',
        later: [
          { in: 1, chance: 0.5, effect: { propaganda: -2 }, news: 'Po martinovanju so v občinski upravi trije na bolniški. Iz »zdravstvenih razlogov«.' },
        ],
      },
      { label: 'Ne pijem', effect: { happy: -3 }, news: 'Župan je zavrnil martinovanje. Vinarji so ga prekrstili v »tistega, ki ne pije«.' },
    ],
  },
  {
    id: 'chestnut-picnic',
    season: 'autumn',
    title: 'Kostanjev piknik',
    text: 'Društvo upokojencev {loc} bi organiziralo kostanjev piknik. Prosijo za kostanj, mošt in pomoč pri ognju.',
    district: 'random',
    options: [
      {
        label: 'Plačaj kostanj',
        effect: { budget: -1500, districtHappy: 6, othersEnvy: 3 },
        news: 'Kostanjev piknik {loc} je uspel. Ogenj so zakurili trikrat, gasilce poklicali enkrat.',
      },
      { label: 'Kostanj raste zastonj', effect: { districtHappy: -4 }, news: 'Upokojenci {loc} nabirajo kostanj sami. In pišejo pritožbe.' },
    ],
  },
];

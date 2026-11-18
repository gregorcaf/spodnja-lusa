// Citizens' wishes (Slovenian player-facing text). All fictional.
//
// Fields: id, text ({loc} = the citizen's home district, {male|female} for gender),
//   cost: € to fulfil by paying, or build: building type to build in the citizen's district,
//   character: optional character key – only citizens of that type make this wish.
//   season: optional – only wished for in that season.

export const WISHES = [
  // --- Paid wishes -----------------------------------------------------------
  { id: 'bench', cost: 1500, text: 'Klop pred hišo. Da bom imel{|a} kje sedeti in gledati, kdo hodi mimo.' },
  { id: 'mirror', cost: 1200, text: 'Ogledalo na ovinku {loc}. Že tretjič sem skoraj zbil{|a} soseda. Ne namerno.' },
  { id: 'village-sign', cost: 800, text: 'Novo tablo z imenom vasi. Na stari manjka črka in zdaj piše nekaj nespodobnega.' },
  { id: 'dog-park', cost: 3000, text: 'Pasji park {loc}. Moj pes nima kje teči, odkar je sosed postavil ograjo.' },
  { id: 'street-light', cost: 2500, text: 'Ulično svetilko pred hišo. Da vidim, kdo mi krade češnje.' },
  { id: 'speed-bump', cost: 1800, text: 'Ležečega policaja pred hišo. Ali dva. Ali pet.' },
  { id: 'choir-uniforms', cost: 2000, text: 'Nove uniforme za pevski zbor. Stare so iz leta 1987 in temu primerno dišijo.' },
  { id: 'glass-bin', cost: 900, text: 'Zabojnik za steklo {loc}. Iz… vrtnarskih razlogov.' },
  { id: 'birthday', cost: 2500, text: 'Proslavo za moj 80. rojstni dan. Z ansamblom. In z županom, ki bo govoril.' },
  { id: 'vine', cost: 1000, text: 'Popravilo brajde pri cerkvi. Grozdje bo letos dobro, če ga ne pojedo kosi.' },
  { id: 'cemetery-wifi', cost: 2200, text: 'Wi-Fi na pokopališču. Da lahko med obiski pokličem vnuke. In jim povem, kdo je umrl.' },
  { id: 'bin-hedgehog', cost: 600, text: 'Nov koš za smeti na avtobusni postaji. V starem zdaj živi ježeva družina.' },
  { id: 'toilet', cost: 1600, text: 'Javno stranišče na tržnici. Ker ga ni. Pa je nujno. Verjemite mi.' },
  { id: 'flag', cost: 700, text: 'Novo zastavo pred vaškim domom. Stara je zbledela v barvo dvoma.' },
  { id: 'facade', cost: 3000, text: 'Novo fasado vaškega doma {loc}. V barvi, ki jo izberem jaz.' },
  { id: 'hayrack-replica', cost: 4000, text: 'Nov kozolec za razstavo. Starega sta odnesla veter in sosed.' },
  { id: 'seniors-dance', cost: 1500, text: 'Ples za upokojence. Z ansamblom, ki ne igra preglasno. Ali pretiho.' },
  { id: 'well', cost: 2800, text: 'Obnovo starega vodnjaka {loc}. Voda ni pitna, je pa zelo fotogenična.' },
  { id: 'bus-shelter', cost: 2000, text: 'Nadstrešek na avtobusni postaji {loc}. Avtobusa sicer ni, dež pa je.' },
  { id: 'chapel-paint', cost: 1300, text: 'Prepleskano kapelico ob poti. Svetnik na njej je že ves sivolas.' },
  { id: 'ping-pong', cost: 1100, text: 'Mizo za namizni tenis {loc}. Za mladino. In zame, ob torkih.' },
  // Character-specific paid wishes
  { id: 'helmets', cost: 3500, character: 'firefighter', text: 'Nove gasilske čelade. Stare so dobre, nove pa bolj sijoče.' },
  { id: 'drill', cost: 1000, character: 'firefighter', text: 'Gasilsko vajo pred mojo hišo. Da sosedje vidijo, s kom imajo opravka.' },
  { id: 'computer-course', cost: 1500, character: 'inspector', text: 'Tečaj računalništva za upokojence. Da bom lahko komentiral{|a} tudi jaz.' },
  { id: 'binoculars', cost: 900, character: 'inspector', text: 'Daljnogled za nadzor gradbišč. Za javno dobro, seveda.' },
  { id: 'chickens', cost: 1200, character: 'gardener', text: 'Subvencijo za kokoši. Jajca so predraga, kokoši pa preveč samostojne.' },
  { id: 'fence', cost: 1400, character: 'gardener', text: 'Ograjo okoli vrtička. Srna je pojedla mojo solato in se mi smejala.' },
  { id: 'stall', cost: 2000, character: 'entrepreneur', text: 'Stojnico na tržnici za moj s. p. Brez razpisa, prosim. Saj ste me razumeli.' },
  { id: 'apology', cost: 500, character: 'grumbler', text: 'Opravičilo župana v glasilu. Ker me lani ni pozdravil na pogrebu.' },
  { id: 'read-comment', cost: 400, character: 'commenter', text: 'Da na seji preberejo moj komentar. Ima samo 14 strani.' },

  // Seasonal paid wishes
  { id: 'xmas-lights', cost: 1500, season: 'winter', text: 'Novoletne lučke {loc}. Lani so bile samo pri sosedu in to ni bilo pošteno.' },
  { id: 'plowed-yard', cost: 800, season: 'winter', text: 'Da mi zimska služba spluži dvorišče. Saj sem jim lani pomahal{|a}.' },
  { id: 'flower-boxes', cost: 700, season: 'spring', text: 'Cvetlična korita na mostu {loc}. Lepše bo, pa še komisija bo vesela.' },
  { id: 'bee-hotel', cost: 500, season: 'spring', text: 'Hotel za čebele {loc}. Brez razpisa, prosim, čebele so poštene.' },
  { id: 'sunshade', cost: 900, season: 'summer', text: 'Senčnik na tržnici. Moji paradižniki in jaz potrebujemo senco.' },
  { id: 'kids-pool', cost: 4000, season: 'summer', text: 'Bazen za otroke {loc}. In za upokojence ob torkih.' },
  { id: 'chestnut-stove', cost: 600, season: 'autumn', text: 'Peč za kostanj na trgu. Da bo dišalo po jeseni in ne po tovarni.' },
  { id: 'leaves', cost: 700, season: 'autumn', text: 'Da kdo pograbi listje pred cerkvijo. Ne jaz, da ne bo pomote.' },

  // --- Building wishes (fulfilled by building in the citizen's district) ------
  { id: 'road-1', build: 'road', text: 'Novo cesto {loc}. Da ne bom več hodil{|a} čez sosedov travnik. Čeprav mi je všeč.' },
  { id: 'road-2', build: 'road', text: 'Pločnik ob cesti {loc}. Ali vsaj cesto, ob kateri bi bil pločnik.' },
  { id: 'house-1', build: 'house', text: 'Novo hišo {loc} za mojega otroka. Za tistega, ki prej pride domov.' },
  { id: 'house-2', build: 'house', text: 'Več sosedov {loc}. Da bo imel kdo poslušati moje zgodbe.' },
  { id: 'roundabout-1', build: 'roundabout', text: 'Krožišče {loc}! Žlampe ga imajo, mi pa ne?' },
  { id: 'roundabout-2', build: 'roundabout', text: 'Krožišče s kipom {loc}. Kip bi lahko bil jaz.' },
  { id: 'firehouse-1', build: 'firehouse', text: 'Gasilski dom {loc}. Za vaje in veselice. Predvsem veselice.' },
  { id: 'inn-1', build: 'inn', text: 'Gostilno {loc}. Do najbližje je 800 metrov, to je predaleč za v copatih.' },
  { id: 'inn-2', build: 'inn', text: 'Še eno gostilno {loc}. Za konkurenco. Cene piva so nesprejemljive.' },
  { id: 'factory-1', build: 'factory', character: 'entrepreneur', text: 'Tovarno {loc}. Za delovna mesta! Moja hiša je itak na drugem koncu.' },
  { id: 'hall-1', build: 'hall', text: 'Večnamensko dvorano {loc}. Za namene.' },
  { id: 'shop-1', build: 'shop', text: 'Trgovino {loc}. Za kruh, mleko in da izvem, kaj je novega.' },
  { id: 'vineyard-1', build: 'vineyard', text: 'Vinograd {loc}. Za zdravje. Moje.' },
  { id: 'police-1', build: 'police', character: 'inspector', text: 'Policijo {loc}. Nekdo mora zapisovati, kdo kje parkira. Do zdaj sem to delal{|a} jaz.' },
  { id: 'cemetery-1', build: 'cemetery', character: 'grumbler', text: 'Pokopališče {loc}. Da bom imel{|a} kam iti, ko bom vsega sit{|a}.' },
];

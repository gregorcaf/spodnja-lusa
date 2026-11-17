# Načrt B: Slovenska občina — prototip

Zgradi delujoč prototip satirične simulacije tipične slovenske občine. Igralec je župan, ki ne odloča o prihodnosti občine, ampak o tem, kateri bratranec dobi razpis in kako preusmeriti fovšijo občanov. Ves tekst v igri naj bo v duhoviti slovenščini. Vsi liki, kraji in podjetja so izmišljeni.

Cilj prototipa je preveriti, ali osnovna logika deluje in je zabavna. Detajle dodajamo kasneje.

## Tehnologija
- Vite + vanilla JavaScript (ali TypeScript) + Three.js
- 2.5D izgled: Three.js z **ortografsko kamero** v izometričnem pogledu. Objekti so preprosti low-poly 3D modeli iz osnovnih geometrij (škatle, valji, stožci), brez zunanjih grafik.
- Prednostna naprava je **računalnik** (podpora za telefon pride kasneje)
- **Logika igre naj bo ločena od izrisa** (npr. `src/game/` za stanje in pravila, `src/render/` za Three.js, `src/ui/` za HTML vmesnik). Tako bomo kasneje lažje zamenjali kamero za pravi 3D ali dodali mobilni vmesnik.
- Vse nastavljive številke naj bodo v enem objektu `CONFIG`, ki ga uporablja tudi razvijalski panel.

## Zemljevid
- Mreža 16×16 polj
- Občina je razdeljena na 4 konce (kvadrante 8×8): **Zgornja vas** (SZ), **Gorenji Hrib** (SV), **Spodnja vas** (JZ), **Za Gmajno** (JV). Meje naj bodo subtilno vidne, imena koncev pa izpisana na zemljevidu.
- Začetno stanje: dve glavni cesti, ki se križata čez sredino, nekaj stranskih ulic, okoli 20 hiš, razporejenih po vseh koncih, in cerkev blizu središča (ne da se je podreti).

## Kamera (miška)
- Kolesce: zoom
- Vlečenje z desnim gumbom: premikanje
- Gumba ⟲ ⟳ na zaslonu: obrat pogleda za 90°

## Gradnja
Igralec izbere objekt v orodni vrstici in klikne polje.

| Objekt | Cena | Mesečno vzdrževanje | Pravilo |
|---|---|---|---|
| Cesta | 2.000 € | 30 € | na travnik |
| Hiša | 10.000 € | 0 € (prinaša davke) | na travnik |
| Krožišče | 60.000 € | 500 € | samo na obstoječo cesto, s kipom na sredini |
| Gasilski dom | 35.000 € | 1.000 € | na travnik |
| Večnamenska dvorana | 140.000 € | 3.000 € | na travnik |
| Podiranje | 1.000 € | – | cerkve ni mogoče podreti |

Če ni dovolj denarja ali polje ni primerno, prikaži kratko hudomušno obvestilo, npr. »Krožišče gre na cesto. Na travnik ga postaviš šele v drugem mandatu.«

**Predogled gradnje:** ko je izbran objekt in igralec z miško zapelje čez polje, se prikaže prosojen objekt (zelen, če je gradnja mogoča, rdeč, če ni) in napoved učinka, npr. »+15 sreča v Zgornji vasi · +12 fovšija drugod · −60.000 €«.

## Občani
- 25 občanov s slovenskimi imeni, npr. Janez Novak, Mojca Horvat, Jože Kranjc, Francka Zupan, Lojze Potočnik, Marija Kovačič, Franc Mlakar, Anica Vidmar, Tone Kos, Metka Golob, Štefan Turk, Pepca Božič, Rudi Krajnc, Zdenka Zorman, Miran Kralj, Vida Hribar, Boris Dolenc, Nada Petek, Silvo Rozman, Danica Medved, Marjan Zajc, Jožica Kastelic, Darko Pirc, Branka Oblak, Matjaž Žagar
- Vsak ima: domači konec, značaj (Večni nergač, Prostovoljni gasilec, Upokojenec nadzornik, Facebook komentator, Mali podjetnik, Vrtičkar), **Srečo (0–100)**, **Fovšijo (0–100)** in trenutno misel
- Sprehajajo se po cestah (in krožiščih) z gladkim gibanjem. Raje ostajajo v svojem koncu. Predstavljeni so kot preproste figurice, obarvane glede na razpoloženje (zelena = zadovoljen, rumena = neodločen, rdeča = nezadovoljen).
- Misli se izbirajo glede na stanje: visoka fovšija (»Zakaj imajo na Gorenjem Hribu krožišče, mi pa samo luknje?«), nizka sreča, visoka sreča, sneg, veselica, propaganda in značaj ter splošne misli. Misel se zamenja vsakih nekaj sekund.
- Občasno se nad naključnim občanom za nekaj sekund prikaže mehurček z njegovo mislijo.
- **Prehod z miško** čez občana pokaže ime in misel. **Klik** odpre okence z imenom, značajem, domačim koncem, vrsticama Sreča in Fovšija, mislijo in podatkom, na koga je fovšen.

## Mehanika fovšije (jedro igre)
Ob vsaki gradnji v konca X:
- občani konca X dobijo srečo,
- občani vseh ostalih koncev dobijo fovšijo (nasprotni konec ×1,3) in si zapomnijo, kaj in kje je bilo zgrajeno,
- nekateri objekti vplivajo na srečo vseh.

| Objekt | Sreča domačih | Fovšija drugod | Sreča vseh |
|---|---|---|---|
| Cesta | +2 | +1 | 0 |
| Hiša | +3 | +2 | 0 |
| Krožišče | +15 | +12 | +3 |
| Gasilski dom | +6 | +4 | +6 |
| Večnamenska dvorana | +10 | +15 | −3 |

Pri podiranju naj bo učinek smiseln in hudomušen (npr. podrta hiša: domači −6 sreče, ostali −2 fovšije, ker so na skrivaj zadovoljni).

**Karta fovšije:** gumb na zaslonu vklopi ali izklopi prekrivno plast, ki vsak konec obarva glede na povprečno fovšijo njegovih občanov (zelena → rdeča).

## Čas: potezno
- Brez teka časa. Gumb **»Naslednji mesec«** premakne igro za en mesec (začetek: april 2026).
- Ob vsakem mesecu:
  - prihodki: 6.000 € + 300 € na hišo
  - stroški: 7.000 € (plače in kava občinske uprave) + vzdrževanje objektov
  - sreča vsakega občana se za 6 % približa vrednosti 35, fovšija naraste za +1 (»vedno kaj najdejo«)
  - propaganda pade za 1, tveganje afere za 0,5
- **Mesečno poročilo:** po kliku se pokaže kratko okno s prihodki, stroški, novim stanjem proračuna, najbolj zadovoljnim in najbolj fovšnim koncem ter »mislijo meseca« naključnega občana.
- Proračun je omejen (začetek 150.000 €). Gradnja in vzvodi niso mogoči brez denarja. Poraza zaradi minusa ni.

## Županovi vzvodi (gumbi)
| Vzvod | Cena | Učinek |
|---|---|---|
| Razpis za bratranca | 4.000 € | Skrivni račun +12.000 do 25.000 €, tveganje afere +10 do 18 |
| Glasilo: Hvalospevi županu | 2.000 € | Propaganda +8 (vsaka naslednja uporaba ×0,75, učinek se počasi obnovi), nekaterim nergačem fovšija +2 |
| Glasilo: Glejte sosednjo občino! | 2.000 € | Vsem fovšija −12 (vsakič ×0,75), fovšijo usmerijo na sosednjo občino |
| Nenadni sneg sredi maja | 6.000 € | Snežinke in bela pokrajina do naslednjega meseca, občani hodijo počasneje, sreča vseh −8, skrivni račun +8.000 € (zimska služba), tveganje afere −10 (mediji fotografirajo sneg) |
| Gasilska veselica | 5.000 € | Zahteva vsaj en gasilski dom. Vsi občani za približno 20 sekund odidejo k domu in plešejo (lučke, notice), fovšija −20, sreča +10 (vsakič ×0,75) |

Vsak vzvod ob uporabi doda novico v vrstico in pokaže kratko obvestilo.

## Prikaz stanja (zgornja vrstica)
Datum · Proračun (in mesečni saldo) · Skrivni račun · Tveganje afere (%) · Povprečna sreča · Povprečna fovšija · Podpora županu (število občanov, pri katerih je sreča − 0,7 × fovšija + propaganda > 25, od 25)

Tveganje afere in podpora se v prototipu samo prikazujeta in nimata posledic.

## Novice
Vrstica na dnu zaslona, ki se pomika, z **fiksnim seznamom 15–20 hudomušnih lokalnih novic**, ki se vrtijo, plus novice, ki jih sprožijo gradnja in vzvodi. Primeri tona:
- Župan ob 10. uri napihal 2 promila. Pojasnilo: »Bil sem na degustaciji v okviru projekta Okusi naše občine.«
- Novo krožišče ima štiri izvoze. Vsi vodijo do iste gostilne.
- Gasilci so v rekordnih štirih minutah pogasili požar. Gorel je žar pri gasilskem domu.
- Francka je prijavila soseda, ker je v nedeljo kosil ob 7.01.
- Na razpis za čiščenje snega se je prijavil en sam ponudnik. Ima en plug in tri Audije.
- Lojze trdi, da je videl medveda. Medved zanika.

## Razvijalski panel
Gumb na zaslonu odpre panel z drsniki za ključne številke iz `CONFIG`: cene objektov, učinke gradnje, moč fovšije (množitelj), mesečne prihodke in stroške, učinke vzvodov in hitrost hoje občanov. Spremembe veljajo takoj. Gumb »Ponastavi« vrne privzete vrednosti.

## Postavitev vmesnika (računalnik)
- Levo in v sredini: 3D zemljevid
- Desno: stranski panel z orodji za gradnjo, vzvodi in gumbom »Naslednji mesec«
- Zgoraj: vrstica stanja
- Spodaj: vrstica z novicami
- Nad zemljevidom: gumbi za obrat kamere, karto fovšije in razvijalski panel

## Izven obsega prototipa
Volitve, poraz, KPK, čakalni časi na vzvodih, avtomatski tek časa, novice s posledicami, shranjevanje igre, mobilni vmesnik.

## Ko končaš
- Igra naj se zažene z `npm install && npm run dev`, brez napak v konzoli.
- Preveri ročno: gradnja vseh objektov, predogled, karta fovšije, vseh 5 vzvodov, »Naslednji mesec« s poročilom, klik in prehod z miško čez občana, razvijalski panel.
- Na kratko povzemi strukturo projekta in kje se nahaja `CONFIG`.
# DBash: ontwerpdocument

*Versie 0.1 · 15 november 2026 · prototype: `DBash-prototype.html`*

DBash is een **slimme terminal voor Debian** waarin een lokale AI helpt met commando's. Je kunt altijd terug naar een veilig punt. Het programma draait volledig op je eigen pc, zonder installatie (AppImage) en zonder cloud.

---

## 1. Doel

- Vragen in gewone taal stellen ("kijk na of bluetooth werkt") en Debian-commando's terugkrijgen.
- Commando's veilig uitvoeren: **een herstelpunt vóór elke wijziging**, en bij het afsluiten kiezen tussen **bewaren** of **terugdraaien**.
- Alles lokaal: de AI draait als llamafile op de eigen GPU.
- Retrostijl die past bij het bureaublad van de gebruiker (KDE, pixel-iconen).

## 2. Doelsysteem (referentie-pc)

| Onderdeel | Waarde |
|---|---|
| OS | Debian 13 (trixie), KDE Plasma |
| GPU | AMD Radeon RX 9070 XT, 16 GB, via **Vulkan** (RADV) |
| CPU | AMD Ryzen 5 9600X (AVX-512) |
| RAM | 32 GB |
| Extra | Steam |

## 3. AI-motor

- **llamafile 0.10.x** van Mozilla.ai: één bestand, geen installatie.
- Starten: `<model>.llamafile --gpu vulkan -ngl 999 --reasoning off` (server op `127.0.0.1:8080`, OpenAI-compatibele API).
- `--reasoning off` zet het hardop nadenken van Qwen3.5 uit. Een `<think>`-blok wordt ook nog in de app weggefilterd.
- **Modellen** (map `~/DBash/Models`):

| Model | Grootte | Rol |
|---|---|---|
| Qwen3.5-9B-Q5_K_S | 7,4 GB | dagelijks (standaard) |
| gpt-oss-20b-mxfp4 | 12 GB | moeilijke vragen |
| Qwen3.5-4B-Q5_K_S | 4,1 GB | snel |
| Qwen3.5-2B / 0.8B | 3,2 / 1,6 GB | test / reserve |

- Alles tot ongeveer 14 GB past volledig op de GPU. Groter dan dat draait deels op de CPU.
- **Wisselen van model kost laadtijd.** De llamafile wordt herstart en het model gaat van de schijf naar de VRAM. Grove schatting op NVMe: 4B een paar seconden, 9B ongeveer 5–10 s, 20B ongeveer 10–20 s. De tweede keer gaat het veel sneller, omdat het bestand vaak nog in de RAM-cache zit.
  - Dat is altijd zichtbaar:
    - in de terminal: `⏳ Loading <model> [██████░░░░] 60% ~18 s`,
    - in de bovenbalk: `LOADING 20B…`, met een knipperend oranje lampje,
    - op de modelknop onderaan: `⏳60%`.
  - Een vraag die je tijdens het laden stelt, wacht en wordt daarna automatisch verstuurd. Wissel je opnieuw tijdens het laden, dan wordt het vorige laden geannuleerd.
  - Optie voor later: 9B en 4B samen geladen houden (ongeveer 11,5 GB), zodat je zonder wachten wisselt.
- **Systeemprompt** bevat: Debian-assistent, antwoordtaal (EN/NL), commando's in ```` ```bash ````-blokken, de systeeminfo van de gebruiker, en bij web-zoeken de regels uit §8.

### 3b. Modellenbeheer

- **Map:**
  ```
  ~/DBash/Models/
  ├─ Qwen3.5-9B-Q5_K_S.llamafile   ← actieve modellen
  ├─ <eigen-model>.gguf             ← zelf toegevoegd
  ├─ llamafile                      ← motor, voor .gguf-bestanden
  └─ old/                           ← vorige versies, met datum
  ```
- **Zelf toevoegen:** zet een `.llamafile` of `.gguf` in de map. DBash ziet het vanzelf, omdat hij de map in de gaten houdt (inotify). Het model krijgt het label **manual**, en er is geen automatische update-controle voor.
  - `.gguf` start met `llamafile -m model.gguf`.
  - In het prototype voeg je een model toe met **＋** bij Models, of door het bestand op LIBRARY te slepen.
- **Een model hoeft geen speciale naam te hebben.** DBash leest de GGUF-metadata (architectuur, grootte, quantisatie, context, chat-template). Wel moet het een *instruct/chat*-model zijn: een base-model voert geen gesprek.
- **Updates:**
  - In ⚙ → AI → **Model updates**:
    - **Off**,
    - **Notify** (standaard): toont **↑**,
    - **Auto-download**: downloadt vanzelf, maar vraagt altijd voordat het model vervangen wordt.
  - **⤓ UPDATE** downloadt de nieuwe versie **naast** de oude, met een voortgangsbalk, en je kunt intussen verder werken.
  - Daarna volgen een controle (checksum) en een teststart. Dan staat het model op **⇪ ready**, en bevestig je met **✓ ACTIVATE NOW** of **LATER**.
  - De oude versie gaat naar `old/`. Via **Keep old versions** kies je: **none / 1** (standaard) **/ all**.
- **old/ in de boom:** het aantal en de grootte, **⟲** om terug te gaan naar een versie (de nieuwere gaat dan naar old/), **✕** om een versie te verwijderen, en **🗑** om alles op te ruimen.
- **Overzicht:** "Models (6 · 42.6 GB · 2↑)", met in de tooltip ook de ruimte die oude versies innemen. Waarschuwen bij weinig schijfruimte, vóór een download.
- **Verwijderen:** met **✕** bij een model, na bevestiging. Het bestand gaat naar de prullenbak.

## 4. Interface

- **Vensterstijlen:** *Window* (met titelbalk), *CRT monitor* (afgerond) en *Bare* (zonder rand, voor de echte app, waar KDE de titelbalk tekent).
- **Thema's:** **DBash** (standaard: warm bruin `#24201c`, beige `#d8c8a8`, mosterd `#e0b030`, bordeaux `#9a2e40`), Green, Amber, White, C64, IBM Blue, Debian.
- **Meerkleurige tekst** (aan of uit), met per thema:
  - `ok` voor goed (groen),
  - `warn` voor waarschuwing (oranje),
  - `err` voor fout (rood),
  - `info` voor web/info (blauwgroen).
- **Prompt** zoals bash: `gebruiker@host:~$`. In de echte app komt dit uit `$USER`, `hostname` en de huidige map.
- **Lettertype:** standaard IBM Plex Mono. Ook beschikbaar: JetBrains Mono, VT323, Share Tech Mono, Press Start 2P en Courier. Een schuifje regelt de grootte.
- **Effecten:** scanlijnen, gloed, flikkeren en een typemachine-effect bij het opstarten.
- **Panelen** (rechts, één tegelijk open):
  - ⚙ **Instellingen**, met de tabbladen **AI · LOOK · SYSTEM · SAFETY · FILES**,
  - 💬 **Gesprekken**.
- **Onderbalk:**
  - het vakje **WEB** (per gesprek),
  - de knop **⟲ RESTORE POINTS** (klapt de tijdlijn uit),
  - **modelknoppen** (modellen met een ster ★), met **▾** voor alle modellen.
- **Mobiel:** een compacte onderbalk. Het programma is bedoeld voor desktop.

## 5. Terminal

- **Gewoon typen** stelt een vraag aan de AI. `? vraag` mag ook.
- **`!commando`** voert een commando uit.
- **Ingebouwde commando's:**
  - `help`, `clear`, `settings`, `chats`, `book`, `new`, `list`, `open <nr>`, `search <woord>`, `history`,
  - `downloads`, `models`, `use <nr>`, `updates`, `upgrade`, `points`, `wizard`,
  - `!web <woorden>`, `!get <url>`, `!open <site>`, `!read <site>`.
- **Toetsen:**
  - **↑/↓** haalt eerdere commando's terug (er worden er 200 bewaard).
  - **Tab** vult aan zoals in bash: één match wordt aangevuld, bij meerdere komt het gemeenschappelijke begin of de lijst.
  - **Ctrl+L** maakt het scherm leeg.
- **AI-antwoorden:** het label "◆ AI · model" erboven. `code`, **vet** en links krijgen een kleur. Codeblokken worden uitvoerbare commandoregels met **▶ RUN**.

## 6. Commandoveiligheid

**Risico-labels**, automatisch per commando:

| Label | Betekenis | Gedrag |
|---|---|---|
| **SAFE** (groen) | leest alleen (`systemctl status`, `ls`) | direct uitvoeren, geen herstelpunt |
| **SUDO** (oranje) | verandert het systeem (`sudo`, `apt install`, `rm`, `mv`, `systemctl enable`…) | eerst een herstelpunt |
| **DANGER** (rood) | kan data vernietigen (`rm -rf`, `dd`, `mkfs`, `wipefs`, `fdisk`, `curl … \| sh`, kernel/systemd/libc verwijderen…) | altijd extra bevestiging (CONFIRM binnen 5 s, of RUN ANYWAY) en altijd een nieuw herstelpunt |

**Fouten:**
- De uitvoer van een mislukt commando wordt rood getoond, met de knop **◆ ASK AI**.
- Die knop stuurt het commando en de foutmelding naar de AI, voor uitleg en een oplossing.

**? EXPLAIN:**
- Naast **▶ RUN** staat bij elk commando **? EXPLAIN**. Dat kan ook met `explain <commando>`.
- De AI legt het commando dan stukje per stukje uit, voor een beginner, en zegt of het riskant is.
- Het prototype gebruikt hiervoor een ingebouwde woordenlijst, bijvoorbeeld `-xf` → "extract from this file".

**Logboek:**
- Alles wat DBash uitvoert, wordt vastgelegd: de tijd, het commando, het risico, of het gelukt is, na welk herstelpunt, de eerste uitvoer en het gesprek.
- Je vindt het onder LIBRARY → **Log** (met het aantal en het aantal mislukte commando's), of met het commando `log`.
- Klik op een regel voor de details en een link naar het gesprek. **⤓** exporteert naar `dbash-log.txt`.
- Er worden 500 regels bewaard.

## 7. Herstelpunten

- **Altijd automatisch**, en niet uit te zetten: vóór het eerste wijzigende commando van elke nieuwe taak (elk AI-antwoord), en vóór elk DANGER-commando.
- **Methode:**
  - **Timeshift** (rsync, werkt op ext4, de standaard),
  - **Btrfs-snapshots** (direct, vraagt een btrfs-systeemschijf).
- **Tijdlijn**, uitklapbaar onderaan:
  - ruitjes per punt, met tijd en "+N changes",
  - een knipperende **NOW**,
  - het eerste punt van de sessie is gevuld.
- **Klik op een punt** voor een kaartje met de reden, de methode, de wijzigingen die teruggedraaid worden, **⟲ ROLL BACK TO HERE** (dubbele bevestiging) en **DELETE**.
- **Bij het afsluiten**: "This session made N changes" → **KEEP CHANGES** of **ROLL BACK SESSION** (of annuleren).
- In de echte app heeft terugdraaien rootrechten nodig (via een pkexec/KDE-wachtwoordvenster) en soms een herstart.

## 8. Web zoeken en downloaden

**Web zoeken:**
- Een vakje **per gesprek**, standaard uit. Het wordt mee bewaard met het gesprek.
- Zoeken gebeurt via **DuckDuckGo**. Het prototype gebruikt de Instant Answer API, de echte app gebruikt volledige resultaten.
- Bronnen worden getoond als `[1]`, `[2]`, en de AI citeert ze.

**Veiligheid van web-antwoorden:**
- Webresultaten zijn **onbetrouwbare data**. De prompt verbiedt de AI om instructies uit webpagina's te volgen.
- Commando's uit een antwoord dat web gebruikte, krijgen het label **WEB**. Ze vragen **altijd** bevestiging, met de waarschuwing dat pagina's verborgen instructies kunnen bevatten.

**Downloads:**
- De AI zet links in ```` ```download ````-blokken. Die worden een downloadkaartje met:
  - de bestandsnaam en het domein,
  - **✓ trusted** (GitHub, debian.org, Steam, Flathub…) of **⚠ unknown**,
  - **DOWNLOAD** of **CANCEL**.
- Er wordt **nooit iets automatisch gedownload, geopend of uitgevoerd**.
- De AI stelt eerst **apt** voor, en geeft voorrang aan officiële bronnen.
- Downloads komen in de map **`~/DBash/Downloads`** (instelbaar).

**Websites openen:**
- Wil je een website bezoeken of vinden, dan zet de AI de link in een ```` ```open ````-blok. Dat wordt een websitekaartje met het domein, **✓ trusted site** of **⚠ unknown site**, en de knop **↗ OPEN IN BROWSER**.
- Elke webbron `[1]`, `[2]` krijgt een knop **↗ OPEN**.
- Met `!open <site>` open je zelf een website.
- Er wordt nooit iets automatisch geopend: het gebeurt altijd met een klik. In de echte app gebeurt dit via `xdg-open`, in je standaardbrowser.

**Leesmodus (reader mode):**
- DBash haalt de pagina op en toont ze als tekst in de terminal, zoals de tekstbrowsers lynx en w3m:
  - de titel en de koppen in de accentkleur,
  - de tekst en de lijsten,
  - genummerde links `[1]`, `[2]`.
- Codeblokken op de pagina worden commandoregels met een risico-label en het label **WEB**, dus ze vragen altijd bevestiging.
- Een link naar een bestand (`.tar.gz`, `.deb`, `.AppImage`, `.iso`…) geeft een downloadkaartje. Een gewone link opent opnieuw in leesmodus.
- Onderaan staan de knoppen **↗ OPEN IN BROWSER** en **◆ SUMMARIZE**. Bij een samenvatting is de paginatekst onbetrouwbare data.
- **Instelling** in ⚙ → FILES → **WEBSITES** → *Reader mode*:
  - **Aan:** websitekaartjes en bronnen tonen **≡ READER MODE / ≡ READ** en **↗ OPEN IN BROWSER**.
  - **Uit:** alleen **↗ OPEN IN BROWSER**, en ook `!read` opent dan de browser.
- Commando's: `!read <site>` voor leesmodus, `!open <site>` voor het websitekaartje.
- In de echte app haalt de Rust-backend de pagina op, zonder CORS-beperking. Het prototype toont voorbeeldpagina's als een site het ophalen blokkeert.

## 9. Gesprekken en bibliotheek

- **Gesprekken** worden automatisch bewaard (maximaal 50), met "✓ Saved in …" na het eerste antwoord.
- **Boom met mappen** (standaard *Debian* en *Steam*), plus *Loose chats*:
  - verplaatsen door te slepen of met ⇄,
  - hernoemen met een dubbelklik,
  - **+** bij een map start een gesprek daarin,
  - een map verwijderen vraagt bevestiging, en de gesprekken gaan dan naar Loose chats.
- **Zoeken** in titels, mappen en de inhoud. Exporteren als `.txt`.
- **LIBRARY**, vast onderaan het paneel:
  - **Downloads:** elke bevestigde download, met bron, datum, vertrouwensstatus en een link naar het gesprek.
  - **Models:** het actieve model (●), de grootte, of het past (**GPU ✓** of **part CPU**), een ster ★ voor de onderbalk, en klik om te wisselen.
- **Updates (⟳)**, ook bij het opstarten:
  - **Downloads van GitHub releases:** de nieuwste tag wordt opgevraagd. Is er een nieuwere, dan krijg je **↑ nieuwe-tag** en een downloadkaartje voor de nieuwe asset.
  - **Modellen:** de Hugging Face-repo `mozilla-ai/llamafile_0.10` wordt gecontroleerd. Een update toont **↑**, nieuwe modellen tonen **＋**.

## 9b. Commandoboek (cheat sheet)

- Een eigen paneel met **📖 COMMAND BOOK**, via het boek-icoon bovenaan of het commando `book`.
- De boom: **OS → categorie → commando**, met een korte uitleg bij elk commando.
- **Standaard** zitten **Debian**, **Ubuntu** en **Arch** erin, met de categorieën:
  - System, Packages (apt / apt & snap / pacman), Updates, Services, Network,
  - Hardware & GPU, Bluetooth, Logs, Gaming (Steam).
- Het OS uit ⚙ → SYSTEM staat automatisch open, met de markering **● your system**.
- **Klik op een commando** voor een kaartje in de terminal met:
  - het pad (OS › categorie),
  - de uitleg,
  - het commando met een risico-label en **▶ RUN**,
  - **⇣ PUT IN PROMPT**, dat het commando in de invoerregel zet.
  - Staat er een `<…>`-deel in het commando, zoals `<package>`, dan wordt het niet uitgevoerd. Het komt in de prompt, met het `<…>`-deel geselecteerd zodat je het meteen kunt invullen.
- **Zelf toevoegen:**
  - **+ COMMAND** (OS, bestaande of nieuwe categorie, commando, uitleg). Eigen commando's krijgen **★ own**.
  - **✎** bewerkt een commando, **✕** verwijdert het.
  - **+ OS** maakt een nieuw OS, leeg of als kopie van een bestaand OS (bv. Linux Mint op basis van Ubuntu). Een OS verwijderen vraagt bevestiging.
  - **↺ RESET** zet het boek terug naar de standaard, na bevestiging.
- **Zoeken** in commando's, uitleg en categorieën, of met `book <woord>`.
- **Alles-in-één update** staat onderaan *Updates*:
  - **Debian:** `sudo apt update && sudo apt full-upgrade -y && sudo apt autoremove -y && sudo apt autoclean`
  - **Ubuntu:** hetzelfde, plus `&& sudo snap refresh`
  - **Arch:** `sudo pacman -Syu && (orphans=$(pacman -Qdtq); [ -n "$orphans" ] && sudo pacman -Rns $orphans; true) && sudo paccache -rk2`. Dat werkt alles bij, verwijdert overbodige pakketten (orphans) en houdt 2 oude versies in de cache.
  - Het commando `upgrade` toont deze kaart voor je eigen OS. Uitvoeren gebeurt pas na **▶ RUN**, met eerst een herstelpunt.
- Nieuwe standaardcommando's worden bij een update van DBash toegevoegd aan een eerder bewaard boek. Je eigen commando's blijven bewaard.
- De risico-labels herkennen ook `pacman`, `yay`, `snap`, `do-release-upgrade` en `dpkg --add-architecture`.
- **Aliassen (⚡ korte namen)** staan bovenaan in het boek:
  - Je geeft een lang commando een kort woord, bijvoorbeeld `heroic` → `flatpak run com.heroicgameslauncher.hgl`.
  - Daarna typ je gewoon `heroic` en DBash voert het uit. Daarbij gelden dezelfde risico-labels, herstelpunten en bevestigingen als bij andere commando's. Extra woorden achter de naam worden mee doorgegeven.
  - Een alias aanmaken kan op drie manieren:
    - met **+ ALIAS** in het boek,
    - met **⚡ MAKE ALIAS** op een commandokaartje,
    - in de terminal, in bash-stijl: `alias naam='commando'`. Met `unalias naam` verwijder je er een, en `alias` toont de lijst.
  - De naam mag geen spaties bevatten en mag geen DBash-commando zijn. Tab vult ook aliassen aan.
  - **⤓ TO BASH** schrijft de aliassen als een eigen blok in `~/.bash_aliases`, zodat ze ook in een gewone terminal werken. DBash vervangt daar alleen zijn eigen blok.
  - Standaardvoorbeelden: `heroic` en `btfix`. Opslag: `dbash-aliassen`.
- Opslag: `dbash-boek`. In de echte app wordt dat `~/.config/dbash/book.json`.

## 10. Eerste start (wizard)

1. Welkom.
2. De map met modellen, en de gevonden modellen.
3. AI en GPU testen, met het startcommando erbij.
4. Een methode voor herstelpunten kiezen. Het bestandssysteem wordt gedetecteerd.
5. Een samenvatting.

Overslaan mag. Opnieuw starten kan via `wizard` of ⚙ → AI → SETUP WIZARD.

## 10b. Back-up

- In ⚙ → FILES → **[ BACKUP ]** staan **⤓ EXPORT BACKUP** en **⤒ RESTORE BACKUP**. Dat kan ook met het commando `backup`.
- Eén JSON-bestand met alles: instellingen, gesprekken, mappen, het commandoboek, aliassen, de modellenlijst, downloads, herstelpunten, het logboek en de commandogeschiedenis.
- Terugzetten vraagt bevestiging en vervangt de huidige gegevens. Daarna herstart DBash.
- In de echte app gaan back-ups naar `~/DBash/Backups/`. De modelbestanden zelf zitten er niet in, want die zijn te groot.

## 11. Opslag

- **Prototype:** in de browser (localStorage), met een geheugen-reserve als dat geblokkeerd is. Sleutels: `debhelp` (instellingen), `debhelp-gesprekken`, `debhelp-mappen`, `dbash-downloads`, `dbash-modellen`, `dbash-herstel` en `dbash-cmdhist`.
- **Echte app:** `~/.config/dbash/` (instellingen, gesprekken als JSON), `~/DBash/Downloads`, `~/DBash/Models`.

## 12. Echte app: technisch plan

- **Vorm:** één **AppImage**, gebouwd met **Tauri**: de HTML-interface plus een Rust-backend. Het bestand is ongeveer 10–15 MB. Electron kan ook, maar wordt ongeveer 100 MB.
- **Backend-taken:**
  - de llamafile starten en stoppen (het gekozen model, Vulkan/`-ngl`) en zijn status volgen,
  - commando's echt uitvoeren in een PTY, met live uitvoer en exitcode, wat ASK AI voedt,
  - herstelpunten maken via `timeshift --create/--restore` of btrfs, met rootrechten via pkexec,
  - DuckDuckGo-zoekresultaten en pagina's ophalen (zonder CORS-beperking),
  - downloaden met een voortgangsbalk en checksum-controle,
  - updates controleren (GitHub API, Hugging Face API),
  - systeeminfo uitlezen (`lsb_release`, `lspci`, `lscpu`, `free`, `$USER`, `hostname`).
- **Bouwvolgorde:**
  1. chatten met de llamafile en commando's echt uitvoeren (PTY, risico-labels, ASK AI),
  2. herstelpunten (Timeshift) en de vraag bij het afsluiten,
  3. web zoeken, downloads en updates,
  4. de wizard, modelbeheer en afwerking.

## 12b. Stand van de echte app: versie 0.1.0 (stap 1)

- **Vorm:** `DBash_0.1.0_amd64.AppImage` (ongeveer 82 MB, alles erin). Gebouwd met Tauri 2: Rust-backend plus de prototype-interface. Daarbovenop zorgt `echt.js` ervoor dat de nagebootste delen door de echte backend vervangen worden.
- **Werkt echt:**
  - **Systeeminfo:** gebruiker, host, OS, desktop, GPU met VRAM, CPU, RAM en bestandssysteem. Ze verschijnen in de prompt en gaan mee naar de AI.
  - **Modellen:** DBash zoekt `.llamafile`/`.gguf` in `~/DBash/Models` en `~/Downloads`.
  - **llamafile:** DBash start (`--server --gpu vulkan -ngl 999 --reasoning off`) en stopt hem, en wisselt van model met echte laadtijd. Een log komt in `~/.config/dbash/llamafile.log`. Bij het afsluiten wordt de llamafile gestopt.
  - **AI-chat:** streamend via de backend, dus zonder CORS-problemen.
  - **Commando's:** ze worden echt uitgevoerd (`bash -lc`) en tonen de uitvoer en de exitcode. Daarop werken ASK AI en het logboek.
    - `sudo` vraagt het wachtwoord in een KDE-venster (`ksshaskpass` via `sudo -A`).
    - apt krijgt automatisch `-y` na jouw bevestiging.
    - Interactieve programma's (nano, htop…) worden geweigerd, met een verwijzing naar Konsole.
  - **Web:** echte DuckDuckGo-resultaten, leesmodus en update-controles via de backend. Links openen in je standaardbrowser (`xdg-open`).
  - **Exports en back-ups:** ze worden opgeslagen in `~/DBash/Exports` en `~/DBash/Backups`.
- **Bewust nog niet actief:**
  - **Herstelpunten** komen in stap 2. Tot dan vraagt *elk* commando dat iets wijzigt een bevestiging, met de duidelijke melding dat het niet automatisch ongedaan kan worden.
  - **Downloads** openen nog in de browser. De ingebouwde download met voortgangsbalk komt in stap 3.
  - Modelupdates met ⤓ UPDATE zijn ook voor stap 3.
- **Bron:** `dbash-source-0.1.0.tar.gz`, met `src/` (interface + `echt.js`) en `src-tauri/` (Rust).
  - Bouwen: `npm install && npx tauri build --bundles appimage`.
  - Nodig: Rust en `libwebkit2gtk-4.1-dev`.

## 12c. Versie 0.1.1 (na de eerste echte test)

- **Fix: programma's crashten vanuit DBash.** Een voorbeeld is `flatpak`, met *symbol lookup error … libostree*. De AppImage gaf zijn eigen bibliotheken mee via `LD_LIBRARY_PATH` en `XDG_DATA_DIRS`. Elk programma dat DBash start, krijgt nu een schone omgeving zonder AppImage-paden. Dat geldt voor commando's, llamafile, de browser en systeeminfo. Daarmee is ook "disk ?" opgelost.
- **Programma's direct starten:** typ je `steam`, `heroic`, `ls -la` …, dan voert DBash het uit als het een bestaand programma is, net als een echte terminal.
  - Vragen ("…?"), zinnen, en gewone woorden die toevallig ook commando's zijn ("find me a recipe") gaan naar de AI.
  - Met `?` vooraan vraag je het altijd aan de AI.
- **Achtergrond:** veilige commando's die na 6 s nog draaien (Steam, Heroic, een browser), laat DBash verder draaien. DBash is dan meteen weer vrij, en de terminal meldt *"still running in the background (pid …)"*.
- **Browserkeuze:** in ⚙ → FILES → WEBSITES kies je **Browser 1 / 2 / 3**. Lukt 1 niet, dan probeert DBash 2, en daarna 3.
  - Geïnstalleerde browsers krijgen ✓, ook Flatpak-versies.
  - Met **↗ TEST** probeer je het uit.
  - Standaard: 1 = systeem (xdg-open), 2 en 3 = de eerste gevonden browsers.
- **Kleuren:** de keuzelijsten en invoervelden volgen het thema, met donkere achtergrond en gele pijltjes. Commandoblokken hebben een rustige rand, waarbij alleen de linkerrand de risicokleur toont.
- **GPU-naam:** de naam wordt correct uitgelezen ("AMD Radeon RX 9070/9070 XT (16 GB)"), en het VRAM in GiB.
- **AI-prompt:** de AI mag geen commando's of opties verzinnen.

## 12d. Versie 0.1.2

- **Meerdere regels:** de invoer is nu een tekstvak dat meegroeit, tot 40% van het scherm, en daarna scrolt.
  - **Enter** verstuurt, **Shift+Enter** begint een nieuwe regel. Zo kun je een brief of lange tekst typen of plakken.
  - ↑/↓ voor de geschiedenis werkt alleen als de invoer uit één regel bestaat.
  - Tekst met meerdere regels gaat altijd naar de AI, en wordt nooit als commando uitgevoerd.
- **Schrijfhulp:** de AI helpt nu ook met andere taken dan Linux, zoals een brief schrijven, verbeteren of vertalen. Hij antwoordt dan volledig, in de taal van de tekst, en houdt de betekenis.

## 12e. Versie 0.1.3

- **sudo-wachtwoord in DBash zelf:**
  - In de terminal verschijnt een kaartje *"🔒 [sudo] password for …"*, met een wachtwoordveld, **OK / CANCEL** en de optie **remember for 5 minutes**.
  - Hoe het wachtwoord bij sudo komt: via een tijdelijk hulpscriptje in `$XDG_RUNTIME_DIR`. Dat staat in het RAM-geheugen, alleen jij kunt het lezen (0600), en het wordt meteen na het commando gewist. Zo werkt het ook bij meerdere `sudo`'s in één commando.
  - DBash vraagt niets als sudo geen wachtwoord nodig heeft (`sudo -n true`).
  - Bij een fout wachtwoord wordt het onthouden wachtwoord gewist, en krijg je een melding.
  - Het verwarrende KDE-venster *"Enter SSH Credentials"* (ksshaskpass) is niet meer nodig.
- **Beter zoeken:**
  - DBash haalt woorden als "zoek", "open", "web" en "website" uit de zoekterm. Zo wordt "open hifigo web" → *hifigo*.
  - ⚙ → FILES → **Search region**: Worldwide (standaard), België (NL/FR), Nederland, VK, VS of Duitsland.
  - Links die de AI zelf verzint en die niet in de zoekresultaten staan, krijgen **⚠ not from the search results**. De prompt verbiedt de AI ook om adressen te verzinnen.
  - Blokkeert DuckDuckGo tijdelijk, dan krijg je daar een melding van.

## 12f. Versie 0.1.4: sudo zoals in een terminal

- **Geen apart venster meer:** het wachtwoordkaartje en het KDE-venster (ksshaskpass) zijn weg.
  - De prompt wordt zelf `[sudo] password for <user>:`, en wat je typt is onzichtbaar, zoals in Konsole.
  - **Enter** bevestigt, **Esc** of **Ctrl+C** annuleert (`^C`).
- **Fout wachtwoord:** *"Sorry, try again."*, en je krijgt maximaal 3 pogingen, zoals sudo zelf.
- **Onthouden:** in ⚙ → SAFETY → **[ SUDO ]** kies je:
  - **15 min na laatste gebruik** (standaard, zoals de terminal: elke sudo begint de 15 minuten opnieuw),
  - **tot DBash sluit**,
  - **elke keer vragen**.
  - Het wachtwoord blijft alleen in het geheugen. Het gaat via een tijdelijk hulpscriptje in `$XDG_RUNTIME_DIR` (RAM, 0600) naar sudo, en wordt na het commando gewist.
- Heeft sudo geen wachtwoord nodig, dan vraagt DBash niets. Zegt sudo toch dat er een wachtwoord nodig is, dan vraagt DBash het alsnog en probeert opnieuw.
- **Bewust niet:** DBash als root draaien (`su -`) of `NOPASSWD: ALL`. Dan zou elk commando, ook wat de AI voorstelt, zonder controle als root lopen. Een sudoers-regel zonder wachtwoord, alleen voor updates, staat nog open als optie.

## 12g. Versie 0.1.5: commando's met het toetsenbord

- Elk commando in een antwoord krijgt een **nummer** (1, 2, 3…).
- **Tab** in een lege prompt selecteert het laatste commando op het scherm. Het geselecteerde commando krijgt een gele rand.
  - **↑/↓** gaat naar een ander commando (ook download- en websitekaartjes).
  - **Enter** voert uit. Bij DANGER: Enter, en dan nog eens Enter om te bevestigen.
  - **E** legt uit, **P** zet het commando in de prompt, **Esc** gaat terug naar de prompt.
- **Alt+1…9** of `run <nr>` voert commando nr uit het laatste antwoord uit.
- **Bevestigingskaartjes:** de knop **▶ RUN** staat meteen geselecteerd, dus **Enter** voert uit en **Esc** annuleert.
- Tab met tekst in de prompt vult nog steeds aan, zoals in bash.

## 12h. Versie 0.2.0: stap 2, herstelpunten met Timeshift

- **Aanzetten:** in ⚙ → SAFETY → **[ TIMESHIFT ]** → *Restore point per conversation*. Standaard staat dit uit.
- **Eén herstelpunt per gesprek:**
  - Vóór de **eerste** wijzigende opdracht in een chat maakt DBash `sudo timeshift --create --scripted --tags O --comments "DBash: <chat> [#id]"`. Bij ext4 gebeurt dat met `--rsync`, bij btrfs met `--btrfs`.
  - De bevestiging gebruikt het sudo-wachtwoord uit de prompt.
  - Dat ene punt = je systeem zoals het was bij het begin van die chat. Latere commando's in dezelfde chat maken geen nieuw punt.
  - Lukt het herstelpunt niet, dan wordt het commando **niet** uitgevoerd.
- **Terugdraaien:**
  - Met **⟲** bij de chat in de boom, of via de footerknop / `points`.
  - DBash vraagt dubbele bevestiging, en voert dan `sudo timeshift --restore --snapshot <naam> --scripted --yes --skip-grub` uit. De pc herstart, en `/home` wordt niet aangeraakt.
- **Chat verwijderen** = ook het herstelpunt verwijderen (`timeshift --delete`). **CLEAR ALL** verwijdert ze allemaal.
- **Essentials only** (standaard aan): DBash voegt aan Timeshifts eigen uitsluitingen toe: `/var/cache`, `/var/tmp`, `/var/lib/docker`, `/var/lib/flatpak`, `/var/log/journal` en `/swapfile`. Timeshift slaat `/home` standaard al over, dus een herstelpunt bevat alleen het systeem.
- **Back-upschijf:** standaard dezelfde schijf als het systeem, of een andere partitie die je kiest. De lijst toont het bestandssysteem en de vrije ruimte.
- **CHECK TIMESHIFT** toont de status. Ontbreekt Timeshift, dan installeert **INSTALL TIMESHIFT** het (`sudo apt install -y timeshift`).
- **Footer:** `⟲ RESTORE POINTS n` (of `off`). Een klik toont de lijst met herstelpunten per chat.
- **Het nagebootste deel** van stap 2, de tijdlijn met punten per taak, is in de echte app vervangen door dit "één punt per chat"-model.

## 13. Open punten

- Hoe ver gaat terugdraaien zonder herstart (alleen pakketten, of het volledige systeem)?
- Moeten gesprekken met de zoekresultaten erin versleuteld bewaard worden?
- Hoe lang worden oude herstelpunten bewaard, en hoeveel schijfruimte mogen ze maximaal innemen?
- Moet de llamafile in de AppImage zitten (bestand van 7 GB of meer), of ernaast blijven staan (aanbevolen)?

## 12i. Versie 0.2.1 — ⟲ BACKUP vakje
- Geen herstelpunt per gesprek meer. Onderaan staat nu **⟲ BACKUP**, naast WEB.
- Aanvinken = DBash maakt meteen een Timeshift-backup (sudo-wachtwoord in de terminal). Het uur staat naast het vakje.
- Afvinken = vraag "Is everything OK?" → ✓ ALL GOOD, DELETE BACKUP / ⟲ ROLL BACK INSTEAD / KEEP BACKUP.
- Knop **⟲ ROLL BACK** verschijnt zolang er een backup is (twee keer drukken, daarna herstart).
- Bevestigingskaart zonder actieve backup heeft een extra knop: ⟲ BACKUP FIRST, THEN RUN.
- Backup blijft onthouden na herstart van DBash; bij het opstarten krijg je een herinnering.
- /home wordt nooit aangeraakt; de "essentials"-uitsluitingen blijven.

## 12j. Versie 0.2.2: de AI leest mee met de terminal
- **Vaste AI-regels** (ingebouwd): de AI weet dat hij in DBash zit, dat de gebruiker op ▶ RUN klikt, en dat hij nooit mag zeggen "open een andere terminal". Verder: één commando per regel, geen `#`-commentaar, geen verzonnen schijfnamen, `sudo` erbij waar het moet, en geen pagers of interactieve programma's.
- **Echte schijven:** DBash geeft de systeempartitie en de schijven (`findmnt`, `lsblk`) mee aan de AI.
- **Notes for the AI:** het vroegere veld "Extra" is nu een groot tekstvak met meerdere regels, voor eigen notities.
- **Taal:** nieuwe optie *Same language as my question*.
- **Commentaarregels** (`# 1. …`) worden een klein kopje boven het commando, geen box met RUN.
- **▶ RUN ALL (n):** voert de commando's van een antwoord na elkaar uit. Bij een SUDO/DANGER-commando of een in-te-vullen deel pauzeert het. Daarna verschijnt **▶ CONTINUE FROM n**.
- **Uitklapbare uitvoer:** een uitvoer van meer dan 15 regels wordt `▸ 300 lines · 2 with error/warning`. De foutregels staan rood in het voorbeeld, en met een klik zie je alles.
- **De AI leest de uitvoer** (⚙ → AI → *Share command output with the AI*):
  - **ask** (standaard): de knoppen ◆ ASK AI ABOUT THIS / THESE n RESULTS,
  - **always:** alles gaat mee met de volgende vraag, en na RUN ALL bekijkt de AI de resultaten vanzelf,
  - **never:** de AI ziet niets.
  - Lange logs worden ingekort tot de foutregels plus de laatste regels, met een maximum van ongeveer 7000 tekens. De AI voert nooit zelf iets uit.
- **↻ RETRY WITH SUDO** verschijnt bij "Permission denied", "Operation not permitted" of bij een admin-tool die niet gevonden wordt (bv. `smartctl`).
- `| less` en `| more` worden weggehaald. `/dev/sdaX`, `/dev/sdX` en `<…>` komen in de prompt, met het in te vullen deel geselecteerd.
- **Risico-labels:** `update-initramfs`, `dpkg-reconfigure`, `grub-install`, `mount`, `usermod`, `ufw` … zijn **SUDO**. `fsck` zonder `-n` is **DANGER**.

## 12k. Versie 0.2.3
- **Fix:** de laatste regel (de prompt) verdween half achter de onderbalk. Dat gebeurde vooral bij grote letters of een volledig scherm.
  - Oorzaak: de hoogte van het tekstvak was berekend met een vaste hoogte voor de bovenbalk.
  - Oplossing: het scherm werkt nu als een flex-kolom, en onderaan staat een echte witruimte van 18 px. WebKit telt de onderste padding van een scrollvak niet mee.
  - Na nieuwe tekst scrolt DBash nog een tweede keer, na de opmaak.

## 12l. Versie 0.2.4: y/n-vragen in de terminal
- Na een AI-antwoord met commando's vraagt de terminal zelf:
  - **1 commando:** `Run this command? [y/N]`
  - **meerdere commando's:** `Run all n commands? [y/N] (or a number 1-n)`
  - De hoofdletter is wat Enter doet: `[Y/n]` als alles SAFE is, `[y/N]` zodra er iets aan het systeem verandert.
- **Antwoorden:** y/j/ja voert uit, n/Esc doet niets, een nummer voert alleen dat commando uit. Typ je iets anders, dan gaat dat gewoon als nieuwe vraag naar de AI.
- **Tijdens het uitvoeren:**
  - Vóór het eerste SUDO-commando vraagt DBash `No backup active. Make a Timeshift backup first? [y/N]`.
  - Daarna vraagt hij per SUDO-commando `[i/n] cmd · run it? [Y/n/a/q]`. Daarbij is **a** "ja voor alle volgende" en **q** "stoppen".
  - Bij DANGER moet je altijd **yes** voluit typen.
- **▶ RUN ALL** (de knop) gebruikt dezelfde vragen en staat op een eigen regel.
- Uitzetten kan in ⚙ → AI → *After an answer, ask "Run it? [y/n]"*.
- **Uitvoer gaat mee met je volgende vraag**, ook in de stand *ask*. Zo kun je gewoon vragen "wat is er mis?". In de stand *never* gaat er niets mee.
- **↻ RETRY WITH SUDO** verschijnt ook als de exitcode 0 is maar de uitvoer "Operation not permitted" of "Permission denied" toont, bijvoorbeeld bij `dmesg | tail`.
- **Markdown-tabellen** van de AI worden echte tabellen.
- **Volgende ideeën:**
  - Ctrl+C om commando's en de AI te stoppen,
  - live uitvoer,
  - `cd` die onthouden wordt,
  - de AI-geheugenmeter, met samenvatten van oude berichten,
  - zelf-update via GitHub.

## 12m. Versie 0.3.0: een echte terminal
- **Eén bash-sessie in een pseudo-terminal (PTY)**, gebouwd met het Rust-pakket `portable-pty`. Het werkt zoals de shell in Konsole.
  - Na elk commando schrijft bash een onzichtbare markering met de exitcode en de huidige map. Zo weet DBash wanneer een commando klaar is.
- **`cd` wordt onthouden:** de prompt toont de echte map (`vhalron@debian:~/Downloads$`), en de AI krijgt de huidige map mee.
- **Live uitvoer:** je ziet de uitvoer regel per regel. Kleuren worden getoond (bv. `ls`), en voortgang met `\r` (apt, 10% → 100%) wordt correct verwerkt.
- **Ctrl+C** of **■ STOP** onderbreekt een commando (exitcode 130). Ctrl+C, Esc of ■ STOP stopt ook een AI-antwoord dat nog bezig is; llamafile stopt dan ook echt.
- **Typen terwijl een commando loopt** stuurt je invoer naar dat commando. Vraagt een programma om een wachtwoord, dan gebeurt dat verborgen.
- **Programma's met volledig scherm** (nano, vim, less, man, htop, top, ssh, mc, python3 …) openen in een paneel boven de terminal, met **xterm.js** (MIT) in je thema.
  - Bovenaan staat per programma een hint, zoals "Ctrl+O save · Ctrl+X close".
  - **◆ AI, LOOK** stuurt de schermtekst naar de AI.
  - Het paneel sluit vanzelf als het programma stopt.
- **Toepassingen met een venster** (Steam, Heroic, Firefox …) worden herkend via hun .desktop-bestand en draaien los van de terminal, zoals voorheen.
- **Bestandskaartjes:** de AI zet een volledig nieuw bestand in een ```` ```file:/pad ````-blok. DBash leest het huidige bestand en toont het verschil:
  - rood `-` voor weg, groen `+` voor erbij, grijs voor de context,
  - regelnummers, en markering van alleen het gewijzigde stukje binnen een regel.
  - Vraag: `Write /pad? [y/N/v/e]`, waarbij **v** het hele bestand toont en **e** het voorstel eerst in nano opent.
  - Bij schrijven maakt DBash eerst een backup (`pad.dbash-bak`) en schrijft dan, met sudo als dat nodig is. Grote bestanden gaan in stukken via een tijdelijk privébestand.
  - Daarna staat er een regel "✓ saved" met **⟲ UNDO**, het logboek krijgt een regel met de wijziging, en de AI krijgt mee wat er veranderd is.
  - Waarschuwing als het voorstel meer dan 30% van de regels weghaalt.
- **AI-regels:** bestanden nooit via nano/echo/sed aanpassen, alleen via een file-blok. Processen bekijken met `ps aux --sort=-%cpu | head -20` of `top -b -n 1`.

## 12n. Versie 0.3.1: het geheugen van de AI, en opruiming
- **AI memory (context)** in ⚙ → AI: 8.000, **16.000** (standaard) of 32.000 tokens.
  - Dit wordt als `-c` aan llamafile meegegeven bij het laden. Daarna leest DBash de echte waarde uit `/props`.
- **MEM-meter** onderaan (bv. `MEM 23%`): bij 60% wordt hij oranje, bij 85% rood. Klik erop, of typ `memory`, voor de details en de knoppen **✂ SUMMARIZE OLDER MESSAGES NOW** en **＋ NEW CHAT**.
- **Wat er gebeurt vóór elke vraag** (DBash schat ongeveer 1 token per 3,2 tekens; de grens ligt op 72% van de context, met ruimte voor het antwoord):
  1. De uitvoer van commando's en webresultaten van oudere berichten gaan eruit. De laatste 2 berichten houden ze.
  2. Is het nog te vol, dan vat de AI de oudste berichten samen in maximaal 120 woorden. Die samenvatting gaat mee in de systeemprompt.
  3. Is het daarna nog te vol, dan wordt de uitvoer bij de laatste vraag ingekort.
- **Volledige geschiedenis:** je chat blijft volledig bewaard. Samengevatte berichten krijgen alleen een vlag, en bij het openen staat er "(the AI keeps a summary of the oldest N messages)".
- **Opruiming:** de oude tekst over "restore points" is overal vervangen door het ⟲ BACKUP-vakje: wizard stap 4 (nu BACKUPS), de samenvatting van de wizard, help, risico-uitleg, veiligheidsinfo, EXPLAIN en logdetails. De sectie [ RESTORE POINTS ] in de instellingen is weg.
- **Prototype:** de browserdemo (⟲ BACKUP, demo/demo1/demo2) zit nu in de interface zelf. Ze is alleen actief in een gewone browser, nooit in de app.

## 12o. Versie 0.3.2: kopiëren en plakken, commando's over meerdere regels
- **Selecteren:** tekst in de terminal kun je met de muis selecteren. Een klik zet de focus niet meer op de prompt zolang er iets geselecteerd is (dat wiste vroeger de selectie).
- **Toetsen:**
  - **Ctrl+C** of **Ctrl+Shift+C** met een selectie kopieert. Zonder selectie stopt Ctrl+C nog steeds het commando of de AI.
  - **Ctrl+V** plakt in de prompt. **Ctrl+Shift+V** plakt ook, zoals in Konsole.
  - In het paneel voor nano, htop … kopieer je met **Ctrl+Shift+C** en plak je met **Ctrl+Shift+V**, zodat Ctrl+C voor het programma blijft.
  - Kopiëren en plakken gaan via het systeemklembord (plugin `tauri-plugin-clipboard-manager`), dus het werkt met alle KDE-programma's.
- **Rechtsklikmenu:** ⧉ Copy, ⧉ Copy command, ⧉ Copy output, ⧉ Copy this answer, 📋 Paste into the prompt. In het programmapaneel: Copy en Paste.
- **⧉-knop** bij elk commando, met een kort meldingetje "⧉ copied".
- **Meerdere regels → één commando:**
  - Regels die eindigen op `\`, `|`, `&&` of `||` worden samengevoegd.
  - `while/for … do … done`, `if … then … fi`, `case … esac`, `{ … }` en heredocs (`<<EOF … EOF`) worden één commandoblok.
  - Bash meldt zo'n blok één keer als klaar. Dat is getest in een echte PTY.
- **Veiliger risico-label:** elk deel van een commando wordt gecontroleerd, ook binnen lussen, na `|`, `;` en `&&`, en in `$( )`. Een `while`-lus met `sudo apt purge` krijgt dus **SUDO**, niet SAFE.
- **AI-regel:** nooit een commando splitsen met `\`, en lussen op één regel schrijven.

## 12p. Versie 0.3.3: fix voor Timeshift
- **Fix:** Timeshift 24.x weigert `--tags O`, met de melding *"Unknown value specified for option --tags (O)"*, ook al staat O in zijn eigen lijst. Dat is een fout in Timeshift zelf, en ik kon ze nabootsen met Timeshift 24.01.1.
  - DBash geeft geen `--tags` meer mee. O ("on demand") is toch al de standaard.
- **RUN ALL:** lukt de backup niet, dan vraagt DBash *"Continue without a backup? [y/N]"* in plaats van meteen te stoppen.

## 12q. Versie 0.3.4: nettere uitvoer en slimmere RUN ALL
- **Voortgangsbalk van apt:**
  - Oorzaak: apt tekende "Progress: [ 20%] [####…]" steeds opnieuw op de onderste regel, met codes om de cursor te onthouden en terug te zetten (ESC 7/8). In DBash werd elke stand een nieuwe regel.
  - Nu: DBash voegt `-o Dpkg::Progress-Fancy=0` toe aan apt en apt-get (install, upgrade, remove …, ook achter sudo). Je ziet dat niet in de prompt.
  - DBash laat ook tekeningen weg die tussen "cursor onthouden" en "cursor terug" staan, voor andere programma's die hetzelfde doen.
  - Getest met een echte `apt install`.
- **RUN ALL na een fout:** DBash vraagt *"✗ [1/4] failed. The next commands may depend on it. Continue with the rest? [y/N]"*. Standaard stopt het.
- **Geen vervuilde systeemlog meer:** de controle `sudo -n true` ("is er een wachtwoord nodig?") gebeurt nog maar één keer per sessie. Elke mislukte controle kwam als *"a password is required"* in de foutlog, en de AI las dat als een probleem.
- **Minder ruis:**
  - de melding "(added -y …)" verschijnt één keer,
  - de debconf-meldingen "unable to initialize frontend: Dialog / falling back" worden niet meer getoond.
- **Nieuwe AI-regels:**
  - gebruik `sudo journalctl` voor systeemlogs,
  - sommige diensten draaien per gebruiker (`systemctl --user`, bv. obex),
  - controleer of een pakketnaam bestaat voor je hem voorstelt,
  - zeg niet dat iets opgelost is als de uitvoer dat niet toont, en vergelijk de tijdstippen in logs.

## 12r. Versie 0.3.5: procentbalk, pakketcontrole, alleen recente uitvoer
- **Procentbalk:** apt tekent zijn eigen balk weer. DBash leest het percentage ("Progress: [ 48%]") uit de uitvoer en toont het als balk op de ▶-regel van het commando: `▶ sudo apt install vlc [SUDO] ██████████░░░░░░░░░░ 48%`. Lukt het commando, dan eindigt de balk op 100%; mislukt het, dan verdwijnt hij. De oude balkregels en de lege regels die ze achterlaten, worden uit de uitvoer gehaald. Getest met een echte `apt install`.
- **Pakketcontrole:** stelt de AI `apt install …` voor, dan controleert DBash elke naam met `apt-cache policy`. Dat leest alleen en verandert niets.
  - Bestaat een pakket niet, dan staat er onder het commando: *⚠ package "firefox" not found in your sources · similar: firefox-esr*. Gelijkaardige namen zoekt DBash met `apt-cache search --names-only`.
  - De AI krijgt dat bij je volgende vraag ook te horen.
- **Alleen recente uitvoer:** met een nieuwe vraag gaat alleen uitvoer van de laatste 10 minuten mee, met de melding dat ze misschien niets met de vraag te maken heeft. De AI hield anders oude uitvoer (een tikfout) voor de oorzaak.
- **AI-regels:** op Debian heet Firefox `firefox-esr`. De nieuwste Firefox komt via Flatpak of de apt-repository van Mozilla. Toont `apt-cache policy` "Candidate: (none)", dan bestaat het pakket niet: stop en zeg dat.
- **Waarom de AI soms niet up-to-date is:** het model kent alleen wat het tijdens zijn training leerde (gpt-oss-20b ongeveer tot medio 2024). Het vakje WEB en de pakketcontrole van DBash vangen dat op.

## 12s. Voorbeeld (nog niet in de app gebouwd): AI-rollen en lessen
- **⚙ → SYSTEM → [ AI ROLE ]**, met onderaan het label `🎓 FREE/EXPLAIN/COACH/TEACHER`. Een klik op het label wisselt de rol, net als het commando `role <naam>`.
  - **Free:** zoals nu.
  - **Explain:** DBash voert uit, de AI legt elk stukje van elk commando uit en zegt waar je in de uitvoer op moet letten.
  - **Coach:** korte uitleg, dan typ je het commando zelf (de AI geeft het met een open plek, bv. `sudo apt ____ vlc`).
    - DBash voert uit wat je typt, en de AI doet een **COACH CHECK**: goed gedaan, of een hint in plaats van het antwoord.
    - **👁 SHOW ME THE COMMAND** geeft het antwoord.
    - Er komt geen "Run it? [y/n]"-vraag.
  - **Teacher:** een cursus van 10 lessen (Moving around, Files and folders, Reading files, Users/permissions/sudo, Packages, Services, Logs and errors, Disks and space, Processes, Your first Bash script).
    - De lessen volgen het OS uit SYSTEM. Elk antwoord begint met "Lesson N · Step M", met één oefening per keer.
    - Je oefent in `~/DBash/Learn`.
    - `learn` toont de lijst met ▶ START/CONTINUE en ✓ DONE. Je voortgang wordt bewaard.
- **Lagen in de AI-instructies:**
  1. DBash-regels
  2. AI-rol
  3. jouw systeem
  4. Notes for the AI: die passen de rol aan, bv. "I already know cd/ls"
  5. taal
  - De veiligheidsregels van DBash winnen altijd.
- **Taal:** standaard "Same language as my question (English if unsure)". De AI antwoordt in de taal waarin je schrijft; is die niet duidelijk of kent het model ze niet goed, dan in het Engels.

## 12t. Versie 0.3.6: AI-rollen in de app
- Het voorbeeld uit 12s zit nu in de app. **[ AI ROLE ]** staat in ⚙ → SYSTEM, onder *Notes for the AI*.
- **Rol per gesprek:** elke chat onthoudt zijn rol, net als WEB. Open je een les-chat, dan staat de rol meteen op Teacher. Wissel je de rol in een chat, dan wordt dat bij die chat bewaard.
- **"What you already know"** (in AI ROLE):
  - Coach en Teacher voegen een commando toe als je het goed typte (bv. `ls`, `apt install`). Ook de commando's van een spiekbriefje komen erbij.
  - Zelf toevoegen kan met het invoerveld, verwijderen met ✕.
  - De AI krijgt de lijst mee en legt die commando's niet opnieuw uitgebreid uit.
- **Einde van een les:** 3 quizvragen, één per keer. Daarna een spiekbriefje in een ```` ```cheatsheet ````-blok (`command — what it does`).
  - DBash toont het als kaart en zet het in je **📖 commandoboek** (jouw OS › *Learned · L1*).
  - De les wordt dan als klaar gemarkeerd.
  - Bij het heropenen van een oude chat wordt het niet opnieuw toegevoegd.
- **Explain + zelf typen:** typ je in de rol Explain zelf een commando, dan krijg je onder de uitvoer een korte uitleg in één regel (💡 …).

## 12u. Versie 0.3.7: modellen van Hugging Face
- **In DBash:**
  - `hf` of de knop 🔍 bij LIBRARY → Models toont **★ Best models for your GPU**: de llamafile-motor (met updatecheck) en 5 aanbevolen modellen.
  - De aanbevolen modellen zijn Gemma 4 26B-A4B, gpt-oss 20B, Qwen3 14B, Devstral Small en Qwen3.5 4B. DBash zoekt ze **op dat moment** op Hugging Face op: de bekendste uploader, de voorkeursquantisatie, niet afgeschermd ("gated") en passend in 16 GB.
- **`hf <woorden>`** zoekt GGUF-repositories, met de meest gedownloade eerst.
  - Bekende uploaders krijgen ✓ known: unsloth, bartowski, ggml-org, lmstudio-community, Qwen, mistralai, google, mozilla-ai.
  - 🔒 betekent dat je moet inloggen; zulke repositories worden niet ondersteund.
- **FILES** toont de GGUF-bestanden met hun grootte en een label: `GPU ✓`, `part CPU` of `too big`. Bestanden in delen worden samengeteld, mmproj-bestanden worden overgeslagen.
- **⤓ DOWNLOAD:**
  - eerst de vraag `[y/N]` en een controle van de vrije schijfruimte,
  - dan een balk met %, GB en MB/s, plus ■ STOP,
  - het bestand komt via `.part` in de modellenmap, en hervatten kan bij de volgende keer.
  - Daarna: motor ontbreekt? → "Download the newest from GitHub? [Y/n]". En: "Use it now? [Y/n]".
  - Getest in de app tegen een nagebootste Hugging Face en GitHub.
- **Backend:** `download_file` (reqwest-stream, Range, het event "dl-progress", alleen binnen je home-map) en `download_stop`. `DBASH_HF` en `DBASH_GH` kunnen het adres vervangen, voor testen of een spiegelserver.
- **Los script `dbash-get-models.sh`:** een menu (Enter = motor + Gemma 4 + Qwen3 14B) dat dezelfde zoekregels via de Hugging Face-API gebruikt.
  - Het gebruikt `curl -C -` om te hervatten, controleert grootte en schijfruimte, en schrijft een `.source`-bestand per model.
  - Getest tegen een nagebootste API.

## 12v. Versie 0.3.8: modellen makkelijker vinden
- **⤓ GET MODELS** staat in ⚙ → AI, naast LOAD AI, en opent dezelfde lijst als `hf`.
- **Wizard, stap 2:** de knop *★ GET THE BEST MODELS FOR YOUR GPU*.
- **Bij het opstarten:**
  - zonder modellen staat er "No models found. Type hf (or ⚙ → AI → ⤓ GET MODELS) …",
  - met modellen krijg je één keer de tip "Tip: type hf …".
- **Betere keuze van de versie:** DBash en het script kijken nu eerst naar de beste quantisatie in **alle** bekende repositories (de 6 meest gedownloade), en pas dan naar de volgende. Bij gpt-oss krijg je zo het originele `mxfp4` (ggml-org) in plaats van Q4_K_M (unsloth).
- **Hoe de lijst tot stand komt:** het lijstje van 5 modellen staat vast in DBash; de versie wordt live opgezocht. Later kan dat lijstje van de GitHub-repo komen, zodat het zonder DBash-update kan veranderen.
- **Ook in 0.3.8:**
  - 💬 Gesprekken staan nu vóór 📖 Commandoboek (rechtsboven).
  - **Fix:** de laatste regel zat soms achter de onderbalk, als er na een antwoord nog iets bijkwam (bv. de knop 👁 SHOW ME). DBash blijft nu onderaan plakken zolang je onderaan zit, wat er ook bijkomt; scrol je zelf omhoog, dan blijf je daar.
  - **Fix in de voorvertoning:** de oude tijdlijncode gaf een fout als het thema of de vensterstijl veranderde.

## 12w. Versie 0.3.9: de modellenlijst in de instellingen
- **Fix:** het keuzelijstje **Model** in ⚙ → AI had nog een vaste lijst uit het eerste prototype. Een gedownload of zelf toegevoegd model (bv. Gemma 4 .gguf) stond er niet in, en het vak bleef leeg.
- **Nu:** de lijst komt uit je echte modellenmap, net als de modelknoppen onderaan. Per model zie je de naam, de grootte en `GPU ✓` of `part CPU`, gesorteerd van klein naar groot. Een model kiezen laadt het ook echt.

## 12x. Versie 0.4.0: klaar voor GitHub, vaste lessen, auto-update
- **Code opgeruimd en opgesplitst:** `src/index.html` (opbouw), `css/dbash.css`, `js/app.js` (gedeelde logica), `js/demo.js` (alleen de browservoorvertoning), `js/real.js` (de echte backend in de app, was `echt.js`), `js/lessons.js` (het lessenpakket) en `js/learn.js` (de lesmotor). De oude tijdlijn met herstelpunten (sinds 0.2.1 vervangen door het ⟲ BACKUP-vakje) en ander dood werk zijn weg. In Rust is dubbele code weg (askpass, downloads).
- **Vaste, nagekeken lessen:** de 10 lessen zijn nu data in een lessenpakket. DBash toont elke stap zelf en **controleert de oefening zelf**: de exitcode, de uitvoer, de map waarin je staat, of een bash-test (bestaat het bestand nu?). Goed = volgende stap. Fout = "Not yet" met de reden en een hint, en 👁 SHOW ME zet het antwoord in de prompt. Daarna volgen een quiz (a/b/c) en de spiekbrief naar het commandoboek. De lessen werken **zonder AI**. Met een AI krijgt de AI de huidige stap mee, zodat hij die stap uitlegt en geen andere oefeningen verzint.
- **Oefenmap:** `~/DBash/Learn/lN`, die bij START vers wordt klaargezet. Gewone wijzigingen daarin (mkdir, touch, mv, chmod zonder sudo) vragen in een les geen bevestigingskaart. sudo en DANGER (`rm -r`) vragen het wel.
- **Coach en Explain** reageren nu ook op commando's zonder uitvoer (cd, mkdir); die vielen eerder buiten de controle.
- **Auto-update** voor het losse `.sh`-bestand: één keer per dag vraagt DBash de nieuwste GitHub-release op (instelbaar, en pas na de eerste-start-wizard). Bij een nieuwere versie vraagt DBash "Update to DBash x.y.z now? [y/N]". Bij y downloadt de backend `dbash-x.y.z.sh` naast het oude bestand, controleert de sha256 tegen `SHA256SUMS` van dezelfde release, zet het menu-item om en verplaatst het oude bestand naar `~/DBash/Backups`. Daarna vraagt hij "Restart DBash now? [Y/n]". Alleen bestanden van github.com, en alleen in je thuismap. Zonder checksum wordt er niets gedownload. Het commando `update` kijkt meteen.
- **Lettertypes zitten in de app** (OFL): het scherm laadt niets meer van internet (eerder Google Fonts).
- **GitHub:** README, LICENSE (MIT), CHANGELOG, CONTRIBUTING, SECURITY, `lessons/README.md` (hoe je een les schrijft), een CI-workflow (tests bij elke push) en een release-workflow (tag `v0.4.1` → AppImage, `.sh` en SHA256SUMS in een release).
- **Tests:** `npm test` controleert het lessenpakket en voert elke stap zonder sudo **echt uit in bash** met een tijdelijke thuismap. Daarnaast is er een rooktest van het scherm in jsdom (voorvertoning, lesverloop in app-modus, update-check). `cargo test` test de backend.
- Getest in de echte app (Xvfb): les 1, 2, 3, 4 en 10 helemaal doorlopen (met nano in het paneel). De update is van begin tot eind getest tegen een nagebootste GitHub-release: download, checksum, menu-item, oud bestand naar Backups, herstart in de nieuwe versie, en de oude uitgepakte kopie opgeruimd.

## 12y. Versie 0.4.1: laadscherm
- **Bij het opstarten** (ongeveer 2 seconden): een groot pixellogo **DBASH** in de stijl van Emu Vault (mosterdgeel met donkere rand en schaduw), de versie en je thuismap, en daarna zes regels met **echte** controles:
  - **Terminal:** de bash-versie en je map.
  - **AI engine:** de llamafile-motor in je modellenmap, of `[ !! ] not found · type hf to get it`.
  - **Model:** je laatste model, en of het op je GPU past, of `[ !! ] no model yet · type hf`.
  - **Backup:** een actieve ⟲ BACKUP, of of Timeshift er is.
  - **Lessons:** hoeveel lessen klaar zijn, of welke les nog openstaat.
  - **Updates:** of de dagelijkse update-check aan staat.
- **Een balk** loopt vol, daarna "ready". Een toets of klik slaat het over, en die toets komt niet in de prompt terecht. Uitzetten kan in ⚙ → LOOK → *Loading screen at start*.
- **README op GitHub:** bovenaan staat de banner met het logo, en daaronder het laadscherm, zoals bij Emu Vault.
- Getest in de echte app (Xvfb) en met een jsdom-test: het scherm verschijnt, toont 6 regels, sluit vanzelf, en een toets sluit het meteen.

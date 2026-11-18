# EE-Toolkit

Zeichnungen für OneNote: Du stellst ein paar Werte ein, das Toolkit zeichnet die Figur, und du fügst sie als scharfes Bild in deine Notizen ein. Danach kannst du in OneNote mit dem Stift darauf schreiben.

Das Toolkit ist eine Web-App. Sie läuft auf Windows und Android und zusätzlich als echtes Add-in in OneNote im Browser.

| Wo | Wie die Zeichnung in OneNote kommt |
|---|---|
| Windows, OneNote-App | Toolkit als App neben OneNote, **Kopieren**, in OneNote `Ctrl+V` |
| Android-Tablet | Toolkit als App im geteilten Bildschirm, **Kopieren** und in OneNote einfügen, oder **Teilen** |
| OneNote im Browser | Toolkit als Add-in im Seitenbereich, **In OneNote einfügen** |

Für die OneNote-App auf Windows und Android gibt es von Microsoft keine Add-in-Schnittstelle dieser Art. Darum läuft das Toolkit dort neben OneNote und nicht darin.

## Was drin ist

**Geometrie**
- Dreieck aus 3 Seiten, 2 Seiten + Winkel, Seite + 2 Winkel oder 2 Katheten; mit Höhe, Umkreis, Inkreis
- Viereck: Quadrat, Rechteck, Parallelogramm, Raute, Trapez; mit Diagonalen und Höhe
- Kreis mit Radius, Durchmesser, Sektor und einbeschriebenem n-Eck
- Körper im Schrägbild: Würfel, Quader, Zylinder, Kegel, Pyramide, Kugel

**Koordinatensysteme**
- Kartesisch mit frei wählbarem Bereich, Schritt, Raster und Achsennamen; bis zu 3 Funktionen; x-Achse auch in Vielfachen von π
- Logarithmisches Papier (x, y oder beide Achsen)
- Polarkoordinaten in Grad oder Bogenmass, mit Kurve r(φ)
- 3D-Koordinatensystem mit Punkten oder Ortsvektoren und Hilfslinien

**Analysis & Lineare Algebra**
- Einheitskreis mit sin, cos, tan
- Vektoren 2D mit Summe (Parallelogramm) und Komponenten
- Lineare Abbildung: Was eine 2×2-Matrix mit dem Gitter und den Basisvektoren macht, mit Determinante

**Physik**
- Kräfte am Körper (Freikörperbild) mit Resultierender
- Schiefe Ebene mit Kraftzerlegung, Normalkraft und Reibung

**Elektrotechnik**
- Schaltungen: Reihen- und Parallelschaltung, Spannungsteiler, reale Quelle mit Last, Filter (RC, RL, …), Wheatstone-Brücke; mit Spannungs- und Strompfeilen
- Schaltzeichen nach IEC: R, C, L, Quellen, Batterie, Dioden, Schalter, Lampe, Messgeräte, Masse, Operationsverstärker, Transistor
- Zeigerdiagramm und komplexe Ebene (z. B. RLC-Serie, Drehstrom)
- Bode-Diagramm aus einer Übertragungsfunktion H(s)
- Oszilloskop-Raster mit zwei Kanälen

Jede Zeichnung gibt es **hell** (schwarz auf weiss) und **dunkel** (weiss auf schwarz).

## Installation

### 1. Einmalig: auf GitHub Pages veröffentlichen

Die App braucht eine https-Adresse. GitHub Pages ist gratis.

1. Entpacke `ee-toolkit.zip`.
2. Melde dich auf github.com an und erstelle ein neues Repository, zum Beispiel `ee-toolkit`. Es muss **Public** sein.
3. Klicke im leeren Repository auf **uploading an existing file**. Ziehe den ganzen Inhalt des entpackten Ordners hinein (auch die Ordner `js` und `icons`) und klicke **Commit changes**.
4. Öffne **Settings → Pages**. Wähle unter «Branch» `main` und `/ (root)` und klicke **Save**.
5. Nach etwa einer Minute läuft die App unter `https://DEIN-NAME.github.io/ee-toolkit/`.

Dein Passwort brauchst du nur auf github.com selbst. Gib es nirgends sonst ein.

### 2. Windows

1. Öffne die Adresse in **Edge**.
2. Menü **… → Apps → Diese Website als App installieren**.
3. Hefte die App an die Taskleiste. Mit `Win + Pfeil links/rechts` stellst du sie neben OneNote.

Chrome geht auch: rechts in der Adressleiste auf das Installieren-Symbol klicken.

### 3. Android-Tablet

1. Öffne die Adresse in **Chrome**.
2. Menü **⋮ → Zum Startbildschirm hinzufügen → Installieren**.
3. Öffne OneNote und das Toolkit im geteilten Bildschirm.

Nach dem ersten Öffnen läuft die App auch ohne Internet.

### 4. OneNote im Browser (optional)

1. Öffne die App, dann **Einstellungen → Add-in-Manifest herunterladen**.
2. Öffne dein Notizbuch in OneNote im Browser.
3. **Einfügen → Office-Add-Ins → Meine Add-Ins → Mein Add-In hochladen** und die heruntergeladene Datei `ee-toolkit-onenote-manifest.xml` wählen.
4. Das Toolkit erscheint rechts im Seitenbereich, mit dem Knopf **In OneNote einfügen**.

Beim Schulkonto kann die Informatik das Hochladen eigener Add-ins sperren. Dann fehlt «Mein Add-In hochladen». In dem Fall benutzt du auch im Browser den Weg über **Kopieren**.

## Benutzung

1. **Werkzeug wählen**: links in der Liste, auf schmalen Bildschirmen im Auswahlfeld «Werkzeug».
2. **Werte einstellen**: Die Vorschau ändert sich sofort. Viele Werkzeuge haben **Vorlagen** als Startpunkt, zum Beispiel «RC-Tiefpass» oder «Sinus u(t), i(t)».
3. **Darstellung wählen**: «Hell» oder «Dunkel», dazu die Grösse.
4. **In OneNote bringen**:
   - **Kopieren**, dann in OneNote `Ctrl+V` (Windows) oder lange tippen → Einfügen (Android).
   - **Teilen** (Android): Bild direkt an OneNote schicken. OneNote legt es dabei als neue Notiz ab.
   - **PNG speichern**: Bilddatei, die du in OneNote über Einfügen → Bild holst.
   - **SVG speichern**: Vektordatei für Word, PowerPoint oder Inkscape.

**Verlauf** zeigt die letzten 30 exportierten Zeichnungen. Antippen lädt die Werte wieder. Die App merkt sich ausserdem pro Werkzeug deine letzten Eingaben.

**Einstellungen**: farbig oder einfarbig, gefüllter oder transparenter Hintergrund, Strichstärke, Schriftgrösse, Bildschärfe beim Export.

### Formeln

| | |
|---|---|
| Rechnen | `+ - * / ^` und Klammern. `2x`, `3(x+1)` und `2pi` gehen ohne Malzeichen. |
| Variable | `x` oder `t`; bei Polarkoordinaten `phi`; beim Bode-Diagramm `s` |
| Konstanten | `pi`, `e`, beim Bode-Diagramm auch `j` |
| Funktionen | `sin cos tan asin acos atan sinh cosh tanh exp ln log sqrt abs sgn min max step rect tri sinc floor ceil round` |
| Zahlen | `1e-3`, `4.7e3`. In Zahlenfeldern geht auch `2*pi` oder `1/3`. |

`log` ist der Zehnerlogarithmus, `ln` der natürliche, `step` der Einheitssprung.

Beispiele: `5*sin(2*pi*50*t)`, `1 - exp(-t/0.002)`, `1/(1 + s/(2*pi*1000))`

### Beschriftungen

- Tiefgestellt: `U_1`, `R_{ab}`
- Hochgestellt: `m/s^2`, `10^{-3}`

### Listen

Zeiger, Kräfte, Vektoren und Punkte gibst du zeilenweise ein, die Angaben mit `;` getrennt:

```
U_R; 4; 0
U_L; 3; 90
```

Bei Schaltungen bestimmt der erste Buchstabe das Bauteil: `R` Widerstand, `L` Spule, `C` Kondensator, `D` Diode, `LED`, `ZD` Z-Diode, `S` Schalter, `La` Lampe, `V` Voltmeter, `A` Amperemeter. Ein Wert kommt nach `=`:

```
R_1 = 1 kΩ; L; C_1 = 100 nF
```

## Stand der Tests

- Alle 18 Werkzeuge mit allen Vorlagen sind in Chrome durchgeklickt, in hell und dunkel. Kopieren, PNG, SVG, Verlauf und die schmale Ansicht funktionieren dort.
- **Nicht** auf einem echten Gerät geprüft: das Einfügen in OneNote auf Android und das Add-in in OneNote im Browser. Der Add-in-Weg ist nur gegen eine Attrappe der Office-Schnittstelle getestet.

## Update

Lade geänderte Dateien im Repository neu hoch. Erhöhe dabei in `sw.js` die Nummer in `CACHE` (zum Beispiel `ee-toolkit-v2`), damit alle Geräte die neue Version holen.

## Dateien

```
index.html             Seite
style.css              Aussehen
manifest.webmanifest   macht die Seite installierbar
sw.js                  Offline-Betrieb
js/core.js             Zeichen-Kern und Formel-Parser
js/geo.js              Geometrie
js/plots.js            Koordinatensysteme, Bode, Oszilloskop
js/vec.js              Vektoren, Zeiger, Kräfte, schiefe Ebene
js/circuits.js         Schaltzeichen und Schaltungen
js/ui.js               Oberfläche, Export, OneNote-Anbindung
icons/                 App-Symbole
```

Ein neues Werkzeug ist ein `EET.add({ id, g, name, fields, draw })`-Block in einer der Dateien unter `js/`.

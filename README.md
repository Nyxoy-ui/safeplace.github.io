# SafePlace Books PWA

SafePlace Books ist eine vollständig statische Progressive Web App (PWA) zum Schreiben und Lesen interaktiver Bücher. Die Oberfläche ist komplett auf Deutsch, mobile-first gestaltet und für Smartphone, Tablet, Desktop-Browser, Android, iOS und GitHub Pages vorbereitet.

## Funktionen

- Getrennte Login-Optionen für **User / Leser**, **Admin / Autor** und **Main Admin**.
- Einrichtungsassistent beim ersten Start zum Anlegen des Main-Admin-Logins.
- Lokale Bibliothek mit Buchkarten, Cover, Beschreibung, Suchfunktion, Favoriten, zuletzt gelesenen Büchern und Fortschritt.
- Lesemodus mit gespeicherten Antworten direkt an den Fragen im Buchtext.
- Schreibeditor für alle angemeldeten Nutzer sowie Admins: Bücher, Kapitel, Seiten, Absätze, Fragen direkt zwischen Textabsätzen und Veröffentlichung eigener Bücher.
- Zwischenspeichern von Büchern, Antworten, Fortschritt, Favoriten und Logins im Browser über `localStorage`.
- Offline-Nutzung über `service-worker.js` und Web-App-Manifest.
- Dunkles Design mit optionalem hellem Modus.
- Beispielbuch mit Cover, zwei Kapiteln, mehreren Seiten und zwei eingebauten Fragen.

## Dateien

- `index.html` – App-Shell, Menü, Header und Template-Struktur.
- `style.css` – responsives, modernes PWA-Design.
- `script.js` – lokale Datenbank, Login, Rollen, Bibliothek, Reader, Editor und Verwaltung.
- `manifest.json` – PWA-Metadaten für Installation und Homescreen.
- `service-worker.js` – Offline-Cache für GitHub Pages und Browser.
- `README.md` – diese Anleitung.

## App lokal starten

Da Service Worker am zuverlässigsten über einen lokalen Webserver funktionieren, starte die App nicht direkt per Datei-Doppelklick, sondern z. B. so:

```bash
python3 -m http.server 8000
```

Öffne danach im Browser:

```text
http://localhost:8000
```

Beim ersten Start erscheint automatisch der Einrichtungsassistent für den Main Admin. Lege dort deinen Main-Admin-Benutzernamen und dein Passwort fest. Danach meldest du dich über die sichtbare Login-Karte **Main Admin** an.

## Über GitHub Pages veröffentlichen

1. Lade alle Dateien in dein GitHub-Repository hoch.
2. Öffne in GitHub dein Repository.
3. Gehe zu **Settings** → **Pages**.
4. Wähle unter **Build and deployment** die Quelle **Deploy from a branch**.
5. Wähle den Branch, z. B. `main`, und den Ordner `/root`.
6. Speichere die Einstellung.
7. GitHub zeigt dir anschließend die öffentliche Pages-URL an.

Die App ist statisch und benötigt keinen Build-Schritt. Dadurch ist sie direkt für GitHub Pages geeignet.

## Auf Android installieren

1. Öffne die veröffentlichte URL oder deine lokale Test-URL in Chrome oder einem kompatiblen Android-Browser.
2. Warte kurz, bis die App geladen und der Service Worker registriert wurde.
3. Tippe im Browsermenü auf **App installieren** oder **Zum Startbildschirm hinzufügen**.
4. Bestätige die Installation.
5. Danach startet SafePlace Books wie eine normale App vom Homescreen.

## Auf iOS installieren

1. Öffne die App-URL in Safari auf iPhone oder iPad.
2. Tippe auf das Teilen-Symbol.
3. Wähle **Zum Home-Bildschirm**.
4. Vergib bei Bedarf einen Namen und tippe auf **Hinzufügen**.
5. Öffne die App danach über das neue Homescreen-Symbol.

Hinweis: iOS installiert PWAs über Safari. Andere iOS-Browser können die Installation je nach Version anders anzeigen.

## Rollen und Nutzung

### User / Leser

- Bücher lesen.
- Eigene Bücher schreiben und zwischenspeichern.
- Kapitel, Seiten, Absätze und Fragen im Text anlegen.
- Eigene Entwürfe veröffentlichen, damit sie in der Bibliothek sichtbar werden.
- Fragen direkt im Buch beantworten.
- Antworten lokal speichern.
- Lesefortschritt speichern und später weiterlesen.
- Bücher favorisieren.

Neue Leser können über die User-Login-Karte lokal registriert werden.

### Admin / Autor

- Eigene Bücher erstellen, bearbeiten und veröffentlichen.
- Kapitel und Seiten hinzufügen.
- Texte zwischenspeichern.
- Schriftart und Schriftgröße pro Buch ändern.
- Cover per URL oder Data-URL hinterlegen.
- Fragen direkt in den Textfluss einfügen.

Admin-Logins erstellt der Main Admin in der Verwaltung.

### Main Admin

- Hat alle Rechte eines Admins.
- Erstellt Admin- und User-Logins.
- Verwaltet und löscht Benutzer.
- Verwaltet und löscht Bücher.

## Beispielbuch

Beim ersten Start wird automatisch das Beispielbuch **„Das Haus zwischen den Seiten“** angelegt. Es enthält:

- ein Cover,
- mindestens zwei Kapitel,
- mehrere Seiten,
- Fragen direkt zwischen den Textabsätzen.

Du kannst es im Admin- oder Main-Admin-Modus öffnen und im Editor ansehen. User können über **Bücher schreiben** eigene neue Bücher anlegen, zunächst als Entwurf speichern und anschließend selbst veröffentlichen.

## Wichtiger Sicherheitshinweis

Diese Version speichert Logins, Bücher, Antworten und Fortschritte ausschließlich lokal im Browser über `localStorage`. Das ist praktisch für eine einfache Demo, einen Prototyp oder persönliche Offline-Nutzung.

Für eine echte öffentliche App ist dieser lokale Login **nicht sicher genug**. Passwörter liegen im Browser-Speicher und können von technisch versierten Personen ausgelesen oder verändert werden. Für öffentliche Nutzung, echte Benutzerkonten, Synchronisierung zwischen Geräten und sichere Rechteverwaltung brauchst du später ein Backend, z. B.:

- Firebase Authentication + Firestore,
- Supabase Auth + Database,
- oder ein eigenes Backend mit sicherer Passwortspeicherung und serverseitiger Rollenprüfung.

## Daten zurücksetzen

Wenn du die App neu einrichten möchtest, lösche im Browser die Website-Daten für diese Domain oder führe in der Entwicklerkonsole aus:

```js
localStorage.removeItem('safeplace-books-db-v1');
localStorage.removeItem('safeplace-books-session-v1');
location.reload();
```

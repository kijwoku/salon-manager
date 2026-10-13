# Salon Manager

Aplikacja do zarządzania zadaniami w salonie kosmetycznym. Działa w przeglądarce na telefonie i na laptopie.

- **Kierownik** (`manager`) tworzy listy zadań dla wybranego pracownika, usuwa listy i zadania oraz ogląda raporty z czasami wykonania.
- **Pracownik** (`employee`) widzi tylko swoje listy i odhacza wykonane zadania (pomyłkę można cofnąć).
- Czas zadania = moment odhaczenia − moment utworzenia. Oba czasy ustawia serwer. Niewykonane zadanie pozostaje otwarte, a jego czas rośnie.

Technologie: Angular 21, Tailwind CSS 4, Supabase (baza danych + logowanie), hosting na GitHub Pages.

## 1. Supabase

1. Załóż darmowe konto na [supabase.com](https://supabase.com) i utwórz nowy projekt.
2. Otwórz **SQL Editor**, wklej całą zawartość pliku [`supabase/schema.sql`](supabase/schema.sql) i kliknij **Run**. Skrypt można uruchamiać wielokrotnie.
3. Dodaj użytkowników: **Authentication → Users → Add user** (e-mail + hasło, zaznacz *Auto Confirm User*). W aplikacji nie ma rejestracji — konta zakłada się tylko tutaj.
4. Otwórz **Table Editor → profiles**. Każdy nowy użytkownik ma tam automatycznie utworzony wiersz:
   - w kolumnie `full_name` wpisz imię i nazwisko (to ono wyświetla się w aplikacji),
   - szefom ustaw `role` na `manager`. Pozostali zostają z domyślnym `employee`.

> Użytkownicy dodani **przed** uruchomieniem `schema.sql` nie mają wiersza w `profiles` — usuń ich i dodaj ponownie.

## 2. Połączenie aplikacji z Supabase

W Supabase otwórz **Project Settings → API** i skopiuj *Project URL* oraz klucz *anon public*. Wklej je do pliku [`src/environments/environment.ts`](src/environments/environment.ts):

```ts
export const environment = {
  supabaseUrl: 'https://twoj-projekt.supabase.co',
  supabaseAnonKey: 'twój klucz anon',
};
```

Klucz `anon` jest publiczny z założenia i może być w repozytorium — dostęp do danych chronią reguły RLS z `schema.sql`. **Nigdy nie wklejaj tu klucza `service_role`.**

Dopóki w pliku są wartości `TODO`, aplikacja pokazuje komunikat, że nie jest połączona z bazą danych.

## 3. Uruchomienie lokalne

Wymagany Node.js 20.19+, 22.12+ lub 24.

```bash
npm install
```

```bash
npm start
```

Aplikacja działa pod adresem <http://localhost:4200>.

Pozostałe polecenia: `npm run build` (wersja produkcyjna), `npm test` (testy), `npm run build:pages` (wersja dla GitHub Pages).

## 4. Publikacja na GitHub Pages

1. Wypchnij repozytorium na GitHub pod nazwą **`salon-manager`** (adres strony to `https://<login>.github.io/salon-manager/`; przy innej nazwie zmień `--base-href` w skrypcie `build:pages` w `package.json`).
2. W repozytorium wejdź w **Settings → Pages** i w polu **Source** wybierz **GitHub Actions**.
3. Każdy `push` do gałęzi `main` uruchamia [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), który buduje aplikację i ją publikuje. Postęp widać w zakładce **Actions**.

Build kopiuje `index.html` do `404.html`, dzięki czemu bezpośrednie linki (np. `/salon-manager/reports`) i odświeżanie strony działają poprawnie.

## Ważne

- **Darmowe projekty Supabase są wstrzymywane po około 7 dniach bez aktywności.** Jeśli logowanie przestanie działać po dłuższej przerwie, wejdź do panelu Supabase i kliknij **Restore project**.
- Adresy w aplikacji: `/login`, `/my-tasks` (pracownik), `/team` i `/reports` (kierownik).
- Usunięcie użytkownika w Supabase usuwa też jego listy i zadania.

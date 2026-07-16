-- ============================================================
-- Mushroom Finder — schema MVP (Italia + Spagna, 12 specie)
-- ============================================================

-- 1. SPECIE
-- Parametri di crescita ricavati dallo studio micologico.
create table species (
  id uuid primary key default gen_random_uuid(),
  scientific_name text not null unique,       -- es. "Boletus edulis"
  common_name_it text not null,               -- es. "Porcino"
  common_name_es text not null,               -- es. "Hongo blanco"
  is_mycorrhizal boolean not null,            -- true = simbionte, false = saprotrofo/lignicolo
  host_trees text[],                          -- es. {'faggio','castagno','quercia','pino'}
  soil_ph_min numeric(3,1),
  soil_ph_max numeric(3,1),
  soil_temp_min_c numeric(4,1),               -- soglia minima suolo per fruttificazione
  air_temp_min_c numeric(4,1),
  air_temp_max_c numeric(4,1),
  humidity_min_pct numeric(4,1),
  rain_cumulative_mm_min numeric(5,1),         -- pioggia minima nella finestra sotto
  rain_window_days int,                        -- finestra di accumulo pioggia (es. 7 o 15 giorni)
  fruiting_delay_days_min int,                 -- giorni minimi dalla pioggia alla comparsa
  fruiting_delay_days_max int,                 -- giorni massimi
  altitude_min_m int,
  altitude_max_m int,
  season_start_month int,                      -- 1-12
  season_end_month int,                        -- 1-12
  notes text
);

-- 2. ZONE GEOGRAFICHE
-- Suddivisione selezionabile per paese/regione/città usata come unità di previsione.
create table zones (
  id uuid primary key default gen_random_uuid(),
  country text not null,                       -- 'IT' | 'ES'
  region text not null,                        -- es. "Toscana", "Cataluña"
  province_or_city text,                       -- es. "Arezzo", "Girona"
  centroid_lat numeric(9,6) not null,
  centroid_lon numeric(9,6) not null,
  elevation_avg_m int,
  dominant_vegetation text[],                  -- es. {'querceto','pineta','faggeta'}
  soil_type text,                              -- es. "argilloso-calcareo"
  soil_ph_avg numeric(3,1)
);

-- 3. SNAPSHOT METEO/SUOLO PER ZONA
-- Dati recuperati periodicamente dalle fonti esterne (Open-Meteo, SoilGrids, AEMET, ARPA...).
create table weather_snapshots (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zones(id) on delete cascade,
  fetched_at timestamptz not null default now(),
  source text not null,                        -- es. "open-meteo", "aemet"
  air_temp_c numeric(4,1),
  soil_temp_c numeric(4,1),
  humidity_pct numeric(4,1),
  rain_last_7d_mm numeric(5,1),
  rain_last_15d_mm numeric(5,1),
  wind_kmh numeric(4,1)
);
create index on weather_snapshots (zone_id, fetched_at desc);

-- 4. PREVISIONI DI RACCOLTA
-- Output calcolato incrociando species + zones + weather_snapshots più recente.
create table forecasts (
  id uuid primary key default gen_random_uuid(),
  species_id uuid not null references species(id) on delete cascade,
  zone_id uuid not null references zones(id) on delete cascade,
  computed_at timestamptz not null default now(),
  score int not null,                          -- 0-100, probabilità di ritrovamento
  window_start date,
  window_end date,
  explanation text                             -- breve motivazione leggibile (es. "pioggia 45mm 6 giorni fa, suolo a 14°C")
);
create index on forecasts (zone_id, species_id, computed_at desc);

-- 5. RICERCA UTENTE (opzionale, per salvare zone/specie preferite)
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                                -- collegato a auth.users di Supabase
  species_id uuid references species(id),
  zone_id uuid references zones(id),
  created_at timestamptz not null default now()
);

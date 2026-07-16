# Mushroom Finder

PWA per la previsione di crescita e raccolta funghi per zona (Italia + Spagna).

## Setup

1. Crea un nuovo repo su GitHub e carica tutti questi file (via github.dev o `git push`).
2. Su [supabase.com](https://supabase.com) crea un nuovo progetto, poi in **SQL Editor** esegui il contenuto di `supabase/schema.sql`.
3. Copia `.env.example` in `.env.local` e inserisci `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (li trovi in Supabase → Project Settings → API).
4. Su [vercel.com](https://vercel.com) importa il repo GitHub. Aggiungi le stesse due variabili d'ambiente in Vercel → Settings → Environment Variables.
5. Deploy. Dovresti vedere la pagina "Scaffold pronto".

## Icone PWA mancanti

Servono due file in `public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Puoi generarle da un logo qualsiasi con un tool online di conversione PWA icon, oppure dimmelo e te le preparo io in un prossimo passaggio.

## Struttura

- `src/App.tsx` — pagina principale (da espandere con selezione zona e lista specie)
- `src/lib/supabaseClient.ts` — client Supabase pronto all'uso
- `supabase/schema.sql` — schema del database (specie, zone, meteo, previsioni)

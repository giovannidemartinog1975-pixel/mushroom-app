import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

type Species = {
  id: string
  scientific_name: string
  common_name_it: string
  common_name_es: string
  season_start_month: number
  season_end_month: number
}

function App() {
  const [species, setSpecies] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSpecies() {
      const { data, error } = await supabase
        .from('species')
        .select('id, scientific_name, common_name_it, common_name_es, season_start_month, season_end_month')
        .order('common_name_it')

      if (error) {
        setError(error.message)
      } else {
        setSpecies(data ?? [])
      }
      setLoading(false)
    }

    loadSpecies()
  }, [])

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <h1 className="text-2xl font-semibold text-green-900 text-center mb-6">
        Mushroom Finder
      </h1>

      {loading && <p className="text-center text-stone-500">Carico le specie...</p>}
      {error && <p className="text-center text-red-600">Errore: {error}</p>}

      {!loading && !error && (
        <ul className="max-w-md mx-auto space-y-2">
          {species.map((s) => (
            <li
              key={s.id}
              className="bg-white rounded-lg shadow-sm p-3 border border-stone-200"
            >
              <p className="font-medium text-green-900">{s.common_name_it}</p>
              <p className="text-sm text-stone-500 italic">{s.scientific_name}</p>
              <p className="text-xs text-stone-400 mt-1">
                Stagione: mesi {s.season_start_month}-{s.season_end_month}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App

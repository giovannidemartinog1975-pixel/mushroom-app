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

type Zone = {
  id: string
  country: string
  region: string
  province_or_city: string | null
}

function App() {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [species, setSpecies] = useState<Species[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica le zone disponibili una sola volta all'avvio
  useEffect(() => {
    async function loadZones() {
      const { data, error } = await supabase
        .from('zones')
        .select('id, country, region, province_or_city')
        .order('country')

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setZones(data ?? [])
      if (data && data.length > 0) {
        setSelectedZoneId(data[0].id)
      } else {
        setLoading(false)
      }
    }

    loadZones()
  }, [])

  // Per ora la lista specie non dipende ancora dalla zona selezionata:
  // la carichiamo tutta finché non colleghiamo il meteo reale.
  useEffect(() => {
    async function loadSpecies() {
      setLoading(true)
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

    if (selectedZoneId) {
      loadSpecies()
    }
  }, [selectedZoneId])

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <h1 className="text-2xl font-semibold text-green-900 text-center mb-4">
        Mushroom Finder
      </h1>

      <div className="max-w-md mx-auto mb-6">
        <label className="block text-sm text-stone-600 mb-1" htmlFor="zone-select">
          Zona
        </label>
        <select
          id="zone-select"
          className="w-full rounded-lg border border-stone-300 p-2 bg-white"
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.province_or_city ? `${z.province_or_city}, ` : ''}
              {z.region} ({z.country})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-center text-red-600">Errore: {error}</p>}
      {loading && !error && <p className="text-center text-stone-500">Carico...</p>}

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

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
  centroid_lat: number
  centroid_lon: number
}

type WeatherNow = {
  air_temp_c: number
  humidity_pct: number
  rain_last_7d_mm: number
}

function App() {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [species, setSpecies] = useState<Species[]>([])
  const [weather, setWeather] = useState<WeatherNow | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica le zone disponibili una sola volta all'avvio
  useEffect(() => {
    async function loadZones() {
      const { data, error } = await supabase
        .from('zones')
        .select('id, country, region, province_or_city, centroid_lat, centroid_lon')
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

  // Lista specie (sempre tutte, per ora)
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

  // Meteo live da Open-Meteo per la zona selezionata
  useEffect(() => {
    const zone = zones.find((z) => z.id === selectedZoneId)
    if (!zone) return

    async function loadWeather() {
      setWeatherError(null)
      setWeather(null)
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${zone!.centroid_lat}` +
          `&longitude=${zone!.centroid_lon}` +
          `&current=temperature_2m,relative_humidity_2m` +
          `&daily=precipitation_sum&past_days=7&forecast_days=1` +
          `&timezone=auto`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Open-Meteo ha risposto ${res.status}`)
        const json = await res.json()

        const rain7d: number[] = json.daily?.precipitation_sum ?? []
        const rainSum = rain7d.reduce((sum, v) => sum + (v ?? 0), 0)

        setWeather({
          air_temp_c: json.current?.temperature_2m,
          humidity_pct: json.current?.relative_humidity_2m,
          rain_last_7d_mm: Math.round(rainSum * 10) / 10
        })
      } catch (e) {
        setWeatherError(e instanceof Error ? e.message : 'Errore sconosciuto')
      }
    }

    loadWeather()
  }, [selectedZoneId, zones])

  return (
    <main className="min-h-screen bg-stone-50 p-4">
      <h1 className="text-2xl font-semibold text-green-900 text-center mb-4">
        Mushroom Finder
      </h1>

      <div className="max-w-md mx-auto mb-4">
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

      <div className="max-w-md mx-auto mb-6 bg-white rounded-lg shadow-sm p-3 border border-stone-200">
        <p className="text-sm font-medium text-stone-700 mb-1">Meteo attuale</p>
        {weatherError && <p className="text-red-600 text-sm">Errore meteo: {weatherError}</p>}
        {!weatherError && !weather && <p className="text-stone-500 text-sm">Carico meteo...</p>}
        {weather && (
          <div className="text-sm text-stone-600 space-y-0.5">
            <p>Temperatura aria: {weather.air_temp_c}°C</p>
            <p>Umidità relativa: {weather.humidity_pct}%</p>
            <p>Pioggia ultimi 7 giorni: {weather.rain_last_7d_mm} mm</p>
          </div>
        )}
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

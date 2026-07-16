// Calcola un punteggio 0-100 di "probabilità di ritrovamento" per una specie
// in una zona, incrociando i suoi parametri di crescita con il meteo reale.

export type SpeciesParams = {
  is_mycorrhizal: boolean
  host_trees: string[] | null
  soil_temp_min_c: number | null
  air_temp_min_c: number | null
  air_temp_max_c: number | null
  humidity_min_pct: number | null
  rain_cumulative_mm_min: number | null
  altitude_min_m: number | null
  altitude_max_m: number | null
  season_start_month: number
  season_end_month: number
}

export type ZoneParams = {
  dominant_vegetation: string[] | null
  elevation_avg_m: number | null
}

export type CurrentWeather = {
  air_temp_c: number
  soil_temp_c: number
  humidity_pct: number
  rain_last_7d_mm: number
}

function isInSeason(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end
  // stagione a cavallo di fine/inizio anno (es. ottobre-aprile)
  return month >= start || month <= end
}

function ratioScore(actual: number, min: number): number {
  if (min <= 0) return 100
  const ratio = actual / min
  return Math.max(0, Math.min(100, ratio * 100))
}

function rangeScore(actual: number, min: number | null, max: number | null): number {
  if (min === null || max === null) return 100
  if (actual >= min && actual <= max) return 100
  const distance = actual < min ? min - actual : actual - max
  // ogni grado di distanza toglie 15 punti
  return Math.max(0, 100 - distance * 15)
}

export function computeScore(
  species: SpeciesParams,
  zone: ZoneParams,
  weather: CurrentWeather,
  currentMonth: number
): { score: number; explanation: string } {
  const notes: string[] = []

  const rainScore = ratioScore(weather.rain_last_7d_mm, species.rain_cumulative_mm_min ?? 0)
  notes.push(`pioggia 7gg ${weather.rain_last_7d_mm}mm`)

  const airScore = rangeScore(weather.air_temp_c, species.air_temp_min_c, species.air_temp_max_c)
  notes.push(`aria ${weather.air_temp_c}°C`)

  const soilOk =
    species.soil_temp_min_c === null || weather.soil_temp_c >= species.soil_temp_min_c
  const soilScore = soilOk ? 100 : 30
  notes.push(`suolo ${weather.soil_temp_c}°C`)

  const humidityScore = ratioScore(weather.humidity_pct, species.humidity_min_pct ?? 0)

  let vegetationScore = 100
  if (species.is_mycorrhizal && species.host_trees && species.host_trees.length > 0) {
    const zoneVeg = zone.dominant_vegetation ?? []
    const hasMatch = species.host_trees.some((tree) =>
      zoneVeg.some((v) => v.toLowerCase().includes(tree.toLowerCase()))
    )
    vegetationScore = hasMatch ? 100 : 20
  }

  let altitudeScore = 100
  if (
    zone.elevation_avg_m !== null &&
    species.altitude_min_m !== null &&
    species.altitude_max_m !== null
  ) {
    altitudeScore =
      zone.elevation_avg_m >= species.altitude_min_m &&
      zone.elevation_avg_m <= species.altitude_max_m
        ? 100
        : 40
  }

  const inSeason = isInSeason(currentMonth, species.season_start_month, species.season_end_month)
  const seasonMultiplier = inSeason ? 1 : 0.15

  const baseScore =
    (rainScore * 0.3 +
      airScore * 0.2 +
      soilScore * 0.2 +
      humidityScore * 0.15 +
      vegetationScore * 0.1 +
      altitudeScore * 0.05)

  const finalScore = Math.round(baseScore * seasonMultiplier)

  const explanation = inSeason
    ? notes.join(', ')
    : `fuori stagione (mesi ${species.season_start_month}-${species.season_end_month}), ${notes.join(', ')}`

  return { score: finalScore, explanation }
}

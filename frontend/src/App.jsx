import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function hasCoordinates(site) {
  return (
    Number.isFinite(site.latitude) &&
    Number.isFinite(site.longitude) &&
    Math.abs(site.latitude) <= 90 &&
    Math.abs(site.longitude) <= 180
  )
}

function createPopup(site) {
  const popup = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = site.name
  popup.append(title)

  const capacity = site.capacity == null
    ? 'Ikke oppgitt'
    : `${site.capacity} ${site.capacity_unit ?? ''}`.trim()

  const details = [
    ['Lokalitetsnummer', site.site_nr],
    ['Kommune', site.municipality_name],
    ['Fylke', site.county_name],
    ['Kapasitet', capacity],
  ]

  for (const [label, value] of details) {
    const line = document.createElement('div')
    line.textContent = `${label}: ${value ?? 'Ikke oppgitt'}`
    popup.append(line)
  }

  return popup
}

export default function App() {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(null)

  const [sites, setSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [county, setCounty] = useState('')

  // Opprett kartet én gang.
  useEffect(() => {
    const map = L.map(mapContainer.current).setView([65, 13], 5)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapRef.current = map
    markersRef.current = L.layerGroup().addTo(map)

    // Tilpass kartet hvis plassen endrer seg, også på mobil.
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(mapContainer.current)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      markersRef.current = null
    }
  }, [])

  // Hent data fra backend.
  useEffect(() => {
    const controller = new AbortController()

    async function loadSites() {
      try {
        const response = await fetch('/api/sites', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`API-et svarte med ${response.status}`)
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error('API-et returnerte ikke en liste')
        }

        if (!controller.signal.aborted) {
          setSites(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(`Kunne ikke hente lokaliteter: ${err.message}`)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadSites()

    return () => controller.abort()
  }, [])

  const validSites = useMemo(
    () => sites.filter(hasCoordinates),
    [sites]
  )

  const counties = useMemo(
    () => [...new Set(
      validSites.map((site) => site.county_name).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'nb')),
    [validSites]
  )

  const filteredSites = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('nb')

    return validSites.filter((site) => {
      const matchesSearch =
        (site.name ?? '').toLocaleLowerCase('nb').includes(query) ||
        String(site.site_nr ?? '').includes(query)

      const matchesCounty = !county || site.county_name === county

      return matchesSearch && matchesCounty
    })
  }, [validSites, search, county])

  // Oppdater markørene når søket eller fylkesfilteret endres.
  useEffect(() => {
    const map = mapRef.current
    const markers = markersRef.current
    if (!map || !markers) return

    markers.clearLayers()
    const positions = []

    for (const site of filteredSites) {
      const position = [site.latitude, site.longitude]

      L.circleMarker(position, {
        radius: 6,
        color: '#075985',
        fillColor: '#0ea5e9',
        fillOpacity: 0.8,
        weight: 1,
      })
        .bindPopup(createPopup(site))
        .addTo(markers)

      positions.push(position)
    }

    if (positions.length > 0) {
      map.fitBounds(positions, {
        padding: [30, 30],
        maxZoom: 12,
      })
    }
  }, [filteredSites])

  const status = loading
    ? 'Henter lokaliteter …'
    : error || (
      filteredSites.length === 0
        ? 'Ingen lokaliteter å vise.'
        : `Viser ${filteredSites.length} av ${validSites.length} lokaliteter`
    )

  return (
    <main className="app">
      <header>
        <h1>Akvamap</h1>
        <p aria-live="polite">{status}</p>

        {!loading && !error && sites.length > validSites.length && (
          <p>
            {sites.length - validSites.length} lokaliteter mangler
            gyldige koordinater.
          </p>
        )}

        <div className="filters">
          <label>
            Søk etter lokalitet
            <input
              type="search"
              placeholder="Navn eller lokalitetsnummer"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={loading || Boolean(error)}
            />
          </label>

          <label>
            Fylke
            <select
              value={county}
              onChange={(event) => setCounty(event.target.value)}
              disabled={loading || Boolean(error)}
            >
              <option value="">Alle fylker</option>
              {counties.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearch('')
              setCounty('')
            }}
            disabled={!search && !county}
          >
            Nullstill filtre
          </button>
        </div>
      </header>

      <div ref={mapContainer} className="map" />
    </main>
  )
}
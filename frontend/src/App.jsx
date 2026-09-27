import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function App() {
  const mapContainer = useRef(null)
  const [status, setStatus] = useState('Henter lokaliteter …')

  useEffect(() => {
    const controller = new AbortController()
    const map = L.map(mapContainer.current).setView([65, 13], 5)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    async function loadSites() {
      try {
        const response = await fetch('/api/sites', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`API-et svarte med ${response.status}`)
        }

        const sites = await response.json()
        const positions = []

        for (const site of sites) {
          const lat = site.latitude
          const lng = site.longitude

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            Math.abs(lat) > 90 ||
            Math.abs(lng) > 180
          ) {
            continue
          }

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

          L.circleMarker([lat, lng], {
            radius: 6,
            color: '#075985',
            fillColor: '#0ea5e9',
            fillOpacity: 0.8,
            weight: 1,
          })
            .addTo(map)
            .bindPopup(popup)

          positions.push([lat, lng])
        }

        if (positions.length > 0) {
          map.fitBounds(positions, { padding: [30, 30], maxZoom: 12 })
        }

        setStatus(`Viser ${positions.length} lokaliteter`)
      } catch (error) {
        if (controller.signal.aborted) return
        setStatus(`Kunne ikke hente lokaliteter: ${error.message}`)
      }
    }

    loadSites()

    return () => {
      controller.abort()
      map.remove()
    }
  }, [])

  return (
    <main className="app">
      <header>
        <h1>Akvamap</h1>
        <p aria-live="polite">{status}</p>
      </header>
      <div ref={mapContainer} className="map" />
    </main>
  )
}
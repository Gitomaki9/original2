// Inicializar mapa centrado en Cusco
const map = L.map("map").setView([-13.5171, -71.9784], 13);

// Capa base
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Datos simulados
const incidencias = [
  {
    tipo: "accidente",
    coords: [-13.515, -71.975],
    descripcion: "Accidente de tránsito en Av. de la Cultura",
    fecha: "2025-10-13 08:30",
  },
  {
    tipo: "bache",
    coords: [-13.517, -71.982],
    descripcion: "Bache profundo en calle San Andrés",
    fecha: "2025-10-12 14:20",
  },
  {
    tipo: "incendio",
    coords: [-13.519, -71.97],
    descripcion: "Incendio en vivienda – Urb. Ttio",
    fecha: "2025-10-13 10:45",
  },
  {
    tipo: "bache",
    coords: [-13.52, -71.984],
    descripcion: "Hueco en la vía frente al mercado",
    fecha: "2025-10-11 16:10",
  },
];

// Iconos
const iconos = {
  accidente: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2554/2554961.png",
    iconSize: [35, 35],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  }),
  bache: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/1161/1161388.png",
    iconSize: [35, 35],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  }),
  incendio: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/482/482059.png",
    iconSize: [35, 35],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  }),
};

// Crear marcadores
let marcadores = [];

function mostrarMarcadores(filtro) {
  marcadores.forEach((m) => map.removeLayer(m));
  marcadores = [];

  incidencias
    .filter((i) => filtro === "todos" || i.tipo === filtro)
    .forEach((i) => {
      const marker = L.marker(i.coords, { icon: iconos[i.tipo] })
        .bindPopup(
          `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 10px; color: #2c3e50; text-transform: capitalize;">${i.tipo}</h3>
            <p style="margin: 0 0 8px;">${i.descripcion}</p>
            <p style="margin: 0; font-size: 0.9em; color: #7f8c8d;">Reportado: ${i.fecha}</p>
          </div>
        `
        )
        .addTo(map);
      marcadores.push(marker);
    });

  actualizarEstadisticas(filtro);
}

// Actualizar estadísticas
function actualizarEstadisticas(filtro) {
  const total = document.getElementById("total-count");
  const accidentes = document.getElementById("accidente-count");
  const baches = document.getElementById("bache-count");
  const incendios = document.getElementById("incendio-count");

  if (filtro === "todos") {
    total.textContent = incidencias.length;
    accidentes.textContent = incidencias.filter(
      (i) => i.tipo === "accidente"
    ).length;
    baches.textContent = incidencias.filter((i) => i.tipo === "bache").length;
    incendios.textContent = incidencias.filter(
      (i) => i.tipo === "incendio"
    ).length;
  } else {
    const filtradas = incidencias.filter((i) => i.tipo === filtro);
    total.textContent = filtradas.length;
    accidentes.textContent = filtro === "accidente" ? filtradas.length : 0;
    baches.textContent = filtro === "bache" ? filtradas.length : 0;
    incendios.textContent = filtro === "incendio" ? filtradas.length : 0;
  }
}

// Inicialización
mostrarMarcadores("todos");

// Filtro dinámico
document.getElementById("tipo").addEventListener("change", (e) => {
  mostrarMarcadores(e.target.value);
});

// Círculo central
L.circle([-13.5171, -71.9784], {
  color: "#3498db",
  fillColor: "#3498db",
  fillOpacity: 0.1,
  radius: 1500,
})
  .addTo(map)
  .bindPopup("Centro de Cusco");

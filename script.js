// Configuración inicial del mapa - centrado en Comunitat Valenciana
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=khpYaWwMTabvpR0t8ghe',
    center: [-0.3774, 39.4598], // Centro de Comunitat Valenciana
    zoom: 8
});

// Referencias a elementos DOM
const locateBtn = document.getElementById('locate-btn');
const shareBtn = document.getElementById('share-btn');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const changeStyleBtn = document.getElementById('change-style');

// Variables para control de estilos de mapa
let currentStyle = 'streets';
const mapStyles = {
    'streets': 'https://api.maptiler.com/maps/streets-v2/style.json?key=khpYaWwMTabvpR0t8ghe',
    'satellite': 'https://api.maptiler.com/maps/satellite/style.json?key=khpYaWwMTabvpR0t8ghe',
};

// Función para crear popups
function setupPopups() {
    // Popup para zonas inundables
    map.on('click', 'zonas-inundables-layer', (e) => {
        const properties = e.features[0].properties;
        const coordinates = e.lngLat;
        
        let popupContent = `
            <div class="popup-title">
                <i class="" style="color: #ff0000; margin-right: 5px;"></i>
                Zona Inundable
            </div>
            <div class="popup-content">
                <div class="popup-risk"></div>
        `;
        
        // Añadir información específica si está disponible en las propiedades
        if (properties.nombre) {
            popupContent += `<div><strong>Nombre:</strong> ${properties.nombre}</div>`;
        }
        if (properties.riesgo) {
            popupContent += `<div><strong>Nivel de riesgo:</strong> ${properties.riesgo}</div>`;
        }
        
        popupContent += `
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    <i class="fas fa-info-circle"></i> Evite esta zona durante lluvias intensas
                </div>
            </div>
        `;
        
        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
    });
    
    // Popup para cauces de ríos
    map.on('click', 'cauces-rios-fill', (e) => {
        const properties = e.features[0].properties;
        const coordinates = e.lngLat;
        
        let popupContent = `
            <div class="popup-title">
                <i class="fas fa-water" style="color: #3498db; margin-right: 5px;"></i>
                Cauce de Río
            </div>
            <div class="popup-content">
        `;
        
        // Añadir información específica si está disponible en las propiedades
        if (properties.nombre) {
            popupContent += `<div><strong>Nombre:</strong> ${properties.nombre}</div>`;
        }
        if (properties.longitud) {
            popupContent += `<div><strong>Longitud:</strong> ${properties.longitud} km</div>`;
        }
        
        popupContent += `
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    <i class="fas fa-info-circle"></i> No cruce con corriente de agua
                </div>
            </div>
        `;
        
        new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupContent)
            .addTo(map);
    });
    
    // Cambiar cursor al pasar sobre las capas
    map.on('mouseenter', 'zonas-inundables-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseenter', 'cauces-rios-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'zonas-inundables-layer', () => {
        map.getCanvas().style.cursor = '';
    });
    
    map.on('mouseleave', 'cauces-rios-fill', () => {
        map.getCanvas().style.cursor = '';
    });
}

// Función para cargar las capas GeoJSON
function loadGeoJSONLayers() {
    console.log('🟡 Cargando capas GeoJSON...');
    
    // Cargar cauces de ríos - RUTA CORREGIDA
    fetch('./geojson/cauces-rios.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar cauces-rios.geojson');
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Cauces de ríos cargados:', data);
            
            if (map.getSource('cauces-rios')) {
                map.getSource('cauces-rios').setData(data);
            } else {
                map.addSource('cauces-rios', {
                    type: 'geojson',
                    data: data
                });
                
                // Capa de relleno para cauces
                map.addLayer({
                    id: 'cauces-rios-fill',
                    type: 'fill',
                    source: 'cauces-rios',
                    paint: {
                        'fill-color': '#3498db',
                        'fill-opacity': 0.3
                    }
                });
                
                // Capa de línea para cauces
                map.addLayer({
                    id: 'cauces-rios-line',
                    type: 'line',
                    source: 'cauces-rios',
                    paint: {
                        'line-color': '#2980b9',
                        'line-width': 2
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Error cargando cauces-rios.geojson:', error);
            addSampleRivers();
        });
    
    // Cargar comunidad valenciana - RUTA CORREGIDA
    fetch('./geojson/comunidad_valenciana.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar comunidad_valenciana.geojson');
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Comunidad Valenciana cargada:', data);
            
            if (map.getSource('comunidad-valenciana')) {
                map.getSource('comunidad-valenciana').setData(data);
            } else {
                map.addSource('comunidad-valenciana', {
                    type: 'geojson',
                    data: data
                });
                
                map.addLayer({
                    id: 'comunidad-valenciana-layer',
                    type: 'line',
                    source: 'comunidad-valenciana',
                    paint: {
                        'line-color': '#000000',
                        'line-width': 1,
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Error cargando comunidad_valenciana.geojson:', error);
            addSampleRegion();
        });
    
    // Cargar zonas inundables - RUTA CORREGIDA
    fetch('./geojson/zonas-inundables.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar zonas-inundables.geojson');
            }
            return response.json();
        })
        .then(data => {
            console.log('✅ Zonas inundables cargadas:', data);
            
            if (map.getSource('zonas-inundables')) {
                map.getSource('zonas-inundables').setData(data);
            } else {
                map.addSource('zonas-inundables', {
                    type: 'geojson',
                    data: data
                });
                
                map.addLayer({
                    id: 'zonas-inundables-layer',
                    type: 'fill',
                    source: 'zonas-inundables',
                    paint: {
                        'fill-color': '#ff0000',
                        'fill-opacity': 0.4
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Error cargando zonas-inundables.geojson:', error);
            addSampleFloodZones();
        });
}

// Función para añadir zonas inundables de ejemplo
function addSampleFloodZones() {
    const sampleFloodZones = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "nombre": "Zona inundable ejemplo 1",
                    "riesgo": "Alto",
                    "area": "50000"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-0.35, 39.48],
                        [-0.30, 39.48],
                        [-0.30, 39.52],
                        [-0.35, 39.52],
                        [-0.35, 39.48]
                    ]]
                }
            }
        ]
    };
    
    if (map.getSource('zonas-inundables')) {
        map.getSource('zonas-inundables').setData(sampleFloodZones);
    } else {
        map.addSource('zonas-inundables', {
            type: 'geojson',
            data: sampleFloodZones
        });
        
        map.addLayer({
            id: 'zonas-inundables-layer',
            type: 'fill',
            source: 'zonas-inundables',
            paint: {
                'fill-color': '#ff0000',
                'fill-opacity': 0.4
            }
        });
    }
}

// Función para añadir ríos de ejemplo
function addSampleRivers() {
    const sampleRivers = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "nombre": "Río Turia",
                    "longitud": "280"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [-0.45, 39.45],
                        [-0.40, 39.47],
                        [-0.35, 39.46],
                        [-0.30, 39.48]
                    ]
                }
            }
        ]
    };
    
    if (map.getSource('cauces-rios')) {
        map.getSource('cauces-rios').setData(sampleRivers);
    } else {
        map.addSource('cauces-rios', {
            type: 'geojson',
            data: sampleRivers
        });
        
        // Capa de relleno para cauces
        map.addLayer({
            id: 'cauces-rios-fill',
            type: 'fill',
            source: 'cauces-rios',
            paint: {
                'fill-color': '#3498db',
                'fill-opacity': 0.3
            }
        });
        
        // Capa de línea para cauces
        map.addLayer({
            id: 'cauces-rios-line',
            type: 'line',
            source: 'cauces-rios',
            paint: {
                'line-color': '#2980b9',
                'line-width': 2
            }
        });
    }
}

// Función para añadir región de ejemplo
function addSampleRegion() {
    const sampleRegion = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Comunitat Valenciana"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-0.7, 38.5],
                        [0.5, 38.5],
                        [0.5, 40.5],
                        [-0.7, 40.5],
                        [-0.7, 38.5]
                    ]]
                }
            }
        ]
    };
    
    if (map.getSource('comunidad-valenciana')) {
        map.getSource('comunidad-valenciana').setData(sampleRegion);
    } else {
        map.addSource('comunidad-valenciana', {
            type: 'geojson',
            data: sampleRegion
        });
        
        map.addLayer({
            id: 'comunidad-valenciana-layer',
            type: 'line',
            source: 'comunidad-valenciana',
            paint: {
                'line-color': '#000000',
                'line-width': 3
            }
        });
    }
}

// Función para geolocalizar al usuario
function locateUser() {
    if (!navigator.geolocation) {
        alert('La geolocalización no es compatible con este navegador');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        // Éxito
        function(position) {
            const userLocation = [position.coords.longitude, position.coords.latitude];
            
            // Centrar el mapa en la ubicación del usuario
            map.flyTo({
                center: userLocation,
                zoom: 14
            });
            
            // Añadir marcador de ubicación con efecto de parpadeo
            if (map.getLayer('user-location')) {
                map.getSource('user-location').setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: userLocation
                        },
                        properties: {}
                    }]
                });
            } else {
                map.addSource('user-location', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: userLocation
                            },
                            properties: {}
                        }]
                    }
                });
                
                map.addLayer({
                    id: 'user-location',
                    type: 'circle',
                    source: 'user-location',
                    paint: {
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            10, 8,
                            15, 12,
                            20, 16
                        ],
                        'circle-color': '#2ecc71',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#000000',
                        'circle-opacity': 0.8
                    }
                });
                
                // Añadir una capa adicional para el efecto de pulso
                map.addLayer({
                    id: 'user-location-pulse',
                    type: 'circle',
                    source: 'user-location',
                    paint: {
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            10, 12,
                            15, 18,
                            20, 24
                        ],
                        'circle-color': '#2ecc71',
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#000000',
                        'circle-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            10, 0.5,
                            15, 0.3,
                            20, 0.2
                        ]
                    }
                });
            }
            
            // Aplicar animación de pulso usando setInterval
            let pulseState = true;
            const pulseInterval = setInterval(() => {
                if (pulseState) {
                    map.setPaintProperty('user-location-pulse', 'circle-radius', [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 16,
                        15, 24,
                        20, 32
                    ]);
                } else {
                    map.setPaintProperty('user-location-pulse', 'circle-radius', [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 12,
                        15, 18,
                        20, 24
                    ]);
                }
                pulseState = !pulseState;
            }, 1000);
            
            // Detener la animación después de 10 segundos
            setTimeout(() => {
                clearInterval(pulseInterval);
            }, 10000);
        },
        // Error
        function(error) {
            let errorMessage = 'Error al obtener la ubicación: ';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Permiso denegado por el usuario';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Información de ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Tiempo de espera agotado';
                    break;
                default:
                    errorMessage += 'Error desconocido';
            }
            
            alert(errorMessage);
        }
    );
}

// Función para compartir
function shareMap() {
    if (navigator.share) {
        navigator.share({
            title: 'Mapa de Zonas Inundables - Comunitat Valenciana',
            text: 'Consulta las zonas inundables y cauces de ríos en la Comunitat Valenciana',
            url: window.location.href
        })
        .catch(error => console.log('Error al compartir', error));
    } else {
        // Fallback para navegadores que no soportan Web Share API
        const url = window.location.href;
        const text = 'Consulta las zonas inundables y cauces de ríos en la Comunitat Valenciana: ' + url;
        
        // Abrir enlace de WhatsApp
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }
}

// Función para cambiar estilo del mapa
function changeMapStyle() {
    const styles = Object.keys(mapStyles);
    const currentIndex = styles.indexOf(currentStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    currentStyle = styles[nextIndex];
    
    map.setStyle(mapStyles[currentStyle]);
    
    // Recargar las capas después de cambiar el estilo
    map.once('styledata', () => {
        loadGeoJSONLayers();
        setupPopups();
    });
}

// Función para información meteorológica
function loadWeatherInfo() {
    console.log("🌤️ Información meteorológica - función disponible");
    // Puedes implementar llamadas a API del tiempo aquí
}

// Event Listeners
locateBtn.addEventListener('click', locateUser);
shareBtn.addEventListener('click', shareMap);
zoomInBtn.addEventListener('click', () => map.zoomIn());
zoomOutBtn.addEventListener('click', () => map.zoomOut());
changeStyleBtn.addEventListener('click', changeMapStyle);

// SOLICITAR GEOLOCALIZACIÓN INMEDIATAMENTE AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', function() {
    locateUser();
});

// Cargar capas GeoJSON cuando el mapa esté listo
map.on('load', function() {
    console.log('✅ Mapa cargado correctamente');
    loadGeoJSONLayers();
    setupPopups();
    loadWeatherInfo();
});

// Debug
console.log('🔧 Script cargado correctamente');

// ===== VARIABLES GLOBALES =====
var map;                    // Objeto del mapa Leaflet
var userMarker = null;      // Marcador de la ubicación del usuario
var valenciaBounds = null;  // Límites de la Comunidad Valenciana
var allLayers = [];         // Array para almacenar todas las capas

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Función principal que inicializa toda la aplicación
 */
function initializeApp() {
    showPermissionModal();
    initializeMap();
    setupEventListeners();
    loadAllGeoJSONLayers(); // Cargar las capas GeoJSON
}

/**
 * Muestra el modal de permisos de ubicación al cargar la página
 */
function showPermissionModal() {
    const permissionModal = document.getElementById('permissionModal');
    permissionModal.style.display = 'flex';
    
    // Verificar si ya tenemos permisos de ubicación
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function() {
                // El usuario ya dio permisos anteriormente
                permissionModal.style.display = 'none';
                locateUser();
            },
            function() {
                // El usuario no ha dado permisos aún
                permissionModal.style.display = 'flex';
            }
        );
    }
}

/**
 * Inicializa el mapa Leaflet con configuración básica
 */
function initializeMap() {
    // Crear mapa centrado en Valencia
    map = L.map('map').setView([39.4699, -0.3763], 10);
    
    // Configurar capas base del mapa
    setupBaseLayers();
    
    // Configurar controles del mapa
    setupMapControls();
    
    console.log('Mapa inicializado correctamente');
}

/**
 * Configura las capas base del mapa (OpenStreetMap, Satélite, etc.)
 */
function setupBaseLayers() {
    // Definir las capas base disponibles
    var openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        name: 'OpenStreetMap'
    });

    var satelliteMap = L.tileLayer('https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=khpYaWwMTabvpR0t8ghe', {
        attribution: '© MapTiler © OpenStreetMap contributors',
        name: 'Satélite'
    });

    var brightMap = L.tileLayer('https://api.maptiler.com/maps/bright-v2/{z}/{x}/{y}.png?key=khpYaWwMTabvpR0t8ghe', {
        attribution: '© MapTiler © OpenStreetMap contributors',
        name: 'Claro'
    });

    // Añadir capa base por defecto
    openStreetMap.addTo(map);

    // Configurar control de capas
    var baseMaps = {
        "OpenStreetMap": openStreetMap,
        "Satélite": satelliteMap,
        "Claro": brightMap
    };

    // Crear control de capas
    var layersControl = L.control.layers(baseMaps, null, { 
        position: 'topleft',
        collapsed: true
    }).addTo(map);

    // Crear botón personalizado para compartir (integrado en controles)
    var shareControl = L.Control.extend({
        options: {
            position: ''
        },
        
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = `
                <a href="#" title="Compartir mapa">↗</a>
            `;
            
            L.DomEvent.on(container, 'click', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                shareApp();
            });
            
            return container;
        }
    });
    
    // Añadir control personalizado al mapa
    map.addControl(new shareControl());
}

/**
 * Configura los controles adicionales del mapa
 */
function setupMapControls() {
    // Añadir control de escala
    L.control.scale({ position: 'bottomleft' }).addTo(map);
}

/**
 * Configura todos los event listeners de la aplicación
 */
function setupEventListeners() {
    // Botón de geolocalización en el mapa
    document.getElementById('geolocate-btn-map').addEventListener('click', locateUser);
    
    // Botón de compartir en la barra lateral
    document.getElementById('share-btn').addEventListener('click', shareApp);
    
    // NUEVO: Botón de compartir en el mapa
    document.getElementById('share-btn-map').addEventListener('click', shareApp);
    
    // Botones del modal de permisos
    document.getElementById('allowLocation').addEventListener('click', allowLocation);
    document.getElementById('denyLocation').addEventListener('click', denyLocation);
}

// ===== FUNCIONES DE CARGA DE CAPAS GEOJSON =====

/**
 * Carga todas las capas GeoJSON necesarias para el mapa
 */
function loadAllGeoJSONLayers() {
    console.log('Cargando capas GeoJSON...');
    
    // Cargar todas las capas en paralelo
    Promise.all([
        loadValenciaBoundary(),
        loadZonasInundables(),
        loadCaucesRios()
    ])
    .then(layers => {
        console.log('Todas las capas GeoJSON cargadas correctamente');
        
        // Filtrar capas que se cargaron correctamente
        var validLayers = layers.filter(layer => layer !== null);
        
        if (validLayers.length > 0) {
            // Ajustar la vista del mapa para mostrar todas las capas
            var group = new L.featureGroup(validLayers);
            map.fitBounds(group.getBounds());
            
            console.log(`✅ ${validLayers.length} capas cargadas correctamente`);
        } else {
            console.warn('⚠️ No se pudieron cargar las capas GeoJSON');
        }
    })
    .catch(error => {
        console.error('❌ Error cargando las capas GeoJSON:', error);
    });
}

/**
 * Carga el límite de la Comunidad Valenciana
 */
function loadValenciaBoundary() {
    return fetch('geojson/comunidad_valenciana.geojson')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar el límite de la Comunidad Valenciana');
            return response.json();
        })
        .then(data => {
            // Crear capa con estilo para el límite
            var layer = L.geoJSON(data, {
                style: {
                    fillColor: 'transparent',
                    weight: 2,
                    opacity: 0.8,
                    color: '#495057',
                    fillOpacity: 0
                }
            });
            
            // Establecer los límites del mapa basados en esta capa
            valenciaBounds = layer.getBounds();
            map.setMaxBounds(valenciaBounds);
            map.on('drag', function() {
                map.panInsideBounds(valenciaBounds, { animate: false });
            });
            
            // Añadir capa al mapa y al array de capas
            layer.addTo(map);
            allLayers.push(layer);
            
            console.log('✅ Límite de Comunidad Valenciana cargado');
            return layer;
        })
        .catch(error => {
            console.warn('❌ Error cargando límite de Comunidad Valenciana:', error);
            return null;
        });
}

/**
 * Carga las zonas inundables
 */
function loadZonasInundables() {
    return fetch('geojson/zonas-inundables.geojson')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar las zonas inundables');
            return response.json();
        })
        .then(data => {
            // Crear capa con estilo para zonas inundables
            var layer = L.geoJSON(data, {
                style: {
                    fillColor: '#ff6b6b',
                    weight: 1,
                    opacity: 0.7,
                    color: '#dc3545',
                    fillOpacity: 0.3
                },
                onEachFeature: function(feature, layer) {
                    // Añadir popup informativo para cada zona inundable
                    if (feature.properties) {
                        var popupContent = `
                            <strong>Zona Inundable</strong><br>
                            <strong>Riesgo:</strong> ${feature.properties.leyenda || 'No especificado'}
                        `;
                        layer.bindPopup(popupContent);
                    }
                }
            });
            
            // Añadir capa al mapa y al array de capas
            layer.addTo(map);
            allLayers.push(layer);
            
            console.log('✅ Zonas inundables cargadas');
            return layer;
        })
        .catch(error => {
            console.warn('❌ Error cargando zonas inundables:', error);
            return null;
        });
}

/**
 * Carga los cauces de ríos
 */
function loadCaucesRios() {
    return fetch('geojson/cauces-rios.geojson')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar los cauces de ríos');
            return response.json();
        })
        .then(data => {
            // Crear capa con estilo para cauces de ríos
            var layer = L.geoJSON(data, {
                style: {
                    color: '#17a2b8',
                    weight: 2,
                    opacity: 0.7,
                    fillColor: '#4ecdc4',
                    fillOpacity: 0.2
                },
                onEachFeature: function(feature, layer) {
                    // Añadir popup informativo para cada cauce
                    if (feature.properties) {
                        var nombre = feature.properties.nombre || feature.properties.NOMBRE || 'Sin nombre';
                        var popupContent = `
                            <strong>Cauce de Río</strong><br>
                            <strong>Nombre:</strong> ${nombre}
                        `;
                        layer.bindPopup(popupContent);
                    }
                }
            });
            
            // Añadir capa al mapa y al array de capas
            layer.addTo(map);
            allLayers.push(layer);
            
            console.log('✅ Cauces de ríos cargados');
            return layer;
        })
        .catch(error => {
            console.warn('❌ Error cargando cauces de ríos:', error);
            return null;
        });
}

// ===== FUNCIONES DE GEOLOCALIZACIÓN =====

/**
 * Solicita la ubicación del usuario y la muestra en el mapa
 */
function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // Éxito: actualizar ubicación en el mapa
                updateUserLocation(position);
            },
            function(error) {
                // Error: mostrar mensaje en consola
                console.log('Geolocalización denegada o no disponible:', error.message);
                map.setView([39.4699, -0.3763], 10);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    } else {
        console.log('La geolocalización no es soportada por su navegador');
    }
}

/**
 * Actualiza la posición del usuario en el mapa
 * @param {Object} position - Objeto con las coordenadas del usuario
 */
function updateUserLocation(position) {
    var latlng = [position.coords.latitude, position.coords.longitude];
    
    // Centrar mapa en la ubicación del usuario
    map.setView(latlng, 16);
    
    // Eliminar marcador anterior si existe
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    // Crear nuevo marcador de ubicación
    userMarker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-location-pulse"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map);
    
    // Añadir popup informativo
    userMarker.bindPopup('<strong>Estás aquí</strong>').openPopup();
}

// ===== FUNCIONES DEL MODAL DE PERMISOS =====

/**
 * Maneja la aceptación de permisos de ubicación
 */
function allowLocation() {
    document.getElementById('permissionModal').style.display = 'none';
    locateUser();
}

/**
 * Maneja la denegación de permisos de ubicación
 */
function denyLocation() {
    document.getElementById('permissionModal').style.display = 'none';
    map.setView([39.4699, -0.3763], 10);
}

// ===== FUNCIONES DE COMPARTIR =====

/**
 * Comparte la aplicación mediante Web Share API o WhatsApp
 */
function shareApp() {
    if (navigator.share) {
        // Usar Web Share API si está disponible (móviles)
        navigator.share({
            title: 'Zonas Inundables y Cauces en Comunitat Valenciana',
            text: 'Consulta las zonas de riesgo de inundación en la Comunidad Valenciana',
            url: window.location.href
        });
    } else {
        // Fallback: abrir WhatsApp con el mensaje
        const url = window.location.href;
        const text = 'Zonas Inundables y Cauces en Comunitat Valenciana - Consulta las zonas de riesgo de inundación';
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        window.open(whatsappUrl, '_blank');
    }
}

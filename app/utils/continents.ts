export interface ContinentalCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ContinentConfig {
  key: string;
  name: string;
  startLat: number;
  endLat: number;
  centerLng: number;
  defaultZoom: number;
  cities: ContinentalCity[];
}

export const CONTINENTS: Record<string, ContinentConfig> = {
  south_america: {
    key: 'south_america',
    name: 'América del Sur',
    startLat: 12.0, // Near northern Venezuela/Colombia
    endLat: -56.0,  // Near southern Chile/Argentina
    centerLng: -60.0,
    defaultZoom: 4,
    cities: [
      { name: 'Caracas', country: 'Venezuela', latitude: 10.4806, longitude: -66.9036 },
      { name: 'Bogotá', country: 'Colombia', latitude: 4.7110, longitude: -74.0721 },
      { name: 'Quito', country: 'Ecuador', latitude: -0.1807, longitude: -78.4678 },
      { name: 'Manaos', country: 'Brasil', latitude: -3.1190, longitude: -60.0217 },
      { name: 'Lima', country: 'Perú', latitude: -12.0464, longitude: -77.0428 },
      { name: 'La Paz', country: 'Bolivia', latitude: -16.5000, longitude: -68.1500 },
      { name: 'Brasilia', country: 'Brasil', latitude: -15.7975, longitude: -47.8919 },
      { name: 'Asunción', country: 'Paraguay', latitude: -25.2637, longitude: -57.5759 },
      { name: 'São Paulo', country: 'Brasil', latitude: -23.5505, longitude: -46.6333 },
      { name: 'Santiago', country: 'Chile', latitude: -33.4489, longitude: -70.6693 },
      { name: 'Buenos Aires', country: 'Argentina', latitude: -34.6037, longitude: -58.3816 },
      { name: 'Montevideo', country: 'Uruguay', latitude: -34.9011, longitude: -56.1645 },
      { name: 'Punta Arenas', country: 'Chile', latitude: -53.1638, longitude: -70.9171 }
    ]
  },
  north_america: {
    key: 'north_america',
    name: 'América del Norte',
    startLat: 60.0,  // Anchorage/Canada
    endLat: 15.0,   // Southern Mexico
    centerLng: -95.0,
    defaultZoom: 4,
    cities: [
      { name: 'Anchorage', country: 'EE.UU.', latitude: 61.2181, longitude: -149.9003 },
      { name: 'Vancouver', country: 'Canadá', latitude: 49.2827, longitude: -123.1207 },
      { name: 'Winnipeg', country: 'Canadá', latitude: 49.8951, longitude: -97.1384 },
      { name: 'Montreal', country: 'Canadá', latitude: 45.5017, longitude: -73.5673 },
      { name: 'Seattle', country: 'EE.UU.', latitude: 47.6062, longitude: -122.3321 },
      { name: 'New York', country: 'EE.UU.', latitude: 40.7128, longitude: -74.0060 },
      { name: 'Chicago', country: 'EE.UU.', latitude: 41.8781, longitude: -87.6298 },
      { name: 'Denver', country: 'EE.UU.', latitude: 39.7392, longitude: -104.9903 },
      { name: 'Los Angeles', country: 'EE.UU.', latitude: 34.0522, longitude: -118.2437 },
      { name: 'Miami', country: 'EE.UU.', latitude: 25.7617, longitude: -80.1918 },
      { name: 'La Habana', country: 'Cuba', latitude: 23.1136, longitude: -82.3666 },
      { name: 'Ciudad de México', country: 'México', latitude: 19.4326, longitude: -99.1332 }
    ]
  },
  europe: {
    key: 'europe',
    name: 'Europa',
    startLat: 65.0,  // Scandinavia
    endLat: 36.0,   // Spain/Greece
    centerLng: 10.0,
    defaultZoom: 4,
    cities: [
      { name: 'Oslo', country: 'Noruega', latitude: 59.9139, longitude: 10.7522 },
      { name: 'Estocolmo', country: 'Suecia', latitude: 59.3293, longitude: 18.0686 },
      { name: 'Helsinki', country: 'Finlandia', latitude: 60.1699, longitude: 24.9384 },
      { name: 'Londres', country: 'Reino Unido', latitude: 51.5074, longitude: -0.1278 },
      { name: 'Berlín', country: 'Alemania', latitude: 52.5200, longitude: 13.4050 },
      { name: 'Varsovia', country: 'Polonia', latitude: 52.2297, longitude: 21.0122 },
      { name: 'Kiev', country: 'Ucrania', latitude: 50.4501, longitude: 30.5234 },
      { name: 'París', country: 'Francia', latitude: 48.8566, longitude: 2.3522 },
      { name: 'Viena', country: 'Austria', latitude: 48.2082, longitude: 16.3738 },
      { name: 'Roma', country: 'Italia', latitude: 41.9028, longitude: 12.4964 },
      { name: 'Madrid', country: 'España', latitude: 40.4168, longitude: -3.7038 },
      { name: 'Atenas', country: 'Grecia', latitude: 37.9838, longitude: 23.7275 },
      { name: 'Lisboa', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 }
    ]
  },
  asia: {
    key: 'asia',
    name: 'Asia',
    startLat: 55.0,  // Siberia/Russia
    endLat: 1.0,    // Singapore/Indonesia
    centerLng: 105.0,
    defaultZoom: 4,
    cities: [
      { name: 'Novosibirsk', country: 'Rusia', latitude: 55.0084, longitude: 82.9357 },
      { name: 'Ulán Bator', country: 'Mongolia', latitude: 47.8864, longitude: 106.9057 },
      { name: 'Pekín', country: 'China', latitude: 39.9042, longitude: 116.4074 },
      { name: 'Seúl', country: 'Corea del Sur', latitude: 37.5665, longitude: 126.9780 },
      { name: 'Tokio', country: 'Japón', latitude: 35.6762, longitude: 139.6503 },
      { name: 'Nueva Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
      { name: 'Bangkok', country: 'Tailandia', latitude: 13.7563, longitude: 100.5018 },
      { name: 'Manila', country: 'Filipinas', latitude: 14.5995, longitude: 120.9842 },
      { name: 'Kuala Lumpur', country: 'Malasia', latitude: 3.1390, longitude: 101.6869 },
      { name: 'Singapur', country: 'Singapur', latitude: 1.3521, longitude: 103.8198 }
    ]
  },
  africa: {
    key: 'africa',
    name: 'África',
    startLat: 35.0,  // Cairo/Morocco
    endLat: -34.0,  // Cape Town
    centerLng: 20.0,
    defaultZoom: 4,
    cities: [
      { name: 'El Cairo', country: 'Egipto', latitude: 30.0444, longitude: 31.2357 },
      { name: 'Argel', country: 'Argelia', latitude: 36.7525, longitude: 3.0420 },
      { name: 'Dakar', country: 'Senegal', latitude: 14.7167, longitude: -17.4677 },
      { name: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 },
      { name: 'Nairobi', country: 'Kenia', latitude: -1.2921, longitude: 36.8219 },
      { name: 'Luanda', country: 'Angola', latitude: -8.8390, longitude: 13.2894 },
      { name: 'Antananarivo', country: 'Madagascar', latitude: -18.8792, longitude: 47.5079 },
      { name: 'Johannesburgo', country: 'Sudáfrica', latitude: -26.2041, longitude: 28.0473 },
      { name: 'Ciudad del Cabo', country: 'Sudáfrica', latitude: -33.9249, longitude: 18.4241 }
    ]
  },
  oceania: {
    key: 'oceania',
    name: 'Oceanía',
    startLat: -10.0,  // Darwin/PNG
    endLat: -43.0,   // Tasmania/NZ
    centerLng: 145.0,
    defaultZoom: 4,
    cities: [
      { name: 'Port Moresby', country: 'PNG', latitude: -9.4438, longitude: 147.1803 },
      { name: 'Darwin', country: 'Australia', latitude: -12.4634, longitude: 130.8456 },
      { name: 'Cairns', country: 'Australia', latitude: -16.9186, longitude: 145.7781 },
      { name: 'Brisbane', country: 'Australia', latitude: -27.4705, longitude: 153.0260 },
      { name: 'Perth', country: 'Australia', latitude: -31.9505, longitude: 115.8605 },
      { name: 'Sídney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
      { name: 'Adelaida', country: 'Australia', latitude: -34.9285, longitude: 138.6007 },
      { name: 'Melbourne', country: 'Australia', latitude: -37.8136, longitude: 144.9631 },
      { name: 'Auckland', country: 'N. Zelanda', latitude: -36.8485, longitude: 174.7633 },
      { name: 'Wellington', country: 'N. Zelanda', latitude: -41.2865, longitude: 174.7762 },
      { name: 'Hobart', country: 'Australia', latitude: -42.8821, longitude: 147.3272 }
    ]
  }
};

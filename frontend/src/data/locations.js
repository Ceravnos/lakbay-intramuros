// Intramuros Locations Database with Categories
// Used for the Smart Generate feature and map markers

const path = 'assets/locations/'; //global variable for path to the images
const iconPath = 'assets/poi-icons/'
//Note: use backticks(``) instead of apostraphes

export const LOCATION_CATEGORIES = {
  all: {
    id: 'all',
    name: 'All Locations',
    icon: 'MapPin',
    markerIcon: null,
  },
  churches: {
    id: 'churches',
    name: 'Churches',
    icon: `${iconPath}church.svg`,
    markerIcon: `${iconPath}church.svg`,
  },
  museums: {
    id: 'museums',
    name: 'Museums & Heritage',
    icon: `${iconPath}museum.svg`,
    markerIcon: `${iconPath}museum.svg`,
  },
  forts: {
    id: 'forts',
    name: 'Forts & Walls',
    icon: `${iconPath}fort.svg`,
    markerIcon: `${iconPath}fort.svg`,
  },
  parks: {
    id: 'parks',
    name: 'Parks & Plazas',
    icon: `${iconPath}park.svg`,
    markerIcon: `${iconPath}park.svg`,
  },
  food: {
    id: 'food',
    name: 'Food & Dining',
    icon: `${iconPath}food.svg`,
    markerIcon: `${iconPath}food.svg`,
  },
  shops: {
    id: 'shops',
    name: 'Shops',
    icon: `${iconPath}shop.svg`,
    markerIcon: `${iconPath}shop.svg`,
  },
};

export const INTRAMUROS_LOCATIONS = [
    // Churches
    {
        id: 'manila-cathedral',
        placeId: 'manila-cathedral',
        name: 'The Manila Cathedral',
        category: 'churches',
        lat: 14.591850866413575, 
        lng: 120.97350241889418,
        address: 'Cabildo St, Intramuros, Manila',
        description: 'The seat of the Roman Catholic Archdiocese of Manila. Rebuilt 8 times, it stands as a symbol of Filipino faith and resilience.',
        estimatedTime: 30,
        image: `${path}manila-cathedral.webp`,
    },
    {
        id: 'san-agustin',
        placeId: 'san-agustin',
        name: 'San Agustin Church',
        category: 'churches',
        lat: 14.589216938373614, 
        lng: 120.97517057800593,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'UNESCO World Heritage Site and the oldest stone church in the Philippines, built in 1607.',
        estimatedTime: 45,
        image: `${path}san-agustin.webp`,
    },
    {
        id: 'san-ignacio',
        placeId: 'san-ignacio',
        name: 'San Ignacio Church Ruins',
        category: 'churches',
        lat: 14.59004278185083, 
        lng: 120.97317023711489,
        address: 'Arzobispo St, Intramuros, Manila',
        description: 'Haunting ruins of a Jesuit church destroyed during WWII, now a peaceful memorial garden.',
        estimatedTime: 20,
        image: `${path}san-ignacio.jpg`,
    },
    {
        id: 'sto-domingo',
        placeId: 'sto-domingo',
        name: 'Former Sto. Domingo Church Site',
        category: 'churches',
        lat: 14.59331538217466, 
        lng: 120.97490943907111,
        address: 'Sto. Domingo St, Intramuros, Manila',
        description: 'Historical site of the original Santo Domingo Church, an important Dominican heritage landmark.',
        estimatedTime: 15,
        image: `${path}sto-domingo.jpg`,
    },

    // Museums & Heritage
    {
        id: 'casa-manila',
        placeId: 'casa-manila',
        name: 'Casa Manila',
        category: 'museums',
        lat: 14.589584550252109, 
        lng: 120.97506088458529,
        address: 'Plaza San Luis Complex, Gen. Luna St, Intramuros',
        description: 'A museum showcasing the lifestyle of the Filipino elite during the Spanish colonial period.',
        estimatedTime: 45,
        image: `${path}casa-manila.jpg`,
    },
    {
        id: 'san-agustin-museum',
        placeId: 'san-agustin-museum',
        name: 'San Agustin Museum',
        category: 'museums',
        lat: 14.58912543928914,
        lng: 120.97494462426151,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Houses religious artifacts, colonial furniture, and Chinese trade ceramics from the galleon era.',
        estimatedTime: 60,
        image: `${path}san-agustin-museum.jpg`,
    },
    {
        id: 'bahay-tsinoy',
        placeId: 'bahay-tsinoy',
        name: 'Bahay Tsinoy Museum',
        category: 'museums',
        lat: 14.591163156242269, 
        lng: 120.9752511014381,
        address: 'Anda St, Intramuros, Manila',
        description: 'Chronicles the history and contributions of Chinese Filipinos to Philippine society.',
        estimatedTime: 45,
        image: `${path}bahay-tsinoy.jpg`,
    },
    {
        id: 'luz-gallery',
        placeId: 'luz-gallery',
        name: 'Silahis Arts & Artifacts',
        category: 'museums',
        lat: 14.587617036956672, 
        lng: 120.97725965932604,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Gallery featuring Filipino tribal art, antiques, and traditional crafts.',
        estimatedTime: 30,
        image: `${path}silahis.jpg`,
    },
    {
        id: 'destileria',
        placeId: 'destileria',
        name: 'Destileria Limtuaco Museum',
        category: 'museums',
        lat: 14.592424351153873,
        lng: 120.9775395765206,
        address: 'San Juan de Letran, Intramuros, Manila',
        description: 'The oldest distillery in the Philippines, established in 1852.',
        estimatedTime: 30,
        image: `${path}destileria.jpg`,
    },

    // Forts & Walls
    {
        id: 'fort-santiago',
        placeId: 'fort-santiago',
        name: 'Fort Santiago',
        category: 'forts',
        lat: 14.594451721696787, 
        lng: 120.97055147075305,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Historic citadel built by Spanish conquistadors. Site of Jose Rizal\'s imprisonment before his execution.',
        estimatedTime: 90,
        image: `${path}fort-santiago.jpeg`,
    },
    {
        id: 'baluarte-san-diego',
        placeId: 'baluarte-san-diego',
        name: 'Baluarte de San Diego',
        category: 'forts',
        lat: 14.585577828160842, 
        lng: 120.9756203174083,
        address: 'Muralla St, Intramuros, Manila',
        description: 'Circular fort and garden, one of the oldest stone fortifications in the Philippines.',
        estimatedTime: 30,
        image: `${path}baluarte-san-diego.jpg`,
    },
    {
        id: 'puerta-real',
        placeId: 'puerta-real',
        name: 'Puerta Real Gardens',
        category: 'forts',
        lat: 14.58593586562221, 
        lng: 120.97740418239658,
        address: 'Muralla St, Intramuros, Manila',
        description: 'The "Royal Gate" - one of the original entrances to the walled city, now a peaceful garden.',
        estimatedTime: 20,
        image: `${path}puerta-real.jpg`,
    },
    {
        id: 'revellin',
        placeId: 'revellin',
        name: 'Revellin de Recoletos',
        category: 'forts',
        lat: 14.589502157775817, 
        lng: 120.97942604972766,
        address: 'Riverside, Intramuros, Manila',
        description: 'A repurposed fortification, now being used as headquarters for the Escuela Taller de Filipinas Foundation, Inc.',
        estimatedTime: 15,
        image: `${path}revellin.jpg`,
    },

    // Parks & Plazas
    {
        id: 'plaza-roma',
        placeId: 'plaza-roma',
        name: 'Plaza Roma',
        category: 'parks',
        lat: 14.5912,
        lng: 120.9728,
        address: 'Intramuros, Manila',
        description: 'Historic plaza in front of Manila Cathedral, featuring a monument to King Carlos IV.',
        estimatedTime: 15,
        image: `${path}plaza-roma.jpg`,
    },
    {
        id: 'plaza-san-luis',
        placeId: 'plaza-san-luis',
        name: 'Plaza San Luis Complex',
        category: 'parks',
        lat: 14.592198681757962, 
        lng: 120.97329868288726,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Reconstructed Spanish colonial houses surrounding a charming cobblestone plaza.',
        estimatedTime: 30,
        image: `${path}plaza-san-luis.jpg`,
    },
    {
        id: 'puerta-isabel',
        placeId: 'puerta-isabel',
        name: 'Puerta de Isabel II',
        category: 'parks',
        lat: 14.594040811127616, 
        lng: 120.97626372414933,
        address: 'Muralla St, Intramuros, Manila',
        description: 'Named after Queen Isabel II, this gate offers scenic views of the Pasig River.',
        estimatedTime: 15,
        image: `${path}puerta-isabel.jpg`,
    },
    {
        id: 'plaza-moriones',
        placeId: 'plaza-moriones',
        name: 'Plaza Moriones',
        category: 'parks',
        lat: 14.593387576302353,
        lng: 120.97125023208014,
        address: 'Sta Clara St, Intramuros, Manila',
        description: 'Plaza with a lot of historical landmarks and ruins.',
        estimatedTime: 15,
        image: `${path}plaza-moriones.jpg`,
    },

    // Food & Dining
    {
        id: 'ilustrado',
        placeId: 'ilustrado',
        name: 'Ilustrado Restaurant',
        category: 'food',
        lat: 14.588115959838197, 
        lng: 120.97720512102664,
        address: 'Calle Real del Palacio, Intramuros, Manila',
        description: 'Fine dining in a restored Spanish colonial house, serving classic Filipino-Spanish cuisine.',
        estimatedTime: 60,
        image: `${path}ilustrado.jpg`,
    },
    {
        id: 'barbara',
        placeId: 'barbara',
        name: "Barbara's Heritage Restaurant",
        category: 'food',
        lat: 14.589652492298473,
        lng: 120.97520376689984,
        address: 'Plaza San Luis Complex, Intramuros, Manila',
        description: 'Cultural dining with traditional Filipino food and live folk performances.',
        estimatedTime: 90,
        image: `${path}barbara.jpg`,
    },
    {
        id: 'friedrich',
        placeId: 'friedrich',
        name: 'Walls Famous Friedrich Spicy Chicken',
        category: 'food',
        lat: 14.592003057143984, 
        lng: 120.97838377724723,
        address: 'Muralla St, Intramuros, Manila',
        description: 'Unique spicy chicken at very affordable price.',
        estimatedTime: 60,
        image: `${path}friedrich-chicken.jpg`, //need a better picture maybe
    },
    {
        id: 'pares-kimchi',
        placeId: 'pares-kimchi',
        name: 'Pares Kimchi - Intramuros',
        category: 'food',
        lat: 14.591994422241806,
        lng: 120.97455449683486,
        address: 'Beaterio St, Intramuros, Manila',
        description: 'Combining Filipino and Korean cuisine',
        estimatedTime: 60,
        image: `${path}pares-kimchi.jpg`,
    },
    {
        id: 'casa-nueva',
        placeId: 'casa-nueva',
        name: 'Casa Nueva Bistro Cafe & Restaurant',
        category: 'food',
        lat: 14.59014309697893, 
        lng: 120.97394045066379,
        address: 'Anda St cor Arzobispo Str, Intramuros, Manila',
        description: 'Cozy bistro-style cafe and restaurant, serving Spaning-Filipino dishes and specialty coffee.',
        estimatedTime: 60,
        image: `${path}casa-nueva.jpg`,
    },  
    {
        id: 'patio-de-conchita',
        placeId: 'patio-de-conchita',
        name: 'Patio de Conchita Restaurant',
        category: 'food',
        lat: 14.59179640931287,
        lng:  120.97439729469818,
        address: 'Beaterio St, Intramuros, Manila',
        description: 'Wide range of choices for Filipino seafood dishes.',
        estimatedTime: 60,
        image: `${path}patio-de-conchita.jpg`,
    },
    {
        id: 'batala-bar',
        placeId: 'batala-bar',
        name: 'Batala Bar / Philippine Artisan Trade',
        category: 'food',
        lat: 14.589569011320062, 
        lng:  120.97525574060707,
        address: 'Gen Luna St cor Real St, Intramuros, Manila',
        description: 'Ice cream, milkshakes, coffee, Filipino inspired dishes',
        estimatedTime: 60,
        image: `${path}batala-bar.jpg`,
    },
    {
        id: 'sky-deck',
        placeId: 'sky-deck',
        name: 'Sky Deck',
        category: 'food',
        lat: 14.590039716902659, 
        lng:  120.97881741338264, 
        address: 'Muralla St, Intramuros, Manila',
        description: 'Rooftop bar and restaurant at the Bayleaf Hotel',
        estimatedTime: 60,
        image: `${path}sky-deck.jpg`,
    },
    {
        id: 'la-cathedral',
        placeId: 'la-cathedral',
        name: 'La Cathedral Cafe',
        category: 'food',
        lat: 14.591363001332375, 
        lng:  120.97423856437429,
        address: 'Cabildo St, Intramuros, Manila',
        description: 'Cafe and restaurant behind the Manila Cathedral Church.',
        estimatedTime: 35,
        image: `${path}la-cathedral.jpg`,
    },

    //Shops
    {
        id: 'grotto-hookah',
        placeId: 'grotto-hookah',
        name: 'Grotto Hookah Lounge',
        category: 'shops',
        lat: 14.591728756087587,
        lng: 120.97416117801954,
        address: 'Cabildo St, Intramuros, Manila',
        description: 'Leading supplier of imported products from Russia.',
        estimatedTime: 60,
        image: `${path}grotto-hookah.jpg`,
    }, 
    {
        id: 'manila-canvas',
        placeId: 'manila-canvas',
        name: 'Manila Canvas - Fort Santiago',
        category: 'shops',
        lat: 14.592774366201786,
        lng: 120.97121748886062,
        address: 'Fort Santiago, Intramuros, Manila',
        description: 'Cafe and souvenir shop in one',
        estimatedTime: 30,
        image: `${path}manila-canvas.jpg`,
    }, 
    {
        id: 'tesoros',
        placeId: 'tesoros',
        name: 'Tesoros',
        category: 'shops',
        lat: 14.592654964730523, 
        lng: 120.97134623488817,
        address: 'Fort Santiago, Intramuros, Manila',
        description: 'Cafe and souvenir shop in one',
        estimatedTime: 30,
        image: `${path}tesoros.jpg`,
    }, 
];

// Utility function to shuffle array (Fisher-Yates algorithm)
export const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Smart Generate function - picks random locations based on category bias
export const generateSmartItinerary = (category = 'all', count = 5) => {
    let filteredLocations = INTRAMUROS_LOCATIONS;
    
    if (category !== 'all') {
        filteredLocations = INTRAMUROS_LOCATIONS.filter(loc => loc.category === category);
    }
    
    // Shuffle and pick the requested number
    const shuffled = shuffleArray(filteredLocations);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));
    
    // Add order to each location
    return selected.map((loc, index) => ({
        ...loc,
        order: index,
        notes: '',
    }));
};

// Get locations by category
export const getLocationsByCategory = (category) => {
    if (category === 'all') return INTRAMUROS_LOCATIONS;
    return INTRAMUROS_LOCATIONS.filter(loc => loc.category === category);
};

// Calculate estimated tour time
export const calculateTotalTime = (locations) => {
    const locationTime = locations.reduce((sum, loc) => sum + (loc.estimatedTime || 30), 0);
    const travelTime = Math.max(0, (locations.length - 1) * 10); // 10 min between stops
    return locationTime + travelTime;
};

export const getCategoryConfig = (categoryId) => {
  return LOCATION_CATEGORIES[categoryId] || LOCATION_CATEGORIES.all;
};

export default INTRAMUROS_LOCATIONS;

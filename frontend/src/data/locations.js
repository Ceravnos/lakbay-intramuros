// Intramuros Locations Database with Categories
// Used for the Smart Generate feature and map markers

export const LOCATION_CATEGORIES = [
    { id: 'all', name: 'All Locations', icon: 'MapPin' },
    { id: 'churches', name: 'Churches', icon: 'Church' },
    { id: 'museums', name: 'Museums & Heritage', icon: 'Landmark' },
    { id: 'forts', name: 'Forts & Walls', icon: 'Castle' },
    { id: 'parks', name: 'Parks & Plazas', icon: 'Trees' },
    { id: 'food', name: 'Food & Dining', icon: 'UtensilsCrossed' },
];

export const INTRAMUROS_LOCATIONS = [
    // Churches
    {
        id: 'manila-cathedral',
        placeId: 'manila-cathedral',
        name: 'Manila Cathedral',
        category: 'churches',
        lat: 14.5916,
        lng: 120.9734,
        address: 'Cabildo St, Intramuros, Manila',
        description: 'The seat of the Roman Catholic Archdiocese of Manila. Rebuilt 8 times, it stands as a symbol of Filipino faith and resilience.',
        estimatedTime: 30,
        image: '/images/manila-cathedral.jpg',
    },
    {
        id: 'san-agustin',
        placeId: 'san-agustin',
        name: 'San Agustin Church',
        category: 'churches',
        lat: 14.5878,
        lng: 120.9752,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'UNESCO World Heritage Site and the oldest stone church in the Philippines, built in 1607.',
        estimatedTime: 45,
        image: '/images/san-agustin.jpg',
    },
    {
        id: 'san-ignacio',
        placeId: 'san-ignacio',
        name: 'San Ignacio Church Ruins',
        category: 'churches',
        lat: 14.5905,
        lng: 120.9755,
        address: 'Arzobispo St, Intramuros, Manila',
        description: 'Haunting ruins of a Jesuit church destroyed during WWII, now a peaceful memorial garden.',
        estimatedTime: 20,
        image: '/images/san-ignacio.jpg',
    },
    {
        id: 'sto-domingo',
        placeId: 'sto-domingo',
        name: 'Sto. Domingo Church Site',
        category: 'churches',
        lat: 14.5935,
        lng: 120.9718,
        address: 'Sto. Domingo St, Intramuros, Manila',
        description: 'Historical site of the original Santo Domingo Church, an important Dominican heritage landmark.',
        estimatedTime: 15,
        image: '/images/sto-domingo.jpg',
    },

    // Museums & Heritage
    {
        id: 'casa-manila',
        placeId: 'casa-manila',
        name: 'Casa Manila',
        category: 'museums',
        lat: 14.5883,
        lng: 120.9747,
        address: 'Plaza San Luis Complex, Gen. Luna St, Intramuros',
        description: 'A museum showcasing the lifestyle of the Filipino elite during the Spanish colonial period.',
        estimatedTime: 45,
        image: '/images/casa-manila.jpg',
    },
    {
        id: 'san-agustin-museum',
        placeId: 'san-agustin-museum',
        name: 'San Agustin Museum',
        category: 'museums',
        lat: 14.5876,
        lng: 120.9755,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Houses religious artifacts, colonial furniture, and Chinese trade ceramics from the galleon era.',
        estimatedTime: 60,
        image: '/images/san-agustin-museum.jpg',
    },
    {
        id: 'bahay-tsinoy',
        placeId: 'bahay-tsinoy',
        name: 'Bahay Tsinoy Museum',
        category: 'museums',
        lat: 14.5898,
        lng: 120.9762,
        address: 'Anda St, Intramuros, Manila',
        description: 'Chronicles the history and contributions of Chinese Filipinos to Philippine society.',
        estimatedTime: 45,
        image: '/images/bahay-tsinoy.jpg',
    },
    {
        id: 'luz-gallery',
        placeId: 'luz-gallery',
        name: 'Silahis Arts & Artifacts',
        category: 'museums',
        lat: 14.5890,
        lng: 120.9740,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Gallery featuring Filipino tribal art, antiques, and traditional crafts.',
        estimatedTime: 30,
        image: '/images/silahis.jpg',
    },

    // Forts & Walls
    {
        id: 'fort-santiago',
        placeId: 'fort-santiago',
        name: 'Fort Santiago',
        category: 'forts',
        lat: 14.5953,
        lng: 120.9706,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Historic citadel built by Spanish conquistadors. Site of Jose Rizal\'s imprisonment before his execution.',
        estimatedTime: 90,
        image: '/images/fort-santiago.jpg',
    },
    {
        id: 'baluarte-san-diego',
        placeId: 'baluarte-san-diego',
        name: 'Baluarte de San Diego',
        category: 'forts',
        lat: 14.5833,
        lng: 120.9739,
        address: 'Muralla St, Intramuros, Manila',
        description: 'Circular fort and garden, one of the oldest stone fortifications in the Philippines.',
        estimatedTime: 30,
        image: '/images/baluarte-san-diego.jpg',
    },
    {
        id: 'puerta-real',
        placeId: 'puerta-real',
        name: 'Puerta Real Gardens',
        category: 'forts',
        lat: 14.5865,
        lng: 120.9780,
        address: 'Muralla St, Intramuros, Manila',
        description: 'The "Royal Gate" - one of the original entrances to the walled city, now a peaceful garden.',
        estimatedTime: 20,
        image: '/images/puerta-real.jpg',
    },
    {
        id: 'revellin',
        placeId: 'revellin',
        name: 'Revellin de Recoletos',
        category: 'forts',
        lat: 14.5920,
        lng: 120.9695,
        address: 'Riverside, Intramuros, Manila',
        description: 'A triangular fortification along the Pasig River, part of the original defensive walls.',
        estimatedTime: 15,
        image: '/images/revellin.jpg',
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
        image: '/images/plaza-roma.jpg',
    },
    {
        id: 'plaza-san-luis',
        placeId: 'plaza-san-luis',
        name: 'Plaza San Luis Complex',
        category: 'parks',
        lat: 14.5880,
        lng: 120.9745,
        address: 'Gen. Luna St, Intramuros, Manila',
        description: 'Reconstructed Spanish colonial houses surrounding a charming cobblestone plaza.',
        estimatedTime: 30,
        image: '/images/plaza-san-luis.jpg',
    },
    {
        id: 'puerta-isabel',
        placeId: 'puerta-isabel',
        name: 'Puerta de Isabel II',
        category: 'parks',
        lat: 14.5895,
        lng: 120.9698,
        address: 'Muralla St, Intramuros, Manila',
        description: 'Named after Queen Isabel II, this gate offers scenic views of the Pasig River.',
        estimatedTime: 15,
        image: '/images/puerta-isabel.jpg',
    },

    // Food & Dining
    {
        id: 'ilustrado',
        placeId: 'ilustrado',
        name: 'Ilustrado Restaurant',
        category: 'food',
        lat: 14.5888,
        lng: 120.9750,
        address: 'Calle Real del Palacio, Intramuros, Manila',
        description: 'Fine dining in a restored Spanish colonial house, serving classic Filipino-Spanish cuisine.',
        estimatedTime: 60,
        image: '/images/ilustrado.jpg',
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
        image: '/images/barbaras.jpg',
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
        image: '/images/friedrich-chicken.jpg',
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
        image: '/images/pares-kimchi.jpg',
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
        image: '/images/casa-nueva.jpg',
    },  
    
    //Emergency Services
    {
        id: 'amosup',
        placeId: 'amosup',
        name: "AMOSUP Seamen's Hospital Manila",
        category: 'emergency',
        lat: 14.58750899353152, 
        lng: 120.97762562820692,
        address: 'San Jose St, Intramuros, Manila',
        description: 'The first union-operated hospital in the country.',
        estimatedTime: 30,
        image: '/images/amosup.jpg',
    },
    {
        id: 'fire-station',
        placeId: 'fire-station',
        name: "Intramuros Fire Station",
        category: 'emergency',
        lat: 14.58750899353152, 
        lng: 120.97762562820692,
        address: 'Soriano Ave, Intramuros, Manila',
        description: "Intramuros primary fire station.",
        estimatedTime: 15,
        image: '/images/fire-station.jpg',
    },
    {
        id: 'station-5',
        placeId: 'station-5',
        name: "Manila Police District - Station 5",
        category: 'emergency',
        lat: 14.587256005549989, 
        lng: 120.97881885796599 ,
        address: 'Soriano Ave, Intramuros, Manila',
        description: "Intramuros primary fire station.",
        estimatedTime: 15,
        image: '/images/station-5.jpg',
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

export default INTRAMUROS_LOCATIONS;

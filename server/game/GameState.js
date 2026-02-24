const citiesData = require('../../shared/cities.json');
const constants = require('../../shared/constants.json');

class GameState {
    constructor() {
        this.cities = {}; // State of each city (disease cubes)
        this.players = {}; // Map<socketId, Player>
        this.outbreakCounter = 0;
        this.infectionRateIndex = 0;
        this.infectionRateTrack = constants.INFECTION_RATE_TRACK;
        this.researchStations = new Set();
        this.cures = {
            blue: false,
            yellow: false,
            black: false,
            red: false
        };
        
        // Decks
        this.playerDeck = [];
        this.infectionDeck = [];
        this.playerDiscardPile = [];
        this.infectionDiscardPile = [];

        this.initializeGame();
    }

    initializeGame() {
        // Initialize Cities
        Object.keys(citiesData).forEach(cityName => {
            this.cities[cityName] = {
                cubes: { blue: 0, yellow: 0, black: 0, red: 0 },
            };
        });

        // Initialize Research Stations (Start at Atlanta)
        this.researchStations.add("Atlanta");

        // Initialize Decks
        this.initializeDecks();

        // Reset Counters
        this.outbreakCounter = 0;
        this.infectionRateIndex = 0;
    }

    initializeDecks() {
        // Create Infection Deck (1 card per city)
        this.infectionDeck = Object.keys(citiesData);
        this.shuffle(this.infectionDeck);

        // Create Player Deck (City cards for now, add Events later)
        this.playerDeck = Object.keys(citiesData).map(city => ({
            type: 'city',
            name: city,
            color: citiesData[city].color
        }));
        this.shuffle(this.playerDeck);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    addPlayer(socketId) {
        this.players[socketId] = {
            id: socketId,
            role: null, // Assign later
            location: "Atlanta",
            hand: []
        };
        // Deal 2 initial cards for testing
        this.drawCards(socketId, 2);
    }

    drawCards(socketId, count) {
        const player = this.players[socketId];
        for (let i = 0; i < count; i++) {
            if (this.playerDeck.length > 0) {
                player.hand.push(this.playerDeck.pop());
            }
        }
    }

    removePlayer(socketId) {
        delete this.players[socketId];
    }

    movePlayer(socketId, action) {
        // action: { type: 'drive'|'direct'|'charter'|'shuttle', target: string }
        const player = this.players[socketId];
        if (!player) return { success: false, message: "Player not found" };

        const currentCity = player.location;
        const targetCity = action.target;

        if (!citiesData[targetCity]) return { success: false, message: "Invalid city" };

        if (action.type === 'drive') {
            // Check adjacency
            if (citiesData[currentCity].neighbors.includes(targetCity)) {
                player.location = targetCity;
                return { success: true };
            }
            return { success: false, message: "Not adjacent" };
        } 
        else if (action.type === 'shuttle') {
            // Check research stations
            if (this.researchStations.has(currentCity) && this.researchStations.has(targetCity)) {
                player.location = targetCity;
                return { success: true };
            }
             return { success: false, message: "Both cities must have research stations" };
        } 
        else if (action.type === 'direct') {
            // Discard card of target city
            const cardIndex = player.hand.findIndex(c => c.name === targetCity);
            if (cardIndex !== -1) {
                const card = player.hand.splice(cardIndex, 1)[0];
                this.playerDiscardPile.push(card);
                player.location = targetCity;
                return { success: true };
            }
             return { success: false, message: `Missing card for ${targetCity}` };
        } 
        else if (action.type === 'charter') {
            // Discard card of current city
            const cardIndex = player.hand.findIndex(c => c.name === currentCity);
            if (cardIndex !== -1) {
                const card = player.hand.splice(cardIndex, 1)[0];
                this.playerDiscardPile.push(card);
                player.location = targetCity;
                return { success: true };
            }
             return { success: false, message: `Missing card for ${currentCity}` };
        }
        
        return { success: false, message: "Unknown action" };
    }

    getState() {
        return {
            cities: this.cities,
            players: this.players,
            outbreakCounter: this.outbreakCounter,
            infectionRateIndex: this.infectionRateIndex,
            researchStations: Array.from(this.researchStations),
            cures: this.cures,
            // Don't send full decks to client to prevent cheating, but send counts
            playerDeckSize: this.playerDeck.length,
            infectionDeckSize: this.infectionDeck.length,
            infectionDiscardPile: this.infectionDiscardPile, // Visible
            playerDiscardPile: this.playerDiscardPile // Visible
        };
    }
}

module.exports = GameState;

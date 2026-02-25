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

        // Initial Infection
        this.initialInfection();
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
        // TODO: Add Epidemic cards after dealing initial hands (Day 6)
        this.shuffle(this.playerDeck);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    initialInfection() {
        // 3 cards with 3 cubes
        for (let i = 0; i < 3; i++) {
            const card = this.drawInfectionCard();
            if (card) this.infectCity(card, citiesData[card].color, 3);
        }
        // 3 cards with 2 cubes
        for (let i = 0; i < 3; i++) {
            const card = this.drawInfectionCard();
            if (card) this.infectCity(card, citiesData[card].color, 2);
        }
        // 3 cards with 1 cube
        for (let i = 0; i < 3; i++) {
            const card = this.drawInfectionCard();
            if (card) this.infectCity(card, citiesData[card].color, 1);
        }
    }

    drawInfectionCard() {
        if (this.infectionDeck.length === 0) return null;
        const card = this.infectionDeck.pop();
        this.infectionDiscardPile.push(card);
        return card;
    }

    infectCity(cityName, color, count = 1, outbrokenCities = new Set()) {
        if (!this.cities[cityName]) return;
        if (outbrokenCities.has(cityName)) return;

        const cityState = this.cities[cityName];
        
        if (cityState.cubes[color] + count > 3) {
            cityState.cubes[color] = 3; 
            this.handleOutbreak(cityName, color, outbrokenCities);
        } else {
            cityState.cubes[color] += count;
        }
    }

    handleOutbreak(cityName, color, outbrokenCities) {
        if (outbrokenCities.has(cityName)) return;
        outbrokenCities.add(cityName);
        
        this.outbreakCounter++;
        
        const neighbors = citiesData[cityName].neighbors;
        neighbors.forEach(neighbor => {
            this.infectCity(neighbor, color, 1, outbrokenCities);
        });
    }

    handleInfectionPhase() {
        const infectionRate = this.infectionRateTrack[this.infectionRateIndex];
        const drawnCards = [];
        for (let i = 0; i < infectionRate; i++) {
            const card = this.drawInfectionCard();
            if (card) {
                 drawnCards.push(card);
                 this.infectCity(card, citiesData[card].color, 1, new Set());
            }
        }
        return drawnCards;
    }

    resolveEpidemic() {
        // 1. Increase
        this.infectionRateIndex++;
        if (this.infectionRateIndex >= this.infectionRateTrack.length) {
            this.infectionRateIndex = this.infectionRateTrack.length - 1;
        }

        // 2. Infect
        if (this.infectionDeck.length > 0) {
            // Draw from bottom (start of array)
            const card = this.infectionDeck.shift(); 
            this.infectCity(card, citiesData[card].color, 3, new Set());
            this.infectionDiscardPile.push(card);
        }

        // 3. Intensify
        this.shuffle(this.infectionDiscardPile);
        this.infectionDeck.push(...this.infectionDiscardPile);
        this.infectionDiscardPile = [];
    }

    addPlayer(socketId) {
        this.players[socketId] = {
            id: socketId,
            role: null, // Assign later
            location: "Atlanta",
            hand: []
        };
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
        const player = this.players[socketId];
        if (!player) return { success: false, message: "Player not found" };

        const currentCity = player.location;
        const targetCity = action.target;

        if (!citiesData[targetCity]) return { success: false, message: "Invalid city" };

        if (action.type === 'drive') {
            if (citiesData[currentCity].neighbors.includes(targetCity)) {
                player.location = targetCity;
                return { success: true };
            }
            return { success: false, message: "Not adjacent" };
        } 
        else if (action.type === 'shuttle') {
            if (this.researchStations.has(currentCity) && this.researchStations.has(targetCity)) {
                player.location = targetCity;
                return { success: true };
            }
             return { success: false, message: "Both cities must have research stations" };
        } 
        else if (action.type === 'direct') {
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
            playerDeckSize: this.playerDeck.length,
            infectionDeckSize: this.infectionDeck.length,
            infectionDiscardPile: this.infectionDiscardPile,
            playerDiscardPile: this.playerDiscardPile
        };
    }
}

module.exports = GameState;

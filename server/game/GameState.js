const citiesData = require('../../shared/cities.json');
const constants = require('../../shared/constants.json');

const EVENT_CARDS = [
    { type: 'event', name: 'Airlift', description: "Move any pawn to any city." },
    { type: 'event', name: 'Government Grant', description: "Add a research station to any city." },
    { type: 'event', name: 'Forecast', description: "Draw 6, rearrange, put back on top." },
    { type: 'event', name: 'One Quiet Night', description: "Skip the next Infect Cities step." },
    { type: 'event', name: 'Resilient Population', description: "Remove a card from the Infection Discard Pile from the game." }
];

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

        this.gameStarted = false;
        this.difficulty = 4; // Number of Epidemic cards
        this.oneQuietNightActive = false; // For the event card

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
        this.oneQuietNightActive = false;
    }

    initializeDecks() {
        // Create Infection Deck (1 card per city)
        this.infectionDeck = Object.keys(citiesData);
        this.shuffle(this.infectionDeck);

        // Create Player Deck (City cards + Event cards)
        // Note: Epidemic cards are added in startGame()
        const cityCards = Object.keys(citiesData).map(city => ({
            type: 'city',
            name: city,
            color: citiesData[city].color
        }));
        
        this.playerDeck = [...cityCards, ...EVENT_CARDS];
        this.shuffle(this.playerDeck);
    }

    startGame() {
        if (this.gameStarted) return;
        
        // Initial Infection
        this.initialInfection();

        // Prepare Player Deck with Epidemic Cards
        this.prepareEpidemicDeck();

        this.gameStarted = true;
    }

    prepareEpidemicDeck() {
        // Divide player deck into `difficulty` piles
        const totalCards = this.playerDeck.length;
        const pileSize = Math.floor(totalCards / this.difficulty);
        const piles = [];

        // Create piles
        let currentDeckIndex = 0;
        for (let i = 0; i < this.difficulty; i++) {
            // Determine size of this pile (handle remainder in last pile)
            const size = (i === this.difficulty - 1) ? (totalCards - currentDeckIndex) : pileSize;
            const pile = this.playerDeck.slice(currentDeckIndex, currentDeckIndex + size);
            currentDeckIndex += size;
            
            // Add Epidemic Card
            pile.push({
                type: 'epidemic',
                name: 'Epidemic'
            });

            // Shuffle this pile
            this.shuffle(pile);
            piles.push(pile);
        }

        // Stack piles (last pile goes on bottom, so first pile is on top of array? 
        // Array.pop() takes from end, so end of array is "top" of deck.
        // We want the first pile (i=0) to be on top.
        // So we should push piles in reverse order or just concat correctly.
        // Let's say pile 0 is top. We want pile 0 at the end of the array.
        
        this.playerDeck = [];
        // Piles[0] is top, should be at end of array.
        // Piles[3] is bottom, should be at start of array.
        for (let i = this.difficulty - 1; i >= 0; i--) {
            this.playerDeck = this.playerDeck.concat(piles[i]);
        }
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

    resolveEpidemic() {
        // 1. Increase
        this.infectionRateIndex++;
        if (this.infectionRateIndex >= this.infectionRateTrack.length) {
            this.infectionRateIndex = this.infectionRateTrack.length - 1;
        }

        // 2. Infect
        if (this.infectionDeck.length > 0) {
            // Draw from bottom (start of array) - standard is bottom of deck
            // Here index 0 is bottom.
            const card = this.infectionDeck.shift(); 
            this.infectCity(card, citiesData[card].color, 3, new Set());
            this.infectionDiscardPile.push(card);
        }

        // 3. Intensify
        this.shuffle(this.infectionDiscardPile);
        // Put on top (end of array)
        this.infectionDeck.push(...this.infectionDiscardPile);
        this.infectionDiscardPile = [];
    }

    addPlayer(socketId) {
        this.players[socketId] = {
            id: socketId,
            role: null, 
            location: "Atlanta",
            hand: [],
            mustDiscard: false,
            hasDrawnCards: false
        };
        // Deal initial cards (simple: 2 cards)
        // If game started, this might include epidemics, but usually joining is pre-game.
        this.drawCards(socketId, 2);
    }

    drawCards(socketId, count) {
        const player = this.players[socketId];
        const drawn = [];
        for (let i = 0; i < count; i++) {
            if (this.playerDeck.length > 0) {
                const card = this.playerDeck.pop();
                
                if (card.type === 'epidemic') {
                    this.resolveEpidemic();
                    this.playerDiscardPile.push(card); // Epidemic goes to discard (or separate pile)
                    drawn.push(card); // Notify client
                } else {
                    player.hand.push(card);
                    drawn.push(card);
                }
            }
        }
        
        // Check Hand Limit
        if (player.hand.length > constants.HAND_LIMIT) {
            player.mustDiscard = true;
        }

        return drawn;
    }

    discardCard(socketId, cardName) {
        const player = this.players[socketId];
        if (!player) return { success: false, message: "Player not found" };

        const cardIndex = player.hand.findIndex(c => c.name === cardName);
        if (cardIndex === -1) return { success: false, message: "Card not in hand" };

        const card = player.hand.splice(cardIndex, 1)[0];
        this.playerDiscardPile.push(card);

        if (player.hand.length <= constants.HAND_LIMIT) {
            player.mustDiscard = false;
        }

        return { success: true };
    }

    removePlayer(socketId) {
        delete this.players[socketId];
    }

    movePlayer(socketId, action) {
        const player = this.players[socketId];
        if (!player) return { success: false, message: "Player not found" };
        if (player.mustDiscard) return { success: false, message: "Must discard cards first" };

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

    endTurn(socketId) {
        const player = this.players[socketId];
        if (!player) return { success: false, message: "Player not found" };

        if (player.mustDiscard) {
            return { success: false, message: "Must discard cards first" };
        }

        // 1. Draw 2 Player Cards (only if not already drawn)
        if (!player.hasDrawnCards) {
            this.drawCards(socketId, 2);
            player.hasDrawnCards = true;
        }

        // 2. Check Hand Limit
        if (player.mustDiscard) {
            // Stop here, client must handle discard
            return { success: true, message: "Hand limit reached. Discard cards." };
        }

        // 3. Infect Cities
        this.runInfectionStep();

        // Reset for next turn (resetting hasDrawnCards for THIS player, but turn actually passes to NEXT player?)
        // Currently turn logic is not fully implemented (no active player concept), so we just reset for this player.
        player.hasDrawnCards = false;
        
        return { success: true, message: "Turn ended." };
    }

    runInfectionStep() {
        if (!this.oneQuietNightActive) {
            const infectionRate = this.infectionRateTrack[this.infectionRateIndex];
            for (let i = 0; i < infectionRate; i++) {
                const card = this.drawInfectionCard();
                if (card) {
                    this.infectCity(card, citiesData[card].color, 1);
                }
            }
        } else {
            this.oneQuietNightActive = false;
        }
    }

    getState() {
        return {
            gameStarted: this.gameStarted,
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

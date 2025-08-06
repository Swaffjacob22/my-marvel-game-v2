import React, { useState, useEffect, useRef, useCallback } from 'react';

// Main App component
const App = () => {
    // Game state variables for Battle Phase
    const [player1HqHealth, setPlayer1HqHealth] = useState(1000);
    const [player2HqHealth, setPlayer2HqHealth] = useState(1000);
    const [currentPlayerBattle, setCurrentPlayerBattle] = useState(1); // 1 for Player 1, 2 for Player 2 in battle
    const [selectedCharacterBattle, setSelectedCharacterBattle] = useState(null); // Character selected for placement in battle
    const [roundCounter, setRoundCounter] = useState(1);
    const [player1Cooldowns, setPlayer1Cooldowns] = useState({}); // {character_name: round_available}
    const [player2Cooldowns, setPlayer2Cooldowns] = useState({}); // FIX: Corrected initialization to useState({})
    const [boardState, setBoardState] = useState(() => {
        const rows = 4;
        const cols = 3;
        // Initialize board with nulls, accommodating both players' sides
        return Array(rows).fill(null).map(() => Array(cols * 2).fill(null));
    });
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState('');
    const [highlightedCells, setHighlightedCells] = useState({ attacker: null, target: null });

    // New Game State for Selection Phase
    const [gamePhase, setGamePhase] = useState('selection'); // 'selection' or 'battle'
    const [player1Team, setPlayer1Team] = useState([]); // Array of selected characters for Player 1
    const [player2Team, setPlayer2Team] = useState([]); // Array of selected characters for Player 2
    const [currentPicker, setCurrentPicker] = useState(1); // 1 for Player 1, 2 for Player 2
    const [currentPickNumber, setCurrentPickNumber] = useState(1); // 1 to 12 (total picks)
    const [selectedCharacterForPick, setSelectedCharacterForPick] = useState(null); // Character temporarily selected for current pick
    const [activePhaseFilter, setActivePhaseFilter] = useState('All');
    const [activePowerSourceFilter, setActivePowerSourceFilter] = useState('All');

    // Constants for game dimensions and layout
    const boardRows = 4;
    const boardCols = 3; // Each player has 3 columns
    const maxHqHealth = 1000;
    const teamSize = 6; // Each player selects 6 characters

    // Character data with new tags
    const characters = [
        { name: 'Iron Man', health: 100, attack: 85, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/FFD700/000000?text=Iron+Man', phase: 1, powerSourceArchetype: 'Arsenal' },
        { name: 'Captain America', health: 120, attack: 75, type: 'Melee', imageUrl: 'https://placehold.co/100x100/0000FF/FFFFFF?text=Cap', phase: 1, powerSourceArchetype: 'Enhanced / Super Soldier' },
        { name: 'Thor', health: 150, attack: 95, type: 'Melee', imageUrl: 'https://placehold.co/100x100/ADD8E6/000000?text=Thor', phase: 1, powerSourceArchetype: 'Cosmic' },
        { name: 'Black Widow', health: 90, attack: 70, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/000000/FF0000?text=BW', phase: 1, powerSourceArchetype: 'Arsenal' },
        { name: 'Hawkeye', health: 80, attack: 90, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/800080/FFFFFF?text=Hawkeye', phase: 1, powerSourceArchetype: 'Arsenal' },
        { name: 'Hulk', health: 200, attack: 110, type: 'Melee', imageUrl: 'https://placehold.co/100x100/008000/FFFFFF?text=Hulk', phase: 1, powerSourceArchetype: 'Enhanced / Super Soldier' },
        { name: 'Loki', health: 90, attack: 85, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/A020F0/FFFFFF?text=Loki', phase: 1, powerSourceArchetype: 'Mystic / Magic' },
        { name: 'Scarlet Witch', health: 90, attack: 100, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/DC143C/FFFFFF?text=SW', phase: 2, powerSourceArchetype: 'Mystic / Magic' },
        { name: 'Vision', health: 140, attack: 90, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/FFD700/800080?text=Vision', phase: 2, powerSourceArchetype: 'Cosmic' },
        { name: 'Ant-Man', health: 100, attack: 70, type: 'Melee', imageUrl: 'https://placehold.co/100x100/87CEEB/000000?text=Ant-Man', phase: 2, powerSourceArchetype: 'Arsenal' },
        { name: 'Winter Soldier', health: 115, attack: 78, type: 'Melee', imageUrl: 'https://placehold.co/100x100/808080/FFFFFF?text=WS', phase: 2, powerSourceArchetype: 'Enhanced / Super Soldier' },
        { name: 'The Wasp', health: 90, attack: 75, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/FFFF00/000000?text=Wasp', phase: 2, powerSourceArchetype: 'Arsenal' },
        { name: 'The Falcon', health: 105, attack: 75, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/00FFFF/000000?text=Falcon', phase: 2, powerSourceArchetype: 'Arsenal' },
        { name: 'Star Lord', health: 95, attack: 80, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/FF8C00/FFFFFF?text=SL', phase: 2, powerSourceArchetype: 'Cosmic' },
        { name: 'Gamora', health: 110, attack: 85, type: 'Melee', imageUrl: 'https://placehold.co/100x100/008000/FFFFFF?text=Gamora', phase: 2, powerSourceArchetype: 'Cosmic' },
        { name: 'Nebula', health: 100, attack: 82, type: 'Melee', imageUrl: 'https://placehold.co/100x100/808080/000000?text=Nebula', phase: 2, powerSourceArchetype: 'Cosmic' },
        { name: 'Rocket', health: 70, attack: 95, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/A52A2A/FFFFFF?text=Rocket', phase: 2, powerSourceArchetype: 'Arsenal' },
        { name: 'Groot', health: 180, attack: 70, type: 'Melee', imageUrl: 'https://placehold.co/100x100/8B4513/FFFFFF?text=Groot', phase: 2, powerSourceArchetype: 'Cosmic' },
        { name: 'Drax', health: 140, attack: 90, type: 'Melee', imageUrl: 'https://placehold.co/100x100/4682B4/FFFFFF?text=Drax', phase: 2, powerSourceArchetype: 'Cosmic' },
        { name: 'Spider-Man', health: 95, attack: 80, type: 'Melee', imageUrl: 'https://placehold.co/100x100/FF0000/FFFFFF?text=Spidey', phase: 3, powerSourceArchetype: 'Enhanced / Super Soldier' },
        { name: 'Doctor Strange', health: 110, attack: 90, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/4B0082/FFFFFF?text=Dr+Strange', phase: 3, powerSourceArchetype: 'Mystic / Magic' },
        { name: 'Black Panther', health: 130, attack: 80, type: 'Melee', imageUrl: 'https://placehold.co/100x100/000000/800080?text=BP', phase: 3, powerSourceArchetype: 'Enhanced / Super Soldier' },
        { name: 'Captain Marvel', health: 160, attack: 105, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/FFD700/0000FF?text=CM', phase: 3, powerSourceArchetype: 'Cosmic' },
        { name: 'Moon Knight', health: 125, attack: 88, type: 'Melee', imageUrl: 'https://placehold.co/100x100/F5F5DC/000000?text=MK', phase: 4, powerSourceArchetype: 'Mystic / Magic' },
        { name: 'Deadpool', health: 110, attack: 92, type: 'Melee', imageUrl: 'https://placehold.co/100x100/8B0000/FFFFFF?text=DP', phase: 4, powerSourceArchetype: 'Enhanced / Super Soldier' },
        { name: 'Wolverine', health: 170, attack: 100, type: 'Melee', imageUrl: 'https://placehold.co/100x100/FFD700/000000?text=Wolverine', phase: 4, powerSourceArchetype: 'Enhanced / Super Soldier' },
    ];

    // Refs to hold the latest state values for use in callbacks (for battle phase)
    const isAttackingRef = useRef(false);
    const boardStateRef = useRef(boardState);
    const player1HqHealthRef = useRef(player1HqHealth);
    const player2HqHealthRef = useRef(player2HqHealth);

    // Update refs whenever their corresponding state changes (for battle phase)
    useEffect(() => {
        boardStateRef.current = boardState;
    }, [boardState]);

    useEffect(() => {
        player1HqHealthRef.current = player1HqHealth;
    }, [player1HqHealth]);

    useEffect(() => {
        player2HqHealthRef.current = player2HqHealth;
    }, [player2HqHealth]);

    // Function to display temporary messages
    const showMessage = useCallback((msg, duration = 2000) => {
        setMessage(msg);
        const timer = setTimeout(() => {
            setMessage('');
        }, duration);
        return () => clearTimeout(timer); // Cleanup function
    }, []);

    // Helper function to check if a character is already on the board (battle phase)
    const isCharacterOnBoard = useCallback((characterName) => {
        for (let r = 0; r < boardRows; r++) {
            for (let c = 0; c < boardCols * 2; c++) { // Check all columns for both players
                if (boardState[r][c]?.name === characterName) {
                    return true;
                }
            }
        }
        return false;
    }, [boardState, boardRows, boardCols]);

    // --- Selection Phase Logic ---

    // Filtered characters based on active filters
    const filteredCharacters = characters.filter(char => {
        const matchesPhase = activePhaseFilter === 'All' || char.phase === parseInt(activePhaseFilter);
        const matchesPowerSource = activePowerSourceFilter === 'All' || char.powerSourceArchetype === activePowerSourceArchetype;
        return matchesPhase && matchesPowerSource;
    });

    // Helper function to check if a character is already picked by the CURRENT team in the selection phase
    const isCharacterPickedByCurrentTeam = useCallback((charName) => {
        if (currentPicker === 1) {
            return player1Team.some(c => c.name === charName);
        } else {
            return player2Team.some(c => c.name === charName);
        }
    }, [currentPicker, player1Team, player2Team]);

    // Helper function to check if a character is already picked by the OPPONENT team in the selection phase
    const isCharacterPickedByOpponentTeam = useCallback((charName) => {
        if (currentPicker === 1) {
            return player2Team.some(c => c.name === charName);
        } else {
            return player1Team.some(c => c.name === charName);
        }
    }, [currentPicker, player1Team, player2Team]);

    // Handle character selection in the selection phase
    const handleCharacterSelectForPick = useCallback((character) => {
        if (isCharacterPickedByCurrentTeam(character.name)) { // Check only current team
            showMessage(`You already have ${character.name} on your team.`);
            setSelectedCharacterForPick(null); // Deselect if already on current team
        } else {
            setSelectedCharacterForPick(character);
            showMessage(`Selected ${character.name}. Click 'Confirm Pick' to add to your team.`);
        }
    }, [showMessage, isCharacterPickedByCurrentTeam]);

    // Handle confirming a pick in the selection phase
    const handleConfirmPick = useCallback(() => {
        if (!selectedCharacterForPick) {
            showMessage("Please select a character first!");
            return;
        }

        // Determine which player's team to update
        if (currentPicker === 1) {
            if (player1Team.length < teamSize) {
                setPlayer1Team(prev => [...prev, selectedCharacterForPick]);
            } else {
                showMessage("Player 1's team is already full!");
                return;
            }
        } else { // currentPicker === 2
            if (player2Team.length < teamSize) {
                setPlayer2Team(prev => [...prev, selectedCharacterForPick]);
            } else {
                showMessage("Player 2's team is already full!");
                return;
            }
        }

        // Clear temporary selection
        setSelectedCharacterForPick(null);

        // Advance pick counter
        setCurrentPickNumber(prev => prev + 1);

        // Switch picker if necessary
        if (currentPickNumber < teamSize * 2) { // Total 12 picks
            setCurrentPicker(prev => (prev === 1 ? 2 : 1));
        } else {
            // All characters picked, transition to battle phase
            showMessage("All teams assembled! Starting battle...", 3000);
            setTimeout(() => setGamePhase('battle'), 3000);
        }
    }, [selectedCharacterForPick, currentPicker, player1Team, player2Team, currentPickNumber, showMessage]);

    // Handle resetting the entire selection process
    const handleResetSelection = useCallback(() => {
        setPlayer1Team([]);
        setPlayer2Team([]);
        setCurrentPicker(1);
        setCurrentPickNumber(1);
        setSelectedCharacterForPick(null);
        setActivePhaseFilter('All');
        setActivePowerSourceFilter('All');
        showMessage("Character selection reset. Player 1's turn to pick.");
    }, [showMessage]);

    // --- Battle Phase Logic (Existing) ---

    // Function to perform attacks for Player 1
    const performAttacksP1 = useCallback(async () => {
        if (isAttackingRef.current) return;
        isAttackingRef.current = true; // Set flag to true at the beginning of attack phase
        let gameEndedDuringAttack = false;

        try {
            // Iterate over a copy of the current board state from the ref
            const currentBoard = JSON.parse(JSON.stringify(boardStateRef.current));
            let currentP2HqHealth = player2HqHealthRef.current;

            for (let row = 0; row < boardRows; row++) {
                if (gameEndedDuringAttack) break;
                for (let col = boardCols - 1; col >= 0; col--) {
                    if (gameEndedDuringAttack) break;

                    const attacker = currentBoard[row][col]; // Read from the local copy of the board
                    if (attacker) {
                        // Highlight attacker
                        setHighlightedCells({ attacker: { row, col }, target: null });
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for visual effect

                        let targetFound = false;
                        let targetPos = null;
                        // Check for targets in Player 2's corresponding row
                        for (let i = 0; i < boardCols; i++) {
                            const targetCol = boardCols + i;
                            const targetCharacter = currentBoard[row][targetCol]; // Read from local copy
                            if (targetCharacter) {
                                console.log(`-> Player 1's ${attacker.name} attacks Player 2's ${targetCharacter.name}!`);

                                // Update target character's health in the local copy
                                targetCharacter.health -= attacker.attack;
                                if (targetCharacter.health <= 0) {
                                    console.log(`-> Player 2's ${targetCharacter.name} has been defeated!`);
                                    currentBoard[row][targetCol] = null; // Remove defeated character from local copy
                                }
                                
                                // Update the actual board state in React
                                setBoardState(JSON.parse(JSON.stringify(currentBoard))); // Use a fresh copy to trigger render
                                await new Promise(resolve => setTimeout(resolve, 50)); // Force re-render of character health/removal

                                targetFound = true;
                                targetPos = { row, col: targetCol };
                                break; // Only attack the first character in the row
                            }
                        }

                        if (!targetFound) {
                            // If no character target, attack HQ
                            console.log(`-> Player 1's ${attacker.name} attacks Player 2's HQ!`);
                            currentP2HqHealth -= attacker.attack;
                            setPlayer2HqHealth(currentP2HqHealth);
                            await new Promise(resolve => setTimeout(resolve, 50)); // Force re-render of HQ health

                            targetPos = 'p2_hq';
                        }

                        // Highlight attacker and target
                        setHighlightedCells({ attacker: { row, col }, target: targetPos });
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for visual effect
                        
                        setHighlightedCells({ attacker: null, target: null }); // Clear highlights
                        await new Promise(resolve => setTimeout(resolve, 50)); // Ensure highlight clear is processed

                        // Check for game over after each attack
                        if (currentP2HqHealth <= 0) {
                            showMessage("Player 1 wins! Game Over!");
                            setGameOver(true);
                            gameEndedDuringAttack = true;
                            break; // Exit inner loop
                        }
                    }
                }
            }
        } finally {
            isAttackingRef.current = false; // Ensure flag is reset even if game ends early
            if (!gameEndedDuringAttack) { // Only switch player if game didn't end
                setCurrentPlayerBattle(2); // Switch turn to Player 2
                await new Promise(resolve => setTimeout(resolve, 750)); // Delay after turn switch
            }
        }
    }, [boardCols, boardRows, showMessage]);

    // Function to perform attacks for Player 2
    const performAttacksP2 = useCallback(async () => {
        if (isAttackingRef.current) return;
        isAttackingRef.current = true; // Set flag to true at the beginning of attack phase
        let gameEndedDuringAttack = false;

        try {
            // Iterate over a copy of the current board state from the ref
            const currentBoard = JSON.parse(JSON.stringify(boardStateRef.current));
            let currentP1HqHealth = player1HqHealthRef.current;

            for (let row = 0; row < boardRows; row++) {
                if (gameEndedDuringAttack) break;
                for (let col = 0; col < boardCols; col++) {
                    if (gameEndedDuringAttack) break;

                    const attacker = currentBoard[row][boardCols + col]; // Read from local copy
                    if (attacker) {
                        // Highlight attacker
                        setHighlightedCells({ attacker: { row, col: boardCols + col }, target: null });
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for visual effect

                        let targetFound = false;
                        let targetPos = null;
                        // Check for targets in Player 1's corresponding row (from right to left)
                        for (let i = boardCols - 1; i >= 0; i--) {
                            const targetCharacter = currentBoard[row][i]; // Read from local copy
                            if (targetCharacter) {
                                console.log(`-> Player 2's ${attacker.name} attacks Player 1's ${targetCharacter.name}!`);

                                // Update target character's health in the local copy
                                targetCharacter.health -= attacker.attack;
                                if (targetCharacter.health <= 0) {
                                    console.log(`-> Player 1's ${targetCharacter.name} has been defeated!`);
                                    currentBoard[row][i] = null; // Remove defeated character from local copy
                                }

                                // Update the actual board state in React
                                setBoardState(JSON.parse(JSON.stringify(currentBoard))); // Use a fresh copy to trigger render
                                await new Promise(resolve => setTimeout(resolve, 50)); // Force re-render of character health/removal

                                targetFound = true;
                                targetPos = { row, col: i };
                                break; // Only attack the first character in the row
                            }
                        }

                        if (!targetFound) {
                            // If no character target, attack HQ
                            console.log(`-> Player 2's ${attacker.name} attacks Player 1's HQ!`);
                            currentP1HqHealth -= attacker.attack;
                            setPlayer1HqHealth(currentP1HqHealth);
                            await new Promise(resolve => setTimeout(resolve, 50)); // Force re-render of HQ health

                            targetPos = 'p1_hq';
                        }

                        // Highlight attacker and target
                        setHighlightedCells({ attacker: { row, col: boardCols + col }, target: targetPos });
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for visual effect
                        
                        setHighlightedCells({ attacker: null, target: null }); // Clear highlights
                        await new Promise(resolve => setTimeout(resolve, 50)); // Ensure highlight clear is processed

                        // Check for game over after each attack
                        if (currentP1HqHealth <= 0) {
                            showMessage("Player 2 wins! Game Over!");
                            setGameOver(true);
                            gameEndedDuringAttack = true;
                            break; // Exit inner loop
                        }
                    }
                }
            }
        } finally {
            isAttackingRef.current = false; // Ensure flag is reset even if game ends early
            if (!gameEndedDuringAttack) { // Only switch player and increment round if game didn't end
                setCurrentPlayerBattle(1); // Switch turn back to Player 1
                setRoundCounter(prev => prev + 1); // Increment round after Player 2's turn completes
                await new Promise(resolve => setTimeout(resolve, 750)); // Delay after turn switch
            }
        }
    }, [boardCols, boardRows, showMessage]);

    // Handle character card selection or board placement (for battle phase)
    const handleCellClickBattle = useCallback(async (row, col, isCard = false) => {
        // Buttons are disabled if game is over or an attack is in progress
        if (gameOver || isAttackingRef.current) return; 

        if (isCard) {
            const character = characters[col]; // 'col' here is actually the index in the displayed cards
            if (!character) return; // Should not happen with correct index calculation

            let cooldowns = currentPlayerBattle === 1 ? player1Cooldowns : player2Cooldowns;
            if (cooldowns[character.name] && cooldowns[character.name] > roundCounter) {
                showMessage(`${character.name} is on cooldown. Ready in Round ${cooldowns[character.name]}.`);
                setSelectedCharacterBattle(null); // Deselect if on cooldown
            } else {
                setSelectedCharacterBattle(character);
                showMessage(`Selected ${character.name}. Now place it on the board.`);
            }
        } else { // Board placement
            const targetCol = currentPlayerBattle === 1 ? col : boardCols + col;
            if (selectedCharacterBattle && boardState[row][targetCol] === null) {
                // Place character
                setBoardState(prevBoardState => {
                    const updatedBoard = JSON.parse(JSON.stringify(prevBoardState));
                    updatedBoard[row][targetCol] = { ...selectedCharacterBattle }; // Place a copy
                    return updatedBoard;
                });
                // Crucial: Wait for the board state to update in React before proceeding with attacks
                await new Promise(resolve => setTimeout(resolve, 50)); // Give React time to render the new character

                setSelectedCharacterBattle(null); // Deselect character after placement

                // Add to cooldowns
                const newCooldowns = { ...(currentPlayerBattle === 1 ? player1Cooldowns : player2Cooldowns) };
                newCooldowns[selectedCharacterBattle.name] = roundCounter + 4; // Cooldown for 4 rounds
                if (currentPlayerBattle === 1) {
                    setPlayer1Cooldowns(newCooldowns);
                } else {
                    setPlayer2Cooldowns(newCooldowns);
                }

                showMessage(`${selectedCharacterBattle.name} placed!`);

                // Perform attacks after placement - AWAIT these calls
                if (currentPlayerBattle === 1) {
                    await performAttacksP1();
                } else {
                    await performAttacksP2();
                }
            } else if (selectedCharacterBattle) {
                showMessage("Cell is already occupied or no character selected.");
            } else {
                showMessage("Select a character first!");
            }
        }
    }, [gameOver, isAttackingRef, currentPlayerBattle, selectedCharacterBattle, boardState, boardCols, player1Cooldowns, player2Cooldowns, roundCounter, showMessage, performAttacksP1, performAttacksP2, characters]);

    // Reset game function (for battle phase)
    const resetGameBattle = () => {
        setPlayer1HqHealth(1000);
        setPlayer2HqHealth(1000);
        setCurrentPlayerBattle(1);
        setSelectedCharacterBattle(null);
        setRoundCounter(1);
        setPlayer1Cooldowns({});
        setPlayer2Cooldowns({});
        setBoardState(Array(boardRows).fill(null).map(() => Array(boardCols * 2).fill(null))); // Use boardCols * 2 for full board reset
        setGameOver(false);
        setMessage('');
        setHighlightedCells({ attacker: null, target: null });
        isAttackingRef.current = false;
        showMessage("Game reset! Player 1's turn.");
    };

    // --- Common Components ---

    // Component for rendering a single character card (used in both phases)
    const CharacterCard = ({ character, isSelected, onCooldown, onClick, isAlreadyOnCurrentTeam = false, isAlreadyOnOpponentTeam = false }) => {
        const [isHovered, setIsHovered] = useState(false); // State for hover effect

        if (!character) return <div className="character-card-empty">Empty</div>;

        // A card is selectable if it's not on cooldown AND not already on the current player's team
        const isSelectableForCurrentPlayer = !onCooldown && !isAlreadyOnCurrentTeam;

        // The visual dimming/overlay should apply only if it's on the current player's team and not on cooldown
        const isVisuallyDimmedAndPicked = isAlreadyOnCurrentTeam && !onCooldown;

        const cardClasses = `
            character-card
            ${isSelected ? 'selected' : ''}
            ${onCooldown ? 'on-cooldown' : ''}
            ${isVisuallyDimmedAndPicked ? 'already-picked-by-current-team' : ''}
            ${!isSelectableForCurrentPlayer ? 'cursor-not-allowed' : ''}
        `;

        return (
            <div
                className={cardClasses}
                onClick={isSelectableForCurrentPlayer ? onClick : null}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="card-name">{character.name}</div>
                <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="character-image-on-card"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/64x64/CCCCCC/000000?text=ERR`;
                    }}
                />
                
                {/* Hover Menu for Stats and Tags */}
                {isHovered && (
                    <div className="hover-menu">
                        <div className="hover-menu-name">{character.name}</div>
                        <div className="hover-menu-stats">
                            <div>HP: {character.health}</div>
                            <div>ATK: {character.attack}</div>
                        </div>
                        <div className="hover-menu-tags">
                            <span className="tag phase-tag">P{character.phase}</span>
                            <span className="tag type-tag">{character.powerSourceArchetype}</span>
                        </div>
                    </div>
                )}

                {onCooldown && (
                    <div className="cooldown-overlay">
                        Ready in R{onCooldown}
                    </div>
                )}
                {isVisuallyDimmedAndPicked && (
                    <div className="picked-overlay">
                        Picked
                    </div>
                )}
            </div>
        );
    };

    // Component for rendering the game board cell (only in battle phase)
    const BoardCell = ({ character, row, col, isAttacker, isTarget, onClick }) => {
        const cellClasses = `
            board-cell
            ${isAttacker ? 'attacker-highlight' : ''}
            ${isTarget ? 'target-highlight' : ''}
        `;

        return (
            <div className={cellClasses} onClick={onClick}>
                {character ? (
                    <>
                        <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="character-image-on-board"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://placehold.co/80x80/CCCCCC/000000?text=ERR`;
                            }}
                        />
                        <div className="character-stats-hp">HP: {character.health}</div>
                        <div className="character-stats-atk">ATK: {character.attack}</div>
                    </>
                ) : (
                    <span className="cell-plus-icon">+</span>
                )}
            </div>
        );
    };


    // --- Render Logic based on Game Phase ---
    if (gamePhase === 'selection') {
        const phaseFilters = ['All', 1, 2, 3, 4];
        const powerSourceFilters = ['All', 'Arsenal', 'Enhanced / Super Soldier', 'Mystic / Magic', 'Cosmic'];

        return (
            <div className="game-bg selection-phase-bg">
                <div className="game-container selection-container">
                    <h1 className="game-title">Assemble Your Team!</h1>

                    <div className="pick-status-bar">
                        <span className={`current-picker-text ${currentPicker === 1 ? 'player1' : 'player2'}`}>
                            Player {currentPicker}'s Pick: {Math.ceil(currentPickNumber / 2)} of {teamSize}
                        </span>
                    </div>

                    {/* Player Teams Display */}
                    <div className="player-teams-display">
                        <div className="player-team-section player1-team-display">
                            <h3>Player 1 Team</h3>
                            <div className="team-slots-container">
                                {Array(teamSize).fill(null).map((_, index) => (
                                    <CharacterCard
                                        key={`p1-team-slot-${index}`}
                                        character={player1Team[index]}
                                        // No hover stats needed for team display, just the character image
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="player-team-section player2-team-display">
                            <h3>Player 2 Team</h3>
                            <div className="team-slots-container">
                                {Array(teamSize).fill(null).map((_, index) => (
                                    <CharacterCard
                                        key={`p2-team-slot-${index}`}
                                        character={player2Team[index]}
                                        // No hover stats needed for team display, just the character image
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters-container">
                        <div className="filter-group">
                            <h4>Phase:</h4>
                            {phaseFilters.map(filter => (
                                <button
                                    key={`phase-filter-${filter}`}
                                    className={`filter-button ${activePhaseFilter === filter ? 'active' : ''}`}
                                    onClick={() => setActivePhaseFilter(filter)}
                                >
                                    {filter === 'All' ? 'All' : `Phase ${filter}`}
                                </button>
                            ))}
                        </div>
                        <div className="filter-group">
                            <h4>Power Source:</h4>
                            {powerSourceFilters.map(filter => (
                                <button
                                    key={`power-filter-${filter}`}
                                    className={`filter-button ${activePowerSourceFilter === filter ? 'active' : ''}`}
                                    onClick={() => setActivePowerSourceFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Available Characters Grid */}
                    <div className="available-characters-grid">
                        {filteredCharacters.map(char => (
                            <CharacterCard
                                key={char.name}
                                character={char}
                                isSelected={selectedCharacterForPick?.name === char.name}
                                onCooldown={false} // Cooldowns are for battle phase, not selection
                                isAlreadyOnCurrentTeam={isCharacterPickedByCurrentTeam(char.name)}
                                isAlreadyOnOpponentTeam={isCharacterPickedByOpponentTeam(char.name)}
                                onClick={() => handleCharacterSelectForPick(char)}
                            />
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="selection-action-buttons">
                        <button
                            className="confirm-pick-button"
                            onClick={handleConfirmPick}
                            disabled={!selectedCharacterForPick || currentPickNumber > teamSize * 2}
                        >
                            Confirm Pick ({currentPicker === 1 ? player1Team.length + 1 : player2Team.length + 1}/{teamSize})
                        </button>
                        <button
                            className="reset-selection-button"
                            onClick={handleResetSelection}
                        >
                            Reset Selection
                        </button>
                        <button
                            className="start-battle-button"
                            onClick={() => {
                                if (player1Team.length === teamSize && player2Team.length === teamSize) {
                                    showMessage("Teams are ready! Starting battle...", 3000);
                                    setTimeout(() => setGamePhase('battle'), 3000);
                                } else {
                                    showMessage(`Both teams must have ${teamSize} characters to start the battle!`);
                                }
                            }}
                            disabled={player1Team.length !== teamSize || player2Team.length !== teamSize}
                        >
                            Start Battle
                        </button>
                    </div>

                    {/* Message Box for Selection Phase */}
                    {message && (
                        <div className="message-box">
                            {message}
                        </div>
                    )}
                </div>
            </div>
        );
    } else { // gamePhase === 'battle'
        return (
            <div className="game-bg">
                <div className="game-container">
                    <h1 className="game-title">
                        Marvel Grid Battle
                    </h1>

                    <div className="game-info-bar">
                        <div>Round: <span className="round-counter-text">{roundCounter}</span></div>
                        <div>Current Player: <span className={`player-turn-text ${currentPlayerBattle === 1 ? 'player1' : 'player2'}`}>Player {currentPlayerBattle}</span></div>
                    </div>

                    <div className="main-game-area">
                        {/* Player 1 Section */}
                        <div className="player-section">
                            <h2 className="player-section-title player1">Player 1 (Avengers)</h2>
                            <div className="player-board-area">
                                {/* Player 1 HQ */}
                                <div className={`
                                    hq-container
                                    ${highlightedCells.target === 'p1_hq' ? 'target-highlight' : ''}
                                `}>
                                    <h3 className="hq-title">HQ</h3>
                                    <div className="hq-health-bar-bg">
                                        <div
                                            className="hq-health-bar-fill"
                                            style={{ width: `${(player1HqHealth / maxHqHealth) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="hq-health-text">{player1HqHealth}/{maxHqHealth}</div>
                                </div>

                                {/* Player 1 Board Grid */}
                                <div className="board-grid" style={{ gridTemplateColumns: `repeat(${boardCols}, minmax(0, 1fr))` }}>
                                    {Array(boardRows).fill(null).map((_, r) =>
                                        Array(boardCols).fill(null).map((_, c) => (
                                            <BoardCell
                                                key={`p1-${r}-${c}`}
                                                character={boardState[r][c]}
                                                row={r}
                                                col={c}
                                                isAttacker={highlightedCells.attacker?.row === r && highlightedCells.attacker?.col === c}
                                                isTarget={highlightedCells.target?.row === r && highlightedCells.target?.col === c}
                                                onClick={() => currentPlayerBattle === 1 && handleCellClickBattle(r, c)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                            {/* Player 1 Cards (Conditional Rendering) */}
                            {currentPlayerBattle === 1 && (
                                <div className="card-carousel">
                                    <div className="card-display-area">
                                        {player1Team.map((char, i) => { // Use player1Team here
                                            const onCooldown = player1Cooldowns[char?.name];
                                            return (
                                                <CharacterCard
                                                    key={`p1-card-${i}`}
                                                    character={char}
                                                    isSelected={selectedCharacterBattle?.name === char?.name}
                                                    onCooldown={onCooldown > roundCounter ? onCooldown : false}
                                                    onClick={() => handleCellClickBattle(null, characters.indexOf(char), true)} // Pass original index
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Player 2 Section */}
                        <div className="player-section">
                            <h2 className="player-section-title player2">Player 2 (Villains)</h2>
                            <div className="player-board-area">
                                {/* Player 2 Board Grid */}
                                <div className="board-grid" style={{ gridTemplateColumns: `repeat(${boardCols}, minmax(0, 1fr))` }}>
                                    {Array(boardRows).fill(null).map((_, r) =>
                                        Array(boardCols).fill(null).map((_, c) => (
                                            <BoardCell
                                                key={`p2-${r}-${c}`}
                                                character={boardState[r][boardCols + c]}
                                                row={r}
                                                col={c}
                                                isAttacker={highlightedCells.attacker?.row === r && highlightedCells.attacker?.col === boardCols + c}
                                                isTarget={highlightedCells.target?.row === r && highlightedCells.target?.col === boardCols + c}
                                                onClick={() => currentPlayerBattle === 2 && handleCellClickBattle(r, c)}
                                            />
                                        ))
                                    )}
                                </div>

                                {/* Player 2 HQ */}
                                <div className={`
                                    hq-container
                                    ${highlightedCells.target === 'p2_hq' ? 'target-highlight' : ''}
                                `}>
                                    <h3 className="hq-title">HQ</h3>
                                    <div className="hq-health-bar-bg">
                                        <div
                                            className="hq-health-bar-fill"
                                            style={{ width: `${(player2HqHealth / maxHqHealth) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="hq-health-text">{player2HqHealth}/{maxHqHealth}</div>
                                </div>
                            </div>
                            {/* Player 2 Cards (Conditional Rendering) */}
                            {currentPlayerBattle === 2 && (
                                <div className="card-carousel">
                                    <div className="card-display-area">
                                        {player2Team.map((char, i) => { // Use player2Team here
                                            const onCooldown = player2Cooldowns[char?.name];
                                            return (
                                                <CharacterCard
                                                    key={`p2-card-${i}`}
                                                    character={char}
                                                    isSelected={selectedCharacterBattle?.name === char?.name}
                                                    onCooldown={onCooldown > roundCounter ? onCooldown : false}
                                                    onClick={() => handleCellClickBattle(null, characters.indexOf(char), true)} // Pass original index
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Box */}
                    {message && (
                        <div className="message-box">
                            {message}
                        </div>
                    )}

                    {/* Game Over Overlay */}
                    {gameOver && (
                        <div className="game-over-overlay">
                            <h2 className="game-over-title">GAME OVER!</h2>
                            <button
                                className="play-again-button"
                                onClick={resetGameBattle}
                            >
                                Play Again
                            </button>
                        </div>
                    )}

                    {/* Reset Button (always visible) */}
                    <button
                        className="reset-game-button"
                        onClick={resetGameBattle}
                    >
                        Reset Game
                    </button>
                </div>
            </div>
        );
    }
};

export default App;

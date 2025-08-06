import React, { useState, useEffect, useRef, useCallback } from 'react';

// Main App component
const App = () => {
    // Game state variables
    const [player1HqHealth, setPlayer1HqHealth] = useState(1000);
    const [player2HqHealth, setPlayer2HqHealth] = useState(1000);
    const [currentPlayer, setCurrentPlayer] = useState(1); // 1 for Player 1, 2 for Player 2
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [roundCounter, setRoundCounter] = useState(1);
    const [player1Cooldowns, setPlayer1Cooldowns] = useState({}); // {character_name: round_available}
    const [player2Cooldowns, setPlayer2Cooldowns] = useState({});
    const [boardState, setBoardState] = useState(() => {
        const rows = 4;
        const cols = 3;
        // Initialize board with nulls, accommodating both players' sides
        return Array(rows).fill(null).map(() => Array(cols * 2).fill(null));
    });
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState('');
    const [highlightedCells, setHighlightedCells] = useState({ attacker: null, target: null });

    // Constants for game dimensions and layout
    const boardRows = 4;
    const boardCols = 3; // Each player has 3 columns
    const maxHqHealth = 1000;

    // Character data (using placeholder images from placehold.co)
    const characters = [
        { name: 'Iron Man', health: 100, attack: 85, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/FFD700/000000?text=Iron+Man' },
        { name: 'Captain America', health: 120, attack: 75, type: 'Melee', imageUrl: 'https://placehold.co/100x100/0000FF/FFFFFF?text=Cap' },
        { name: 'Thor', health: 150, attack: 95, type: 'Melee', imageUrl: 'https://placehold.co/100x100/ADD8E6/000000?text=Thor' },
        { name: 'Black Widow', health: 90, attack: 70, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/000000/FF0000?text=BW' },
        { name: 'Hawkeye', health: 80, attack: 90, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/800080/FFFFFF?text=Hawkeye' },
        { name: 'Hulk', health: 200, attack: 110, type: 'Melee', imageUrl: 'https://placehold.co/100x100/008000/FFFFFF?text=Hulk' },
        { name: 'Spider-Man', health: 95, attack: 80, type: 'Melee', imageUrl: 'https://placehold.co/100x100/FF0000/FFFFFF?text=Spidey' },
        { name: 'Doctor Strange', health: 110, attack: 90, type: 'Ranged', imageUrl: 'https://placehold.co/100x100/4B0082/FFFFFF?text=Dr+Strange' },
    ];

    const [player1CharIndex, setPlayer1CharIndex] = useState(0);
    const [player2CharIndex, setPlayer2CharIndex] = useState(0);
    const maxCharIndex = characters.length - 4; // Max index to show 4 cards at a time

    // Refs to hold the latest state values for use in callbacks
    const isAttackingRef = useRef(false);
    const boardStateRef = useRef(boardState);
    const player1HqHealthRef = useRef(player1HqHealth);
    const player2HqHealthRef = useRef(player2HqHealth);

    // Update refs whenever their corresponding state changes
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

    // Function to perform attacks for Player 1
    const performAttacksP1 = useCallback(async () => {
        if (isAttackingRef.current) return;
        isAttackingRef.current = true;

        let gameEndedDuringAttack = false; // Flag to stop further attacks if game ends

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

        if (!gameEndedDuringAttack) {
            setCurrentPlayer(2); // Switch turn to Player 2
            await new Promise(resolve => setTimeout(resolve, 750)); // Delay after turn switch
        }
        isAttackingRef.current = false;
    }, [boardCols, boardRows, showMessage]);

    // Function to perform attacks for Player 2
    const performAttacksP2 = useCallback(async () => {
        if (isAttackingRef.current) return;
        isAttackingRef.current = true;

        let gameEndedDuringAttack = false; // Flag to stop further attacks if game ends

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
                    // Check for targets in Player 1's corresponding row
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

        if (!gameEndedDuringAttack) {
            setCurrentPlayer(1); // Switch turn back to Player 1
            setRoundCounter(prev => prev + 1); // Increment round after Player 2's turn completes
            await new Promise(resolve => setTimeout(resolve, 750)); // Delay after turn switch
        }
        isAttackingRef.current = false;
    }, [boardCols, boardRows, showMessage]);

    // Handle character card selection or board placement
    const handleCellClick = useCallback(async (row, col, isCard = false) => {
        if (gameOver || isAttackingRef.current) return;

        if (isCard) {
            const character = characters[col]; // 'col' here is actually the index in the displayed cards
            if (!character) return; // Should not happen with correct index calculation

            let cooldowns = currentPlayer === 1 ? player1Cooldowns : player2Cooldowns;
            if (cooldowns[character.name] && cooldowns[character.name] > roundCounter) {
                showMessage(`${character.name} is on cooldown. Ready in Round ${cooldowns[character.name]}.`);
                setSelectedCharacter(null); // Deselect if on cooldown
            } else {
                setSelectedCharacter(character);
                showMessage(`Selected ${character.name}. Now place it on the board.`);
            }
        } else { // Board placement
            const targetCol = currentPlayer === 1 ? col : boardCols + col;
            if (selectedCharacter && boardState[row][targetCol] === null) {
                // Place character
                setBoardState(prevBoardState => {
                    const updatedBoard = JSON.parse(JSON.stringify(prevBoardState));
                    updatedBoard[row][targetCol] = { ...selectedCharacter }; // Place a copy
                    return updatedBoard;
                });
                // Crucial: Wait for the board state to update in React before proceeding with attacks
                await new Promise(resolve => setTimeout(resolve, 50)); // Give React time to render the new character

                setSelectedCharacter(null); // Deselect character after placement

                // Add to cooldowns
                const newCooldowns = { ...(currentPlayer === 1 ? player1Cooldowns : player2Cooldowns) };
                newCooldowns[selectedCharacter.name] = roundCounter + 4; // Cooldown for 4 rounds
                if (currentPlayer === 1) {
                    setPlayer1Cooldowns(newCooldowns);
                } else {
                    setPlayer2Cooldowns(newCooldowns);
                }

                showMessage(`${selectedCharacter.name} placed!`);

                // Perform attacks after placement - AWAIT these calls
                if (currentPlayer === 1) {
                    await performAttacksP1();
                } else {
                    await performAttacksP2();
                }
            } else if (selectedCharacter) {
                showMessage("Cell is already occupied or no character selected.");
            } else {
                showMessage("Select a character first!");
            }
        }
    }, [gameOver, isAttackingRef, currentPlayer, selectedCharacter, boardState, boardCols, player1Cooldowns, player2Cooldowns, roundCounter, showMessage, performAttacksP1, performAttacksP2, characters]);

    // Reset game function
    const resetGame = () => {
        setPlayer1HqHealth(1000);
        setPlayer2HqHealth(1000);
        setCurrentPlayer(1);
        setSelectedCharacter(null);
        setRoundCounter(1);
        setPlayer1Cooldowns({});
        setPlayer2Cooldowns({});
        setBoardState(Array(boardRows).fill(null).map(() => Array(boardCols * 2).fill(null)));
        setGameOver(false);
        setMessage('');
        setHighlightedCells({ attacker: null, target: null });
        setPlayer1CharIndex(0);
        setPlayer2CharIndex(0);
        isAttackingRef.current = false;
        showMessage("Game reset! Player 1's turn.");
    };

    // Component for rendering a single character card
    const CharacterCard = ({ character, isSelected, onCooldown, onClick }) => {
        if (!character) return <div className="character-card-empty">Empty</div>;

        const cardClasses = `
            character-card
            ${isSelected ? 'selected' : ''}
            ${onCooldown ? 'on-cooldown' : ''}
        `;

        return (
            <div className={cardClasses} onClick={onCooldown ? null : onClick}>
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
                <div className="card-stats-container">
                    <div className="card-stat-row"><span>HP:</span> <span>{character.health}</span></div>
                    <div className="card-stat-row"><span>ATK:</span> <span>{character.attack}</span></div>
                </div>
                {onCooldown && (
                    <div className="cooldown-overlay">
                        Ready in R{onCooldown}
                    </div>
                )}
            </div>
        );
    };

    // Component for rendering the game board cell
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

    // Render the main game UI
    return (
        <div className="game-bg">
            <div className="game-container">
                <h1 className="game-title">
                    Marvel Grid Battle
                </h1>

                <div className="game-info-bar">
                    <div>Round: <span className="round-counter-text">{roundCounter}</span></div>
                    <div>Current Player: <span className={`player-turn-text ${currentPlayer === 1 ? 'player1' : 'player2'}`}>Player {currentPlayer}</span></div>
                </div>

                {/* Main game area with explicit player sections */}
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
                                            onClick={() => currentPlayer === 1 && handleCellClick(r, c)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                        {/* Player 1 Cards (Conditional Rendering) */}
                        {currentPlayer === 1 && (
                            <div className="card-carousel">
                                <button
                                    className="carousel-button"
                                    onClick={() => setPlayer1CharIndex(prev => Math.max(0, prev - 1))}
                                    disabled={player1CharIndex === 0 || currentPlayer !== 1 || gameOver || isAttackingRef.current}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <div className="card-display-area">
                                    {Array(4).fill(null).map((_, i) => {
                                        const char = characters[player1CharIndex + i];
                                        const onCooldown = player1Cooldowns[char?.name];
                                        return (
                                            <CharacterCard
                                                key={`p1-card-${i}`}
                                                character={char}
                                                isSelected={selectedCharacter?.name === char?.name}
                                                onCooldown={onCooldown > roundCounter ? onCooldown : false}
                                                onClick={() => handleCellClick(null, player1CharIndex + i, true)}
                                            />
                                        );
                                    })}
                                </div>
                                <button
                                    className="carousel-button"
                                    onClick={() => setPlayer1CharIndex(prev => Math.min(maxCharIndex, prev + 1))}
                                    disabled={player1CharIndex >= maxCharIndex || currentPlayer !== 1 || gameOver || isAttackingRef.current}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
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
                                            onClick={() => currentPlayer === 2 && handleCellClick(r, c)}
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
                        {currentPlayer === 2 && (
                            <div className="card-carousel">
                                <button
                                    className="carousel-button"
                                    onClick={() => setPlayer2CharIndex(prev => Math.max(0, prev - 1))}
                                    disabled={player2CharIndex === 0 || currentPlayer !== 2 || gameOver || isAttackingRef.current}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <div className="card-display-area">
                                    {Array(4).fill(null).map((_, i) => {
                                        const char = characters[player2CharIndex + i];
                                        const onCooldown = player2Cooldowns[char?.name];
                                        return (
                                            <CharacterCard
                                                key={`p2-card-${i}`}
                                                character={char}
                                                isSelected={selectedCharacter?.name === char?.name}
                                                onCooldown={onCooldown > roundCounter ? onCooldown : false}
                                                onClick={() => handleCellClick(null, player2CharIndex + i, true)}
                                            />
                                        );
                                    })}
                                </div>
                                <button
                                    className="carousel-button"
                                    onClick={() => setPlayer2CharIndex(prev => Math.min(maxCharIndex, prev + 1))}
                                    disabled={player2CharIndex >= maxCharIndex || currentPlayer !== 2 || gameOver || isAttackingRef.current}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
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
                            onClick={resetGame}
                        >
                            Play Again
                        </button>
                    </div>
                )}

                {/* Reset Button (always visible) */}
                <button
                    className="reset-game-button"
                    onClick={resetGame}
                >
                    Reset Game
                </button>
            </div>
        </div>
    );
};

export default App;

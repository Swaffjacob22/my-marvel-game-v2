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

    // Constants for game dimensions and layout (simplified for web layout)
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
        if (!character) return <div className="w-24 h-36 bg-gray-700 rounded-lg shadow-inner flex items-center justify-center text-gray-400 text-sm">Empty</div>;

        const cardClasses = `
            w-24 h-36 bg-white rounded-lg shadow-md flex flex-col items-center justify-between p-2 text-gray-800
            transition-all duration-200 ease-in-out cursor-pointer relative
            ${isSelected ? 'border-4 border-yellow-400 scale-105' : 'border border-gray-300'}
            ${onCooldown ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg'}
        `;

        return (
            <div className={cardClasses} onClick={onCooldown ? null : onClick}>
                <div className="text-sm font-bold text-center mb-1">{character.name}</div>
                {/* Use img tag for character image */}
                <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-16 h-16 object-cover rounded-full mt-1"
                    onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = `https://placehold.co/64x64/CCCCCC/000000?text=ERR`; // Fallback image
                    }}
                />
                <div className="text-xs w-full px-1 mt-1">
                    <div className="flex justify-between"><span>HP:</span> <span>{character.health}</span></div>
                    <div className="flex justify-between"><span>ATK:</span> <span>{character.attack}</span></div>
                </div>
                {onCooldown && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center rounded-lg text-white font-bold text-center text-sm p-2">
                        Ready in R{onCooldown}
                    </div>
                )}
            </div>
        );
    };

    // Component for rendering the game board cell
    const BoardCell = ({ character, row, col, isAttacker, isTarget, onClick }) => {
        const cellClasses = `
            w-24 h-24 border-2 flex items-center justify-center rounded-lg relative overflow-hidden
            ${isAttacker ? 'border-green-500 bg-green-900 bg-opacity-20' : ''}
            ${isTarget ? 'border-red-500 bg-red-900 bg-opacity-20' : ''}
            ${!isAttacker && !isTarget ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : ''}
            transition-all duration-300 ease-in-out
        `;

        return (
            <div className={cellClasses} onClick={onClick}>
                {character ? (
                    <>
                        {/* Use img tag for character image on board */}
                        <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="w-20 h-20 object-cover rounded-full"
                            onError={(e) => {
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = `https://placehold.co/80x80/CCCCCC/000000?text=ERR`; // Fallback image
                            }}
                        />
                        <div className="absolute top-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">HP: {character.health}</div>
                        <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">ATK: {character.attack}</div>
                    </>
                ) : (
                    <span className="text-gray-500 text-3xl font-bold">+</span>
                )}
            </div>
        );
    };

    // Render the main game UI
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 w-full max-w-6xl">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                    Marvel Grid Battle
                </h1>

                <div className="flex justify-around w-full text-2xl font-semibold mb-4">
                    <div>Round: <span className="text-yellow-400">{roundCounter}</span></div>
                    <div>Current Player: <span className={`font-bold ${currentPlayer === 1 ? 'text-blue-400' : 'text-red-400'}`}>Player {currentPlayer}</span></div>
                </div>

                <div className="relative w-full flex justify-between items-start gap-8">
                    {/* Player 1 Area */}
                    <div className="flex flex-col items-center gap-4 w-1/2">
                        <h2 className="text-3xl font-bold text-blue-400">Player 1 (Avengers)</h2>
                        <div className="flex items-center gap-4 w-full">
                            {/* Player 1 HQ */}
                            <div className={`
                                w-24 h-96 bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2 shadow-inner
                                ${highlightedCells.target === 'p1_hq' ? 'border-4 border-red-500' : 'border-2 border-gray-600'}
                                transition-all duration-300 ease-in-out
                            `}>
                                <h3 className="text-lg font-semibold text-gray-300 mb-2">HQ</h3>
                                <div className="w-20 h-4 bg-gray-500 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${(player1HqHealth / maxHqHealth) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-white mt-1">{player1HqHealth}/{maxHqHealth}</div>
                            </div>

                            {/* Player 1 Board */}
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${boardCols}, minmax(0, 1fr))` }}>
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
                            <div className="flex items-center gap-2 mt-4 w-full justify-center">
                                <button
                                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50"
                                    onClick={() => setPlayer1CharIndex(prev => Math.max(0, prev - 1))}
                                    disabled={player1CharIndex === 0 || currentPlayer !== 1 || gameOver || isAttackingRef.current}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <div className="flex gap-4">
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
                                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50"
                                    onClick={() => setPlayer1CharIndex(prev => Math.min(maxCharIndex, prev + 1))}
                                    disabled={player1CharIndex >= maxCharIndex || currentPlayer !== 1 || gameOver || isAttackingRef.current}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Dividing Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-600 rounded-full -translate-x-1/2"></div>

                    {/* Player 2 Area */}
                    <div className="flex flex-col items-center gap-4 w-1/2">
                        <h2 className="text-3xl font-bold text-red-400">Player 2 (Villains)</h2>
                        <div className="flex items-center gap-4 w-full">
                            {/* Player 2 Board */}
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${boardCols}, minmax(0, 1fr))` }}>
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
                                w-24 h-96 bg-gray-700 rounded-lg flex flex-col items-center justify-center p-2 shadow-inner
                                ${highlightedCells.target === 'p2_hq' ? 'border-4 border-red-500' : 'border-2 border-gray-600'}
                                transition-all duration-300 ease-in-out
                            `}>
                                <h3 className="text-lg font-semibold text-gray-300 mb-2">HQ</h3>
                                <div className="w-20 h-4 bg-gray-500 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${(player2HqHealth / maxHqHealth) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-sm text-white mt-1">{player2HqHealth}/{maxHqHealth}</div>
                            </div>
                        </div>
                        {/* Player 2 Cards (Conditional Rendering) */}
                        {currentPlayer === 2 && (
                            <div className="flex items-center gap-2 mt-4 w-full justify-center">
                                <button
                                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50"
                                    onClick={() => setPlayer2CharIndex(prev => Math.max(0, prev - 1))}
                                    disabled={player2CharIndex === 0 || currentPlayer !== 2 || gameOver || isAttackingRef.current}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <div className="flex gap-4">
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
                                    className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50"
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
                    <div className="mt-6 p-4 bg-blue-600 text-white rounded-xl shadow-lg text-center font-semibold text-xl animate-pulse">
                        {message}
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center rounded-3xl z-10">
                        <h2 className="text-6xl font-extrabold text-white mb-8 animate-bounce">GAME OVER!</h2>
                        <button
                            className="bg-green-500 hover:bg-green-600 text-white text-2xl font-bold py-4 px-8 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105"
                            onClick={resetGame}
                        >
                            Play Again
                        </button>
                    </div>
                )}

                {/* Reset Button (always visible) */}
                <button
                    className="mt-6 bg-purple-600 hover:bg-purple-700 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg transition-colors transform hover:scale-105"
                    onClick={resetGame}
                >
                    Reset Game
                </button>
            </div>
        </div>
    );
};

export default App;

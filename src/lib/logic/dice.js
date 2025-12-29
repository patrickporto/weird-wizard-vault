export function calculateDiceRoll(sides, count = 1, modifier = 0) {
    const results = [];
    let total = 0;
    
    // Base rolls
    for(let i=0; i<count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        results.push(r);
        total += r;
    }
    
    let formulaStr = `${count}d${sides}`;
    let bonusRolls = [];
    let modifierTotal = 0;

    // Modifier Logic
    if (modifier !== 0) {
        if (sides === 20) {
            // Boons/Banes logic for d20
            const numDice = Math.abs(modifier);
            for (let i = 0; i < numDice; i++) bonusRolls.push(Math.floor(Math.random() * 6) + 1);
            const highest = Math.max(...bonusRolls);
            
            if (modifier > 0) {
                modifierTotal = highest;
                total += highest;
                formulaStr += ` + ${highest} [Boon]`;
            } else {
                modifierTotal = -highest;
                total -= highest;
                formulaStr += ` - ${highest} [Bane]`;
            }
        } else {
            // Flat modifier for other dice
            modifierTotal = modifier;
            total += modifier;
            formulaStr += modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
        }
    }

    return {
        total,
        results,
        bonusRolls, // For testing/display
        formula: formulaStr,
        crit: sides === 20 && results.includes(20),
        modifierTotal 
    };
}

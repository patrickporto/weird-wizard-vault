export interface DiceRollResult {
    total: number;
    results: number[];
    bonusRolls: number[];
    formula: string;
    crit: boolean;
    modifierTotal: number;
  /** Detailed dice breakdown for 3D rolling notation */
  dice?: Array<{
    sides: number;
    count: number;
    results: number[];
  }>;
}

export function calculateDiceRoll(sides: number, count: number = 1, modifier: number = 0): DiceRollResult {
    const results: number[] = [];
    let total = 0;

    // Base rolls
    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        results.push(r);
        total += r;
    }

    let formulaStr = `${count}d${sides}`;
    let bonusRolls: number[] = [];
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
        bonusRolls,
        formula: formulaStr,
        crit: sides === 20 && results.includes(20),
      modifierTotal,
      dice: [{ sides, count, results }]
    };
}

export function evaluateDiceFormula(formula: string): DiceRollResult {
    // Remove whitespace
    const cleanFormula = formula.replace(/\s+/g, '');

    // Match parts: (+/-)(count)d(sides) OR (+/-)(number)
    const regex = /([+-]?)(?:(\d+)?d(\d+)|(\d+))/g;

    let total = 0;
    let resultFormula = "";
    const results: number[] = [];
  const detailedDice: Array<{ sides: number; count: number; results: number[] }> = [];

    let match;
    let isFirst = true;

    while ((match = regex.exec(cleanFormula)) !== null) {
        if (match[0] === "") {
            regex.lastIndex++; // Avoid infinite loop if zero-width match
            continue;
        }

        const signStr = match[1] || "+";
        const sign = signStr === "-" ? -1 : 1;

        const countStr = match[2];
        const sidesStr = match[3];
        const flatStr = match[4];

        if (sidesStr) {
            // It's a dice roll: count d sides
            const count = countStr ? parseInt(countStr) : 1;
            const sides = parseInt(sidesStr);

            const subResults: number[] = [];
            let subTotal = 0;
            for (let i = 0; i < count; i++) {
                const r = Math.floor(Math.random() * sides) + 1;
                subResults.push(r);
                subTotal += r;
            }
            results.push(...subResults);
          detailedDice.push({ sides, count, results: subResults });

            const termTotal = subTotal * sign;
            total += termTotal;

            const operator = isFirst && sign === 1 ? '' : (sign === 1 ? ' + ' : ' - ');
          // Cleaner formula
          if (count === 1 && sides === 3 && subResults[0]) {
            // Keep it clean for 1d3? Actually standard notation is better
          }

            const termStr = `${operator}${count}d${sides}[${subResults.join(',')}]`;
            resultFormula += termStr;
        } else if (flatStr) {
            // Flat number
            const val = parseInt(flatStr);
            total += val * sign;

            const operator = isFirst && sign === 1 ? '' : (sign === 1 ? ' + ' : ' - ');
            const termStr = `${operator}${val}`;
            resultFormula += termStr;
        }
        isFirst = false;
    }

    return {
        total,
        results,
        bonusRolls: [],
        formula: resultFormula.trim(),
        crit: false,
      modifierTotal: 0,
      dice: detailedDice
    };
}

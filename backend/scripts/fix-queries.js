const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/models/queries.js');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    if (lines.length < 586) {
        console.log('File has fewer lines than expected. Aborting.');
        process.exit(1);
    }

    // Check if line 585 (index 584) looks like garbage
    const line585 = lines[584];
    if (line585.trim().startsWith('};  }    next(error);')) {
        console.log('Found garbage at line 585. Removing...');
        lines.splice(584, 1); // Remove 1 line at index 584

        // Also remove lines 0-583 if they are all empty?
        // Let's just remove the one garbage line for safety.

        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log('Successfully fixed queries.js');
    } else {
        console.log('Line 585 does NOT match expected garbage. Content sample:', line585.substring(0, 50));
        console.log('Aborting fix to prevent data loss.');
    }

} catch (err) {
    console.error('Error fixing file:', err);
}

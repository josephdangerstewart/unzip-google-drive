const extract = require('extract-zip');
const fs = require('fs/promises');
const path = require('path');

const encounteredFiles = new Set();

async function extractZip(source, output) {
	try {
		await extract(source, {
			dir: output,
			onEntry: (entry) => {
				if (!entry.fileName.endsWith('/')) {
					if (encounteredFiles.has(entry.fileName)) {
						console.log('Conflict', entry.fileName);
					}

					encounteredFiles.add(entry.fileName);
				}
			},
		});
	} catch (err) {
		console.log(err);
		return false;
	}

	return true;
}

async function extractAllZips(input, output) {
	const files = await fs.readdir(input);
	
	for (const file of files) {
		if (!await extractZip(path.join(input, file), output)) {
			console.log('failed to extract file');
		}
	}
}

extractAllZips(path.join(__dirname, 'input'), path.join(__dirname, 'output'));

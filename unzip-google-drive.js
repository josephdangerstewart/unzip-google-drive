const extract = require('extract-zip');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { program } = require('commander');

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

program
	.description('Combines several zip files into one output folder')
	.argument('<input>', 'The path to the input folder.')
	.argument('<output>', 'The path to the output folder.')
	.action(async (relativeInput, relativeOutput) => {
		const input = path.resolve(relativeInput);
		const output = path.resolve(relativeOutput);

		if (!fsSync.existsSync(input) || !fsSync.existsSync(output)) {
			console.error('Input or output not valid folders');
			return;
		}
		await extractAllZips(input, output);
	})
	.parse();

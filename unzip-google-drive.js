#!/usr/bin/env node
const extract = require('extract-zip');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const encodeUrl = require('encodeurl');
const { program } = require('commander');

/**
 * @type {Record<string, Set<string>>}
 */
const encounteredFiles = {};

/**
 * @param {string} fileName
 * @param {string} conflictDir
 */
function markConflict(fileName, conflictDir) {
	const normalizedName = encodeUrl(fileName.replace(/\//g, '\\'));

	const conflicts = encounteredFiles[fileName];

	if (!conflicts) {
		throw new Error(`conflicts not found for ${fileName}`);
	}

	const contents = `${fileName}\n\n${[...conflicts].join('\n')}`;

	console.log(conflictDir, normalizedName);
	fsSync.writeFileSync(path.join(conflictDir, `${normalizedName}.txt`), contents, {
		encoding: 'utf-8',
	});
}

async function extractZip(source, output, conflictDir) {
	try {
		await extract(source, {
			dir: output,
			onEntry: (entry) => {
				if (!entry.fileName.endsWith('/')) {
					let isConflict = false;
					if (!encounteredFiles[entry.fileName]) {
						encounteredFiles[entry.fileName] = new Set();
					} else {
						isConflict = true;
					}

					encounteredFiles[entry.fileName].add(source);

					if (isConflict) {
						markConflict(entry.fileName, conflictDir);
					}
				}
			},
		});
	} catch (err) {
		console.log(err);
		return false;
	}

	return true;
}

async function extractAllZips(input, output, conflicts) {
	const files = await fs.readdir(input);

	for (const file of files) {
		if (!(await extractZip(path.join(input, file), output, conflicts))) {
			console.log('failed to extract file');
		}
	}
}

program
	.description('Combines several zip files into one output folder')
	.argument('<input>', 'The path to the input folder.')
	.argument('<output>', 'The path to the output folder.')
	.argument('<conflicts>', 'The directory in which to record conflicting files (if any).')
	.action(async (relativeInput, relativeOutput, relativeConflicts) => {
		const input = path.resolve(relativeInput);
		const output = path.resolve(relativeOutput);
		const conflicts = path.resolve(relativeConflicts);

		if (!fsSync.existsSync(input)) {
			console.error('Input directory must exist');
			return;
		}

		if (!fsSync.existsSync(conflicts)) {
			await fs.mkdir(conflicts, { recursive: true });
		}

		if (!fsSync.existsSync(output)) {
			await fs.mkdir(output, { recursive: true });
		}

		await extractAllZips(input, output, conflicts);
	})
	.parse();

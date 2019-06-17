const fs = require('fs');
const request = require('request');

let fetchLatestDump = () => {
	return new Promise((resolve, reject) => {
		request('http://setup.roblox.com/versionQTStudio', (err, res, body) => {
			if (err)
				reject(err);
			else
				request(`http://setup.roblox.com/${body}-API-Dump.json`, {json: true}, (err, res, body) => {
					if (err)
						reject(err);
					else
						resolve(body);
				});
		});
	});
}

let readFile = (fileName) => {
	return new Promise((resolve, reject) => {
		fs.readFile(fileName, "utf8", (err, data) => {
			if (err)
				reject(err);
			else
				resolve(data);
		});
	});
}

let asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++)
		await callback(array[index], index, array);
}

let run = async () => {
	let classes = {};
	let dump = await fetchLatestDump();

	await asyncForEach(dump.Classes, async (element) => {
		let instance = {
			// Members: instance.Members,
			Super: element.Superclass,
			Tags: element.Tags,
			ShortDescription: "Undocumented",
			Description: "",
			Related: []
		}
		try {
			instance.Description = await readFile(`docs/Instances/${element.Name}/${element.Name}.md`);
		}
		catch {
		}
		classes[element.Name] = instance;
	})

	let apiRef = {
		classes: classes,
		dataTypes: null
	}

	fs.writeFile(`api.json`, JSON.stringify(apiRef, null, "	"), 'utf8', (err) => {
		if (err)
			throw err;
	});
}

run();
const fs = require('fs');
const fm = require('front-matter');
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

let formatDocumentation = (data) => {
	var documentation = fm(data);
	return {
		Attributes:	documentation.attributes,
		Content:	documentation.body
	}
}

let getDocumentation = (folder, name) => {
	return new Promise((resolve, reject) => {
		fs.readFile(`${folder}/${name}.md`, "utf8", (err, data) => {
			if (err) // TODO: Only resolve to undefined when no file found
				resolve(undefined);
			else
				resolve(formatDocumentation(data));
		});
	});
}

let asyncForEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++)
		await callback(array[index], index, array);
}

let processClass = async instance => {
	var folder = `docs/Instances/${instance.Name}`;
	var members = {};
	asyncForEach(instance.Members, async member => members[member.Name] = {
		Category:		member.Category,
		MemberType:		member.MemberType,
		Security:		member.Security,
		Serialization:	member.Serialization,
		ValueType:		member.ValueType,
		Tags:			member.Tags,
		Documentation:	await getDocumentation(folder, member.Name)
	});
	return {
		Members:		members,
		Super:			instance.Superclass,
		Tags:			instance.Tags,
		Documentation:	await getDocumentation(folder, instance.Name)
	}
}

let run = async () => {
	let classes = {};
	let dump = await fetchLatestDump();

	await asyncForEach(dump.Classes, async instance => classes[instance.Name] = await processClass(instance));

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
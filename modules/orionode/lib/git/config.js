/*******************************************************************************
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node */
var api = require('../api'), writeError = api.writeError;
var git = require('nodegit');
var finder = require('findit');
var path = require("path");
var ini = require('ini');

function getConfig(workspaceDir, fileRoot, req, res, next, rest) {
		var configPath = rest.replace("config/clone/file/", "");
		configPath = api.join(workspaceDir, configPath);
		git.Repository.open(configPath)
		.then(function(repo) {
			if (repo) {
				var location = api.join(fileRoot, configPath);
				repo.getRemotes()
				.then(function(configs){
					configs.forEach(function(config) {
						configs.push({
							"CloneLocation": "/gitapi/clone/file" + location,
							"Location": "/gitapi/config"+ key +"clone/file"+location,
							"Key": key,
							"Value": '["'+value+'"]',
							"Type": "Config"
						});
					});
				})
				.then(function() {
					var resp = JSON.stringify({
						"Children": configs,
						"CloneLocation": "/gitapi/clone/file/"+location,
						"Location": "/gitapi/config/clone/file/"+location,
						"Type": "Config"
					});
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.setHeader('Content-Length', resp.length);
					res.end(resp);
				});
			}
			else {
				writeError(403, res);
			}
		});
}

module.exports = {
	getConfig: getConfig
}
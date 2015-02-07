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

function getRemotes(workspaceDir, fileRoot, req, res, next, rest) {
		var remotes = [];
		var repoPath = rest.replace("remote/file/", "");
		repoPath = api.join(workspaceDir, repoPath);
		git.Repository.open(repoPath)
		.then(function(repo) {
			if (repo) {
				var location = api.join(fileRoot, repoPath);
				repo.getRemotes()
				.then(function(remotes){
					remotes.forEach(function(remote) {
						repo.getRemote(remote)
						.then(function(remote){
							remotes.push({
								"CloneLocation": "/gitapi/clone"+location,
								"IsGerrit": "false", // should check 
								"GitUrl": remote.url(),
								"Name": remote.name(),
								"Location": location,
								"Type": "Remote"
							});
						});
					});
				})
				.then(function() {
					var resp = JSON.stringify({
						"Children": remotes,
						"Type": "Remote"
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
	getRemotes: getRemotes
};
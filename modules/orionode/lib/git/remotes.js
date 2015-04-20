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
var async = require('async');
var git = require('nodegit');

function getRemotes(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("remote/file/", "");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	var repo;

	git.Repository.open(repoPath)
	.then(function(r) {
		repo = r;
		return git.Remote.list(r);
	})
	.then(function(remotes){
		var r = [];
		async.each(remotes, function(remote, cb) {
			git.Remote.lookup(repo, remote)
			.then(function(remote){
				var name = remote.name();
				r.push({
					"CloneLocation": "/gitapi/clone/file/" + fileDir,
					"IsGerrit": "false", // should check 
					"GitUrl": remote.url(),
					"Name": name,
					"Location": "/gitapi/remote/" + name + "/file/" + fileDir,
					"Type": "Remote"
				});
				cb();
			});
		}, function(err) {
			var resp = JSON.stringify({
				"Children": r,
				"Type": "Remote"
			});
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		});
	})
}

function addRemote(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("remote/file/", "");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	
	git.Repository.open(repoPath)
	.then(function(repo) {
		return git.Remote.create(repo, req.body.Remote, req.body.RemoteURI);
	})
	.then(function(remote) {
		var resp = JSON.stringify({
			"Location": "/gitapi/remote/" + remote.name() + "/file/" + fileDir
		});
		res.statusCode = 201;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	})
}

function deleteRemote(workspaceDir, fileRoot, req, res, next, rest) {
	rest = rest.replace("remote/", "");
	var split = rest.split("/file/");
	var repoPath = api.join(workspaceDir, split[1]);
	git.Repository.open(repoPath)
	.then(function(repo) {
		var resp = git.Remote.delete(repo, split[0]);
		if (resp === 0) {
	        res.statusCode = 200;
	        res.end();
	    } else {
	        writeError(403, res);
	    } 
	});
}

module.exports = {
	getRemotes: getRemotes,
	addRemote: addRemote,
	deleteRemote: deleteRemote
};
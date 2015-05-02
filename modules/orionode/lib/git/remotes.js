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
					"IsGerrit": false, // should check 
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


/* */
function getRemotesBranches(workspaceDir, fileRoot, req, res, next, rest) {
	var remoteName = rest.replace("remote/", "").substring(0, rest.lastIndexOf("/file/")-"/file/".length-1);
	var repoPath = rest.substring(rest.lastIndexOf("/file/")).replace("/file/","");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	var repo;
	git.Repository.open(repoPath)
	.then(function(repo) {
		repo.getReferences(git.Reference.TYPE.OID)
		.then(function(referenceList) {
			var branches = []
			async.each(referenceList, iterator, function(err) {
				if (err) {
					return writeError(403, res);
				}
				var resp = JSON.stringify({
					"Children": branches,
					"Location": "/gitapi/remote/" + remoteName + "/file/" + fileDir,
					"Name": remoteName
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			});

			function iterator(ref, callback) {
				if (ref.isRemote()) {
					var rName = ref.name().replace("refs/remotes/", "");
					if (rName.indexOf(remoteName) === 0) {
						repo.getBranchCommit(ref)
						.then(function(commit) {
							branches.push({
								"CommitLocation": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir,
								"Id": commit.sha(),
								"Location": "/gitapi/remote/" + remoteName + "/file/" + fileDir,
								"Name": ref.name()
							})
							callback();
						});
					} else {
						callback();
					}					
				} else {
					callback();
				}
			}
		});
	});
}

function getRemotesBranchDetail(workspaceDir, fileRoot, req, res, next, rest) {

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

function postRemote(workspaceDir, fileRoot, req, res, next, rest) {
	rest = rest.replace("remote/", "");
	var split = rest.split("/file/");
	var repoPath = api.join(workspaceDir, split[1]);
	var branch = split[0];

	if (res.body.Fetch) {
		fetchRemote(repoPath, res, branch)
	} else {
		pushRemote(repoPath, res, branch)
	}

}

function fetchRemote(repoPath, res, branch) {

}

function pushRemote(repoPath, res, branch) {

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
	getRemotesBranches: getRemotesBranches,
	getRemotesBranchDetail: getRemotesBranchDetail,
	addRemote: addRemote,
	postRemote: postRemote,
	deleteRemote: deleteRemote
};
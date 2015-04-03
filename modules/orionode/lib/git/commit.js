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
var Clone = git.Clone;
var exec = require('child_process').exec;
var fs = require('fs');
var url = require('url');

function getCommitLog(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("commit/HEAD/file/", "");
	var fileDir = repoPath;
	var query = url.parse(req.url, true).query;
	var pageSize = query.pageSize;
	var page = query.page;
    repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		repo.getCurrentBranch()
		.then(function(reference) {
			repo.getBranchCommit(reference)
			.then(function(commit) {
				var commits = [];
				var history = commit.history();
				var count = 0;
				history.on("commit", function(commit) {
					if (++count >= pageSize*page) {
						return commits;

					} else if (count >= (page-1)*pageSize) {
						commits.push({
							"AuthorEmail": commit.author().name, 
							"AuthorName": commit.author().email,
							"Children":[],
							"CommitterEmail": commit.committer().email,
							"CommitterName": commit.committer.name,
							"ContentLocation": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir + "?parts=body",
							"DiffLocation": "/gitapi/diff/" + commit.sha() + "/file/" + fileDir,
							"Diffs":[],
							"Location": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir,
							"Message": commit.message(),
							"Name": commit.sha(),
							"Time": commit.timeMs(),
							"Type": "Commit"
						});
					}
				});
				history.start();
			})
			.then(function(commits) {
				var referenceName = reference.name();
				var resp = JSON.stringify({
					"Children": commits,
					"RepositoryPath": "",
					"toRef": {
						"CloneLocation": "/gitapi/clone/file/" + fileDir,
						"CommitLocation": "/gitapi/commit/" + referenceName + "/file/" + fileDir,
						"Current": true,
						"HeadLocation": "/gitapi/commit/HEAD/file/" + fileDir,
						"Location": "/gitapi/branch/" + referenceName + "/file/" + fileDir,
						"Name": referenceName,
						"Type": "Branch"
					}
				});
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Content-Length', resp.length);
				res.end(resp);
			})
		});
	});
}

function getCommitMetadata(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("commit/", "");
	var commitID = repoPath.substring(0, repoPath.indexOf("/"));
	repoPath = repoPath.substring(repoPath.indexOf("/")+1).replace("file/", "");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		git.Commit.lookup(repo, commitID)
		.then(function(commit) {
			var commitResp = {
				"Children": [{
					"AuthorEmail": commit.author().name, 
					"AuthorName": commit.author().email,
					"Children":[],
					"CommitterEmail": commit.committer().email,
					"CommitterName": commit.committer.name,
					"ContentLocation": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir + "?parts=body",
					"DiffLocation": "/gitapi/diff/" + commit.sha() + "/file/" + fileDir,
					"Location": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir,
					"Message": commit.message(),
					"Name": commit.sha(),
					"Time": commit.timeMs(),
					"Type": "Commit"	
				}],
				"RepositoryPath": ""
			}
			var resp = JSON.stringify(commitResp);

			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
		});
	});
}

function postCommit(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("commit/HEAD/file/", "");
	var fileDir = repoPath;
	var query = url.parse(req.url, true).query;
	var pageSize = query.pageSize;
	var page = query.page;
	var theRepo;
    repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
	})
	.then(function() {
	  return index.writeTree();
	})
	.then(function(oidResult) {
	  oid = oidResult;
	  return nodegit.Reference.nameToId(theRepo, "HEAD");
	})
	.then(function(head) {
	  return theRepo.getCommit(head);
	})
	.then(function(parent) {
	  var author = nodegit.Signature.create("John Doe", "johndoe@gmail.com", 123456789, 60);
	  var committer = nodegit.Signature.create("johndoe", "johndoe@github.com", 987654321, 90);

	  return theRepo.createCommit("HEAD", author, committer, "message", oid, [parent]);
	})
	.done(function(id) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', resp.length);
        res.end();
	});
}

module.exports = {
	getCommitLog: getCommitLog,
	getCommitMetadata: getCommitMetadata,
    postCommit: postCommit
};

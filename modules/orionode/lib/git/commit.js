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
var path = require("path");
var Clone = git.Clone;
var fs = require('fs');
var url = require('url');

var val = undefined;

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
			});
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

function getFileContent(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("commit/", "");
	var commitID = repoPath.substring(0, repoPath.indexOf("/"));
	repoPath = repoPath.substring(repoPath.indexOf("/")+1).replace("file/", "");
	filePath = repoPath.substring(repoPath.indexOf("/")+1).replace("Folder/", "");
	repoPath = repoPath.substring(0, repoPath.indexOf("/"));
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);
	filePath = filePath.replace(fileDir + "/", "");

	git.Repository.open(repoPath)
	.then(function(repo) {
		git.Commit.lookup(repo, commitID)
		.then(function(commit) {
			commit.getEntry(filePath)
			.then(function(treeEntry) {
				treeEntry.getBlob()
				.then(function(blob) {
					var resp = JSON.stringify(blob.toString());
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.setHeader('Content-Length', resp.length);
					res.end(resp);
				});
			});
		});
	});
}

function postCommit(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("commit/HEAD/file/", "");
	var filePath = repoPath.substring(repoPath.indexOf("/")+1);
	repoPath = repoPath.indexOf("/") === -1 ? repoPath : repoPath.substring(0, repoPath.indexOf("/"));
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);

	var theRepo, index, oid, author, commiter, thisCommit, parentCommit;
	var diffs = [];
	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
		return repo;
	})
	.then(function(repo) {
		return repo.openIndex();
	})
    .then(function(indexResult) {
    	index = indexResult;
    	return index.read(1);
	})
	.then(function() {
		return index.writeTree();
	})
	.then(function(oidResult) {
		oid = oidResult;
		return git.Reference.nameToId(theRepo, "HEAD");
	})
	.then(function(head) {
		return theRepo.getCommit(head);
	})
	.then(function(parent) {
		parentCommit = parent;

		if (req.body.AuthorEmail) {
			author = git.Signature.now(req.body.AuthorName, req.body.AuthorEmail);
			commiter = git.Signature.now(req.body.CommitterName, req.body.CommitterEmail);
		} else {
			author = git.Signature.default(theRepo);	
			commiter = git.Signature.default(theRepo);
		}
		
		return theRepo.createCommit("HEAD", author, commit, "message", oid, [parent]);
	})
	.then(function(id) {
		return git.Commit.lookup(theRepo, id);
	})
	.then(function(commit) {
		thisCommit = commit;
	})
	.then(function(parent) {
		return git.Diff.treeToTree(theRepo, parentCommit.getTree(), thisCommit.getTree(), null);
	})
	.then(function(diff) {
		var patches = diff.patches();
	    patches.forEach(function(patch) {
	        var oldFile = patch.oldFile();
	        var newFile = patch.newFile();
	        var newFilePath = newFile.path();
	        var change = patch.isCopied() ? "COPY" : 
	        			 patch.isDeleted() ? "DELETE" :
	        			 patch.isIgnored() ? "IGNORE" :
	        			 patch.isModified() ? "MODIFY" :
	        			 patch.isRenamed() ? "RENAME" :
	     				 patch.isTypeChange() ? "TYPECHANGE" :
	     				 patch.isUnmotified() ? "UNMODIFY" :
	     				 patch.isUntracked() ? "UNTRACKED" : "NONE"
	        
	        diffs.push({
				"ChangeType": change,
				"DiffLocation": "/gitapi/diff/" + parentCommit.sha() + ".." + thisCommit.sha() + "/file/" + path.join(fileDir, newFilePath),
				"NewPath": newFilePath,
				"OldPath": oldFile.path(),
				"Type": "Diff"
			});
	    })
	})
	.done(function(id) {
        res.statusCode = 200;
        var resp = JSON.stringify({
			"AuthorEmail": author.email,
			"AuthorName": author.name,
			"Children": [],
			"CommitterEmail": commiter.email,
			"CommitterName": commiter.name,
			"ContentLocation": "/gitapi/commit/" + thisCommit.sha() + "/file/" + fileDir + "?parts=body",
			"DiffLocation": "/gitapi/diff/" + thisCommit.sha() + "file/" + fileDir,
			"Diffs": diffs,
			"Location": "/gitapi/commit/" + thisCommit.sha() + "/file/" + fileDir,
			"Message": thisCommit.message(),
			"Name": thisCommit.sha(),
			"Time": thisCommit.time(),
			"Type": "Commit"
		});
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', resp.length);
        res.end();
	});
}



function findInPath(config, prefix, key) {
	if (typeof config !== "object") {
		if (prefix === key) {
			console.log(config);
			val = config;
		}
	} else {
		for (var property in config) {
		    if (config.hasOwnProperty(property)) {
		    	// ini gives reply as 'branch "origin"', remove the ", add period
		    	var path = property.split('"').join("").replace(" ", ".");
		        findInPath(config[property], prefix === "" ? path : prefix + "." + path, key);
		    }
		}
	}
}

module.exports = {
	getCommitLog: getCommitLog,
	getCommitMetadata: getCommitMetadata,
	getFileContent: getFileContent,
    postCommit: postCommit
};

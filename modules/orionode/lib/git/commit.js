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

function getCommit(workspaceDir, fileRoot, req, res, next, rest) {
	rest = rest.replace("commit/", "");
	var query = url.parse(req.url, true).query;

	if (rest.indexOf("/HEAD/") === 0) { //Need to figure out how to parse between getting file from head!
		getCommitLog(workspaceDir, fileRoot, req, res, next, rest);
	} else  {
		var commit = rest.substring(0, rest.indexOf("/"));

		if (commit.indexOf("..") === -1) {
			if (query.parts) {
				getFileContent(workspaceDir, fileRoot, req, res, next, rest);
			} else {
				getCommitMetadata(workspaceDir, fileRoot, req, res, next, rest);
			}
		} else {
			getCommitRevision(workspaceDir, fileRoot, req, res, next, rest);
		}
	}
}

function getCommitRevision(workspaceDir, fileRoot, req, res, next, rest) {
	var branches = rest.substring(0, rest.indexOf("/"));
	var repoPath = rest.replace(branches, "").replace("/file/", "");
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);

	branches = branches.replace("%252F", "/").split("..");

	var numToReturn = null;

	if (branches[0].indexOf("~") !== -1) {
		var split = branches[0].split("~")
		numToReturn = Number(split[1]);
		branches[0] = split[0];
	}

	var theRepo, finalCommit, startingCommit;

	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
		return theRepo.getReferenceCommit(branches[0]);
	})
	.then(function(commit) {
		finalCommit = commit;
		return theRepo.getReferenceCommit(branches[1]);
	})
	.then(function(commit) {
		startingCommit = commit;
		oid = commit.id();
		hideOid = finalCommit.id();

	    var revWalk = theRepo.createRevWalk();

	    revWalk.sorting(git.Revwalk.SORT.TOPOLOGICAL);

	    revWalk.push(oid);

	    if (oid.toString() !== hideOid.toString()) { // Only hide if the reference commits aren't the same
	    	console.log("hid")
	    	revWalk.hide(hideOid);
	    }
	    
		var commits = [];

		function writeResponse() {
			var referenceName = branches[0];
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
		}

	    function walk() {
			return revWalk.next()
			.then(function(oid) {
				if (!oid) {
					if (numToReturn && commits.length < numToReturn) {
						writeError(400, res);
						return;
					}

					writeResponse();
					return;
				}

				return theRepo.getCommit(oid)
				.then(function(commit) {
					commits.push({
						"AuthorEmail": commit.author().name(), 
						"AuthorName": commit.author().email(),
						"Children":[],
						"CommitterEmail": commit.committer().email(),
						"CommitterName": commit.committer().name(),
						"ContentLocation": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir + "?parts=body",
						"DiffLocation": "/gitapi/diff/" + commit.sha() + "/file/" + fileDir,
						"Diffs":[],
						"Location": "/gitapi/commit/" + commit.sha() + "/file/" + fileDir,
						"Message": commit.message(),
						"Name": commit.sha(),
						"Time": commit.timeMs(),
						"Type": "Commit"
					});

					if (numToReturn && commits.length === numToReturn) {
						writeResponse();
						return;
					}

					return walk();
				});
			});
		}

    	return walk();
	})

}

function getCommitLog(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("HEAD/file/", "");
	var fileDir = repoPath;
	var query = url.parse(req.url, true).query;
	var pageSize = query.pageSize;
	var page = query.page;
    repoPath = api.join(workspaceDir, repoPath);

    var theRepo;
    var ref;
	git.Repository.open(repoPath)
	.then(function(repo) {
		theRepo = repo;
		return repo.getCurrentBranch();
	})
	.then(function(reference) {
		ref = reference
		return theRepo.getBranchCommit(reference);
	})
	.then(function(commit) {
		var commits = [];
		var history = commit.history();
		var count = 0;

		history.on("commit", function(commit) {
			if (++count > pageSize*page) {
				var referenceName = ref.name();
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
				return;
			} else if (count >= (page-1)*pageSize) {
				commits.push({
					"AuthorEmail": commit.author().name(), 
					"AuthorName": commit.author().email(),
					"Children":[],
					"CommitterEmail": commit.committer().email(),
					"CommitterName": commit.committer().name(),
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

		// history.on('end', function(commits) {
		// 	return commits;
		// })

		history.start();
	})
}

function getCommitMetadata(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest;
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
	var repoPath = rest;
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
	if (req.body.New) { //This is a weird route. Placeholder code so server doesn't crash.
		var repoPath = rest.replace("commit/", "");
		var branch = repoPath.substring(0, repoPath.indexOf("/"));
		var location = "/gitapi/commit/" + branch + ".." + req.body.New + repoPath.replace(branch, "");
		res.statusCode = 200;
        var resp = JSON.stringify({
			"Location": location
		});
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', resp.length);
        res.end(resp);
        return;
	}

	var repoPath = rest.replace("commit/HEAD/file/", "");
	var filePath = repoPath.substring(repoPath.indexOf("/")+1);
	repoPath = repoPath.indexOf("/") === -1 ? repoPath : repoPath.substring(0, repoPath.indexOf("/"));
	var fileDir = repoPath;
	repoPath = api.join(workspaceDir, repoPath);

	var theRepo, index, oid, author, committer, thisCommit, parentCommit;
	var diffs = [];
	var tree1, tree2;

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
			committer = git.Signature.now(req.body.CommitterName, req.body.CommitterEmail);
		} else {
			author = git.Signature.default(theRepo);	
			committer = git.Signature.default(theRepo);
		}
		
		return theRepo.createCommit("HEAD", author, committer, req.body.Message, oid, [parent]);
	})
	.then(function(id) {
		return git.Commit.lookup(theRepo, id);
	})
	.then(function(commit) {
		thisCommit = commit;
		return thisCommit.getTree();
	})
	.then(function(tree){
		tree2 = tree;
		return parentCommit.getTree();
	})
	.then(function(tree) {
		tree1 = tree;
		return git.Diff.treeToTree(theRepo, tree1, tree2, null);
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
	     				 patch.isUnmodified() ? "UNMODIFY" :
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
	.catch(function(err) {
		console.log(err);
		writeError(403, res);
	})
	.done(function() {
        res.statusCode = 200;
        var resp = JSON.stringify({
			"AuthorEmail": author.email(),
			"AuthorName": author.name(),
			"Children": [],
			"CommitterEmail": committer.email(),
			"CommitterName": committer.name(),
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
        res.end(resp);
	})
}

module.exports = {
	getCommit: getCommit,
    postCommit: postCommit
};

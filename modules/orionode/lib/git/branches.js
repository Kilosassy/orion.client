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
var fs = require('fs');

function getBranches(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("branch/file/", "");
	var fileDir = repoPath;
	var gitPath;
    repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
		repo.getReferences(git.Reference.TYPE.OID)
		.then(function(referenceList) {
			var remotes = []
			var branches = {}
	 		referenceList.forEach(function(ref) {
 				if (ref.isRemote()) {
					remoteName = ref.name().replace("refs/remotes/", "");
					remotes.push(remoteName);
				}

	 			if (ref.isBranch()) {
	 				var branchURL = ref.name().split("/").join("%252F");
	 				var branchName = ref.name().replace("refs/heads/", "");
	 				var isCurrent = ref.isHead() ? true : false;

	 				branches[branchName] = {
			 			"CloneLocation": "/gitapi/clone/file/"+ fileDir,
			 			"CommitLocation": "/gitapi/commit/" + branchURL + "/file/" + fileDir,
			 			"Current": isCurrent,
			 			"DiffLocation": "/gitapi/diff/" + branchName + "/file/" + fileDir,
			 			"FullName": "refs/heads/" + branchName,
			 			"HeadLocation": "/gitapi/commit/HEAD/file/" + fileDir,
			 			"LocalTimeStamp": 1424471958000, //hardcoded local timestamp
			 			"Location": "/gitapi/branch/" + branchName + "/file/" + fileDir,
			 			"Name": branchName,
			 			"RemoteLocation": [],
			 			"TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + branchName,
			 			"Type": "Branch"
		 			};
	 			}
 			});
			//Check if there are remotes and branches of the same name
			remotes.forEach(function(remote) {
				var nameToMatch = remote.substring(remote.indexOf("/") + 1);
				var remoteURL = remote.split("/").join("%252F");
				var remoteName = remote.substring(0, remote.indexOf("/"));
				if (branches[nameToMatch]) {
					branches[nameToMatch]["RemoteLocation"].push({
				        "Children": [{
				          "CloneLocation": branches[nameToMatch]["CloneLocation"],
				          "CommitLocation": "/gitapi/commit/" + remoteURL + "/file/" + fileDir,
				          "DiffLocation": "/gitapi/diff/" + remoteURL + "/file/" + fileDir,
				          "FullName": "refs/remotes/" + remote,
				          "GitUrl": "git@github.com:albertcui/orion.client.git", //hardcoded
				          "HeadLocation": "/gitapi/commit/HEAD/" + fileDir,
				          "Id": "08c41c776f2e9e5dca7fbbbcfe2c8c9c06300998", //hardcoded
				          "IndexLocation": "/gitapi/index/" + fileDir,
				          "Location": "/gitapi/remote/" + remote + "/file/" + fileDir,
				          "Name": "origin/node_git_pages",
				          "TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + remoteURL,
				          "Type": "RemoteTrackingBranch"
				        }],
				        "CloneLocation": "/gitapi/clone/file/" + fileDir,
				        "GitUrl": "git@github.com:albertcui/orion.client.git",
				        "IsGerrit": false, //hardcoded
				        "Location": "/gitapi/remote/" + remoteName + "/" + fileDir,
				        "Name": "origin",
				        "Type": "Remote"
					})
				}
			});
			var branchesArray = [];

			for(var prop in branches) {
				branchesArray.push(branches[prop]);
			}

			var resp = JSON.stringify({
				"Children": branchesArray,
				"Type": "Branch"
			});
		
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
 		})
 	})
}
	 
//	 function checkRemote(branches, sendResponse) {
//	 	var remotes = [];
//	 	var remotePath = api.join(repoPath, ".git/refs/remotes/");
//	 	fs.readdir(remotePath, function(err, r) {
//	 		if (err) throw err;
//	 		r.forEach(function(remoteDir) {
//	 			var path = api.join(remotePath, remoteDir);
//	 			fs.readdir(path, function(err, remoteFile){
//	 				if (err) throw err;
//	 				remoteFile.forEach(function(fileName){
//	 					var file = api.join(path, fileName)
//	 					fs.readFile(file, {encoding:'utf-8'}, function (err, data){
//	 						data = data.split("\n")
//	 						data.forEach(function(string) {
//	 							var name = string.replace("ref: refs/remotes/", "");
//	 							remotes.push(name);
//	 							console.log(remotes);
//	 						});
//	 					});
//	 				});
//	 			});
//	 		});
//	 	});
//	 	
//	 }
	 
	 // function sendResponse(branches) {
	 // 	var branchInfo = [];
	 // 	var currentBranch;
	 // 	var headPath = api.join(repoPath, ".git/HEAD");
	 // 	fs.readFile(headPath, {encoding:'utf-8'}, function (err, data) {
	 // 		if (err) throw err;
	 // 		data = data.split("\n");
		// 	currentBranch = data[0].replace("ref: refs/heads/", "");
	 // 		branches.forEach(function(branchObject) {
	 // 			var isCurrent;
		//  		var branchID = branchObject.branchId;
		//  		var branchName = branchObject.branchName;
		//  		var branchURL = branchObject.branchURL;
		//  		var branchURLRemotes = branchURL.replace("heads", "remotes/origin");
		//  		branchURL = encodeURI(branchURL);
		//  		branchURLRemotes = encodeURI(branchURLRemotes);
		//  		if (branchName === currentBranch){isCurrent = true;} else {isCurrent = false;}
		 		
	 // 		});
	 // 		var resp = JSON.stringify({
		// 				"Children": branchInfo,
		// 				"Type": "Branch"
		// 	});
		// 	res.statusCode = 200;
		// 	res.setHeader('Content-Type', 'application/json');
		// 	res.setHeader('Content-Length', resp.length);
		// 	res.end(resp);
		// 	});
	 	// }
// }

module.exports = {
	getBranches: getBranches
};

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
//var finder = require('findit');
//var path = require("path");
var fs = require('fs');

function getBranches(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("branch/file/", "");
	var fileDir = repoPath;
    repoPath = api.join(workspaceDir, repoPath);
		git.Repository.open(repoPath)
		.then(function(repo) {
			if (repo) {
				var gitPath = api.join(repoPath, ".git/refs/heads");
				fs.readdir(gitPath, getRefs);
				
			}
			else {
				writeError(403, res);
			}
	 	});
	 	
	 function getRefs(err, files) {
	 	if (err) throw err;
	 	var branches = [];
	 	if (files.length !== 0) {
	 		files.forEach(function(file) {
	 			//find branch from .git/refs/heads when uncleared first
	 		});
	 	}
	 	else {
	 		var packedRefs = api.join(repoPath, ".git/packed-refs");
	 		fs.readFile(packedRefs, {encoding:'utf-8'}, function (err, data) {
			  if (err) throw err;
			  var content = data.split("\n");
			  content.forEach(function(string) {
			  	string = string.split(" ");
			  	if (string[1] && string[1].indexOf("refs/heads/") === 0) {
			  		var originalBranch = string[1];
			  		var branch = string[1].replace("refs/heads/","");
			  		branches.push({
			  			branchName: branch,
			  			branchId: string[0],
			  			branchURL: originalBranch
		  			});
			  	}
			  });
			  sendResponse(branches);
			 });
		}
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
	 
	 function sendResponse(branches) {
	 	var branchInfo = [];
	 	var currentBranch;
	 	var headPath = api.join(repoPath, ".git/HEAD");
	 	fs.readFile(headPath, {encoding:'utf-8'}, function (err, data) {
	 		if (err) throw err;
	 		data = data.split("\n");
			currentBranch = data[0].replace("ref: refs/heads/", "");
	 		branches.forEach(function(branchObject) {
	 			var isCurrent;
		 		var branchID = branchObject.branchId;
		 		var branchName = branchObject.branchName;
		 		var branchURL = branchObject.branchURL;
		 		var branchURLRemotes = branchURL.replace("heads", "remotes/origin");
		 		branchURL = encodeURI(branchURL);
		 		branchURLRemotes = encodeURI(branchURLRemotes);
		 		if (branchName === currentBranch){isCurrent = true;} else {isCurrent = false;}
		 		branchInfo.push({
		 			"CloneLocation": "/gitapi/clone/file/"+ fileDir,
		 			"CommitLocation": "/gitapi/commit/" + branchURL + "/file/" + fileDir,
		 			"Current": isCurrent,
		 			"DiffLocation": "/gitapi/diff/" + branchName + "/file/" + fileDir,
		 			"FullName": "refs/heads/" + branchName,
		 			"HeadLocation": "/gitapi/commit/HEAD/file/" + fileDir,
		 			"LocalTimeStamp": 1424471958000, //hardcoded local timestamp
		 			"Location": "/gitapi/branch/" + branchName + "/file/" + fileDir,
		 			"Name": branchName,
		 			"RemoteLocation": [{
		 				"Children": [{
					          "CloneLocation": "/gitapi/clone/file/"+ fileDir,
					          "CommitLocation": "/gitapi/commit/" + branchURLRemotes + "/file/" + fileDir,
					          "DiffLocation": "/gitapi/diff" + branchURLRemotes.replace("remotes", "") + "/file/" + fileDir,
					          "FullName": "refs/remotes/origin/" + branchName,
					          "GitUrl": "https://github.com/albertcui/orion.client.git", // hardcoded git URL
					          "HeadLocation": "/gitapi/commit/HEAD/file/" + fileDir,
					          "Id": branchID,
					          "IndexLocation": "/gitapi/index/file/" + fileDir,
					          "Location": "/gitapi/remote/origin/node_git_pages/file/mvthen-OrionContent/Orion%20Client/orion.client/",
					          "Name": "origin/master",
					          "TreeLocation": "/gitapi/tree/file/mvthen-OrionContent/Orion%20Client/orion.client/origin%252Fmaster",
					          "Type": "RemoteTrackingBranch"
					        }],
					        "CloneLocation": "/gitapi/clone/file/" + fileDir,
					        "GitUrl": "https://github.com/albertcui/orion.client.git", // hardcoded git URL
					        "IsGerrit": false,
					        "Location": "/gitapi/remote/origin/file/" + fileDir,
					        "Name": "origin",
					        "Type": "Remote"
		 			}],
		 			"TreeLocation": "/gitapi/tree/file/" + fileDir + "/" + branchName,
		 			"Type": "Branch"
		 		});
	 		});
	 		var resp = JSON.stringify({
						"Children": branchInfo,
						"Type": "Branch"
			});
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);
			});
	 	}
}

module.exports = {
	getBranches: getBranches
};

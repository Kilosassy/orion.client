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
var mkdirp = require("mkdirp");
var exec = require('child_process').exec;

function getClone(workspaceDir, fileRoot, req, res, next, rest) {
	var repos = [];
	finder(workspaceDir).on('directory', function (dir, stat, stop) {
	    var base = path.basename(dir);
	    if (base !== '.git') {
			git.Repository.open(dir)
			.then(function(repo) {
				if (repo) {
					var location = api.join(fileRoot, dir.replace(workspaceDir + "/", ""));
					var repoInfo = {
						"BranchLocation": "/gitapi/branch" + location,
						"CommitLocation": "/gitapi/commit" + location,
						"ConfigLocation": "/gitapi/config/clone" + location,
						"ContentLocation": location,
						"DiffLocation": "/gitapi/diff/Default" + location,
						"HeadLocation": "/gitapi/commit/HEAD" + location,
						"IndexLocation": "/gitapi/index" + location,
						"Location": "/gitapi/clone" + location,
						"Name": base,
						"RemoteLocation": "/gitapi/remote" + location,
						"StashLocation": "/gitapi/stash" + location,
						"StatusLocation": "/gitapi/status" + location,
						"TagLocation": "/gitapi/tag" + location,
						"Type": "Clone"
					};
					repo.getRemotes()
					.then(function(remotes){
						remotes.forEach(function(remote) {
							if (remote === "origin") {
								repo.getRemote(remote)
								.then(function(remote){
									repoInfo.GitUrl = remote.url();
									return;
								});
							} 
							
						});
					})
					.then(function() {
						repos.push(repoInfo);
					});
					return repo.getMasterCommit();
				}
			 });
//			 .then(function(firstCommitOnMaster) {
//			      // Create a new history event emitter.
//			      var history = firstCommitOnMaster.history();
//			      var count = 0;
//			      history.on("commit", function(commit) {
//  					  if (++count >= 2) {
//				          return;
//				      }
//				      // Show the commit sha.
//				      console.log("commit " + commit.sha());
//				      // Store the author object.
//				      var author = commit.author();
//				
//				      // Display author information.
//				      console.log("Author:\t" + author.name() + " <", author.email() + ">");
//				
//				      // Show the commit date.
//				      console.log("Date:\t" + commit.date());
//				
//				      // Give some space and show the message.
//				      console.log("\n    " + commit.message());
//				      
//				      return;
//				  });
//				  
//				  history.start();
//			  })
		}
	})
	.on('end', function() {
		var resp = JSON.stringify({
			"Children": repos,
			"Type": "Clone"
		});
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', resp.length);
		res.end(resp);
	})
	.on('error', function() {
		writeError(403, res);
	});
}

function postClone(workspaceDir, fileRoot, req, res, next, rest) {
	var req_data = req.body;
	var url = req_data.GitUrl;
	var the_dir = workspaceDir.substring(0, workspaceDir.lastIndexOf("/"));
	var cache = [];
	/*console.log("POST clone with data: " + JSON.stringify(req, function(key, value) {
	    if (typeof value === 'object' && value !== null) {
	        if (cache.indexOf(value) !== -1) {
	            // Circular reference found, discard key
	            return;
	        }
	        // Store value in our collection
	        cache.push(value);
	    }
	    return value;
	}));*/
	// We want to clone a repo
	if (req_data.hasOwnProperty("GitUrl")) {
		var clone_dir = the_dir + url.substring(url.lastIndexOf("/"), url.indexOf(".git"));

		console.log("trying to clone into " + clone_dir);
		Clone.clone(url, clone_dir).then(function(repo) {
			console.log("successfully cloned " + url);
			return repo.id;
		}).then(function(id) {
			//we got the repo
			console.log("POST git/clone: sucess!");
			response = {
				"Id": id,
				"Location": workspaceDir,
				"Message": "Cloning " + workspaceDir + url,
				"PercentComplete": 0,
				"Running": true
			};
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(JSON.stringify(response));
		}, function(err) {
			// some kind of error with cloning a repo
			console.log("POST git/clone: failure!");
			console.log(err);
			writeError(403, res);
		});
	// We want to init a new repo
	}else if (req_data.hasOwnProperty("Location")) {
		var init_dir = the_dir + req_data["Location"];
		console.log("IN INIT");

		mkdirp(init_dir, function (err) {
    		if (err) {
				writeError(409, res);
				console.log(err);
    		} else {
    			console.log("directory created, now run with git init");
    			var child = exec('git init',
					function (error, stdout, stderr) {
						if (error !== null) {
						  console.log('exec error: ' + error);
						} else {
							console.log("POST git/clone: sucess!");
							response = {
								"Location": init_dir
							};
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.setHeader('Content-Length', resp.length);
							res.end(JSON.stringify(response));
						}
					});
    		} 
}		);
	}
}

module.exports = {
	getClone: getClone,
	postClone: postClone
};
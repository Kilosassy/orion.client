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

function clone(workspaceDir, fileRoot, req, res, next, rest) {
	var repos = new Array();
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
								})
							} 
							
						});
					})
					.then(function() {
						repos.push(repoInfo);
					});
					return repo.getMasterCommit();
				}
			 })
			 .then(function(firstCommitOnMaster) {
			      // Create a new history event emitter.
			      var history = firstCommitOnMaster.history();
			      var count = 0;
			      history.on("commit", function(commit) {
  					  if (++count >= 2) {
				          return;
				      }
				      // Show the commit sha.
				      console.log("commit " + commit.sha());
				      // Store the author object.
				      var author = commit.author();
				
				      // Display author information.
				      console.log("Author:\t" + author.name() + " <", author.email() + ">");
				
				      // Show the commit date.
				      console.log("Date:\t" + commit.date());
				
				      // Give some space and show the message.
				      console.log("\n    " + commit.message());
				      
				      return;
				  });
				  
				  history.start();
			  })
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
		writeError(403, res)
	})
}

module.exports = {
	clone: clone
}
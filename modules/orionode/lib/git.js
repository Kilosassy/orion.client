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
/*eslint-env node*/

var connect = require('connect');
var fs = require('fs');
var util = require('util');
var api = require('./api'), writeError = api.writeError;
var fileUtil = require('./fileUtil');
var resource = require('./resource');
var git = require('nodegit');
var finder = require('findit');
var path = require("path");

module.exports = function(options) {
	var workspaceRoot = options.root;
	var workspaceDir = options.workspaceDir;
	if (!workspaceRoot) { throw 'options.root path required'; }

	var workspaceId = 'orionode';
	var workspaceName = 'Orionode Git';

	return connect()
	.use(connect.json())
	.use(resource(workspaceRoot, {
		GET: function(req, res, next, rest) {
			console.log(rest);
			if (rest === '') {
				console.log("nope")
			} else if (rest.indexOf("clone/workspace/") === 0) {
				console.log("matched")
				var repos = new Array();
				finder(workspaceDir).on('directory', function (dir, stat, stop) {
				    var base = path.basename(dir);
				    if (base !== '.git') {
	    				git.Repository.open(dir)
						.then(function(repo) {
							if (repo) {
								var location = dir.replace(workspaceDir, "Folder"); 
								var repoInfo = {
								  "BranchLocation": "/gitapi/branch/file/" + location,
							      "CommitLocation": "/gitapi/commit/file/" + location,
							      "ConfigLocation": "/gitapi/config/clone/file/" + location,
							      "ContentLocation": "/file/" + location,
							      "DiffLocation": "/gitapi/diff/Default/file/" + location,
							      "HeadLocation": "/gitapi/commit/HEAD/file/" + location,
							      "IndexLocation": "/gitapi/index/file/" + location,
							      "Location": "/gitapi/clone/file/" + location,
							      "Name": base,
							      "RemoteLocation": "/gitapi/remote/file/" + location,
							      "StashLocation": "/gitapi/stash/file/" + location,
							      "StatusLocation": "/gitapi/status/file/" + location,
							      "TagLocation": "/gitapi/tag/file/" + location,
							      "Type": "Clone"
								};
								repo.getRemotes()
								.then(function(remotes){
									remotes.forEach(function(remote) {
										if (remote === "origin") {
											repo.getRemote(remote)
											.then(function(remote){
												console.log(remote.url());
												repoInfo.GitUrl = remote.url();
												console.log(repoInfo);
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
		},
		POST: function(req, res, next, rest) {
			writeError(403, res)
		},
		PUT: function(req, res, next, rest) {
			// Would 501 be more appropriate?
			writeError(403, res);
		},
		DELETE: function(req, res, next, rest) {
			// Would 501 be more appropriate?
			writeError(403, res);
		}
	}));
};

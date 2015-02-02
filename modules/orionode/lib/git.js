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
	var fileRoot = options.fileRoot;
	if (!workspaceRoot) { throw 'options.root path required'; }
	return connect()
	.use(connect.json())
	.use(resource(workspaceRoot, {
		GET: function(req, res, next, rest) {
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
			else if (rest.indexOf("remote/file/") === 0) {
				var remotes = new Array();
				var repoPath = rest.replace("remote/file/", "");
				repoPath = api.join(workspaceDir, repoPath);
				git.Repository.open(repoPath)
				.then(function(repo) {
					if (repo) {
						var location = api.join(fileRoot, repoPath);
						repo.getRemotes()
						.then(function(remotes){
							remotes.forEach(function(remote) {
								repo.getRemote(remote)
								.then(function(remote){
									remotes.push({
										"CloneLocation": "/gitapi/clone"+location,
										"IsGerrit": "false", // should check 
										"GitUrl": remote.url(),
										"Name": remote.name(),
										"Location": location,
										"Type": "Remote"
									});
								})
							});
						})
						.then(function() {
							var resp = JSON.stringify({
								"Children": remotes,
								"Type": "Remote"
							});
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.setHeader('Content-Length', resp.length);
							res.end(resp);
						});
					}
					else {
						writeError(403, res);
					}
				})
			} else if (rest.indexOf("branch/file/")===0) {
				var branches = new Array();
				
			}
//			} else if (rest.indexOf("status/file/") === 0) {
//				var status = new Array();
//				var repoPath = rest.replace("status/file/", "");
//				repoPath = api.join(workspaceDir, repoPath);
//				git.Repository.open(repoPath)
//				.then(function(repo) {
//					finder(repoPath).on('file', function (file, stat) {
//						var num = 1;
//						console.log(file.replace(workspaceDir,"."));
//						console.log(repo);
//						git.Status.file(num, repo, file.replace(workspaceDir,"."));
//					})
//						
//				});
//			}
//			else if (rest.indexOf("config/clone/file/") === 0) {
//				var configPath = rest.replace("config/clone/file/", "");
//				configPath = api.join(workspaceDir, configPath);
//				git.Repository.open(configPath)
//				.then(function(repo) {
//					if (repo) {
//						var location = api.join(fileRoot, configPath);
//						repo.getRemotes()
//						.then(function(configs){
//							configs.forEach(function(config) {
//								configs.push({
//									"CloneLocation": "/gitapi/clone/file" + location,
//									"Location": "/gitapi/config"+ key +"clone/file"+location,
//									"Key": key,
//									"Value": '["'+value+'"]',
//									"Type": "Config"
//								});
//							});
//						})
//						.then(function() {
//							var resp = JSON.stringify({
//								"Children": configs,
//								"CloneLocation": "/gitapi/clone/file/"+location,
//								"Location": "/gitapi/config/clone/file/"+location,
//								"Type": "Config"
//							});
//							res.statusCode = 200;
//							res.setHeader('Content-Type', 'application/json');
//							res.setHeader('Content-Length', resp.length);
//							res.end(resp);
//						});
//					}
//					else {
//						writeError(403, res);
//					}
//				});
//			}
			else {
				writeError(403, res);
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
			if(rest.indexOf("clone/file/") === 0){
				var configPath = rest.replace("clone/file", "");
				console.log("Removing git repository ".concat(workspaceDir.concat(configPath)));
				rmdir = require('rimraf');
				rmdir(workspaceDir.concat(configPath), function() {
					res.statusCode = 200;
					res.end();
				});
			} 
		}
	}));
};

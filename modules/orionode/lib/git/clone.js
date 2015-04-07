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
var async = require('async');

function getClone(workspaceDir, fileRoot, req, res, next, rest) {
	var repos = [];

	fs.readdir(workspaceDir, function(err, files) {
		if (err) return cb(err);
		
		files = files.map(function(file) {
			return path.join(workspaceDir, file);
		})

		async.each(files, checkDirectory, function(err) {
			if (err) return writeError(403);
			var resp = JSON.stringify({
				"Children": repos,
				"Type": "Clone"
			});

			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', resp.length);
			res.end(resp);	
		});
	})

	function checkDirectory(dir, cb) {
		//Check if the dir is a directory

		fs.lstat(dir, function(err, stat) {
			if (err || !stat.isDirectory()) return cb();
			var base = path.basename(dir);
			git.Repository.open(dir)
			.then(function(repo) {
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
								return cb();
							});
						} 
						
					});
				})
				.then(function() {
					repos.push(repoInfo);
				});
	 		})
			.catch(function(err) {
				fs.readdir(dir, function(err, files) {
					if (err) return cb();

					files = files.map(function(file) {
						return path.join(dir, file);
					})

					async.each(files, checkDirectory, cb);
				})	
			})
		})
	}
}

function postInit(workspaceDir, req, res) {
	var initDir = workspaceDir + '/' + req.body.Name;

        console.log("Trying to init " + initDir);
        fs.mkdir(initDir, function(err){
				if(err){
                                	writeError(409, res);
                                        console.log(err);
                                }
                          });
	git.Repository.init(initDir, 0)
        .then(function(repo) {
        	var response = {
                	"Location": initDir
                }
                res.statusCode = 201;
                res.end(JSON.stringify(response));
              },
              function(err) {
                console.log(err);
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
}

module.exports = {
	getClone: getClone,
	postClone: postClone,
	postInit: postInit
};

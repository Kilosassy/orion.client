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

/*
 * Stash for_each available after Nodegit commit f91c501
 * Merge pull request #495 from nodegit/enable-stash
 * Enable `git_stash_foreach`
 *
 */ 
function getStash(workspaceDir, fileRoot, req, res, next, rest) {
	console.log("POST stash: " + workspaceDir + "   " + fileRoot+ "    " + JSON.stringify(req.url)+"  and REST: " + rest);
	
	var url = JSON.stringify(req.url);
	var repoPath = rest.replace("stash/file/", "");
	repoPath = api.join(workspaceDir, repoPath);

	var location = url.substring(0, url.indexOf('?'));
	var cloneLocation = location.replace("/stash","/clone");
	var stashType = "StashCommit";

	stashes = [];
        var stashCb = function(index, message, oid) {
          stashes.push({index: index, message: message, oid: oid});
	  console.log("##Stash:{ index: "+index+", message: "+message+" ,oid: "+oid+" }"); 
        };

	git.Repository.open(repoPath)
        .then(function(repo) {
		console.log(" Location: " + location + 
			    " CloneLocation: " + cloneLocation+
			    " type: " + stashType+
			    " repoPath: "+repoPath+
			    " repo.namespace(): "+repo.getNamespace());

		git.Stash.foreach(repo, stashCb).then(function(result){
			console.log("Run git.stash.foreach and got: "+result);
		});
		

	});
}

module.exports = {
        getStash: getStash
}


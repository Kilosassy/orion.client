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
	console.log("POST stash: " + workspaceDir + "   " + fileRoot+ "    " + JSON.stringify(req.url));
	var stashes = [];
	var stashCb = function(index, message, oid) {
          stashes.push({index: index, message: message, oid: oid});
        };

    	return git.Repository.open(workspaceDir+"/booom")
      	.then(function(repository) {
						return git.Stash.foreach(repository, stashCb).then(
							function() {
								console.log("Stashes: " + JSON.stringify(stashes));
							});
      			});
}

module.exports = {
        getStash: getStash
}


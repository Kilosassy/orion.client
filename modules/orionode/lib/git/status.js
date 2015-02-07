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

function getStatus(workspaceDir, fileRoot, req, res, next, rest) {				
		var status = [];
		var repoPath = rest.replace("status/file/", "");
		repoPath = api.join(workspaceDir, repoPath);
		console.log(repoPath);
		git.Repository.open(repoPath)
		  .then(function(repo) {
		    repo.getStatus().then(function(statuses) {
		      function statusToText(status) {
		        var added = [],
		        	changed = [],
		        	conflicting = [],
		        	missing = [],
		        	modified = [],
		        	removed = [],
		        	untracked = [];
		        	
		        if (status.isNew()) { untracked.push("NEW"); }
		        if (status.isModified()) { modified.push("MODIFIED"); }
		        if (status.isTypechange()) { words.push("TYPECHANGE"); }
		        if (status.isRenamed()) { words.push("RENAMED"); }
		        if (status.isIgnored()) { words.push("IGNORED"); }
		
		        return words.join(" ");
		      }
		
		      statuses.forEach(function(file) {
		        console.log(file.path() + " " + statusToText(file));
		      });
		    });
		});

}

module.exports = {
	getStatus: getStatus
};
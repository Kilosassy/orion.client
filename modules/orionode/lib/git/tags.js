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

function getTags(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("tag/file/", "");
	var tags = [];
    repoPath = api.join(workspaceDir, repoPath);
	git.Repository.open(repoPath)
	.then(function(repo) {
    	return git.Reference.list(repo);
  	})
  	.then(function(refNames) {
    	// all of the refs names, as strings. 
    	return refNames.filter(function(ref) { 
      		return ref.indexOf('refs/tags/') === 0;
    	});
  	})
  	.then(function(tagNames) {
    	// do what you need here
    	tagNames.forEach(function(tag) {
    		tags.push({
    			"FullName": tag,
    			"Name": tag.replace("refs/tags/", "")
    		});
    	})
  	})
  	.then(function(){
  		var resp = JSON.stringify({
            "Children": tags
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', resp.length);
        res.end(resp);
  	})
}

module.exports = {
	getTags: getTags
}

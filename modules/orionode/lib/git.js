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
var clone = require('./git/clone');
var remotes = require('./git/remotes');
var branches = require('./git/branches');
var status = require('./git/status');
var config = require('./git/config');
var rmdir = require('rimraf');
var git = require('nodegit');
var finder = require('findit');
var path = require("path");
var Clone = git.Clone;

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
				console.log("nope");
			} else if (rest.indexOf("clone/workspace/") === 0) {
				clone.getClone(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("remote/file/") === 0) {
				remotes.getRemotes(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("branch/file/")===0) {
//				branches.getBranches(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("status/file/") === 0) {
				status.getStatus(workspaceDir, fileRoot, req, res, next, rest);
			} else if (rest.indexOf("config/clone/file/") === 0) {
//				config.getConfig(workspaceDir, fileRoot, req, res, next, rest);
			} else {
				writeError(403, res);
			}
		},
		POST: function(req, res, next, rest) {
			if(rest.indexOf("git/clone") === 0) {
				clone.postClone(workspaceDir, fileRoot, req, res, next, rest);
			}
		},
		PUT: function(req, res, next, rest) {
			// Would 501 be more appropriate?
			writeError(403, res);
		},
		DELETE: function(req, res, next, rest) {
			if(rest.indexOf("clone/file/") === 0){
				var configPath = rest.replace("clone/file", "");
				console.log("Removing git repository ".concat(workspaceDir.concat(configPath)));
				rmdir(workspaceDir.concat(configPath), function() {
					res.statusCode = 200;
					res.end();
				});
			} 
		}
	}));
};

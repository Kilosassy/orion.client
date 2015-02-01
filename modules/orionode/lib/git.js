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
			console.log(req.url);
			var ws = JSON.stringify({
			  "Children": [
			    {
			      "BranchLocation": "/gitapi/branch/file/albert-OrionContent/Folder/orion.client/",
			      "CommitLocation": "/gitapi/commit/file/albert-OrionContent/Folder/orion.client/",
			      "ConfigLocation": "/gitapi/config/clone/file/albert-OrionContent/Folder/orion.client/",
			      "ContentLocation": "/file/albert-OrionContent/Folder/orion.client/",
			      "DiffLocation": "/gitapi/diff/Default/file/albert-OrionContent/Folder/orion.client/",
			      "GitUrl": "https://github.com/albertcui/orion.client.git",
			      "HeadLocation": "/gitapi/commit/HEAD/file/albert-OrionContent/Folder/orion.client/",
			      "IndexLocation": "/gitapi/index/file/albert-OrionContent/Folder/orion.client/",
			      "Location": "/gitapi/clone/file/albert-OrionContent/Folder/orion.client/",
			      "Name": "orion.client",
			      "RemoteLocation": "/gitapi/remote/file/albert-OrionContent/Folder/orion.client/",
			      "StashLocation": "/gitapi/stash/file/albert-OrionContent/Folder/orion.client/",
			      "StatusLocation": "/gitapi/status/file/albert-OrionContent/Folder/orion.client/",
			      "TagLocation": "/gitapi/tag/file/albert-OrionContent/Folder/orion.client/",
			      "Type": "Clone"
			    },
			    {
			      "BranchLocation": "/gitapi/branch/file/albert-OrionContent/Folder/orion.server/",
			      "CommitLocation": "/gitapi/commit/file/albert-OrionContent/Folder/orion.server/",
			      "ConfigLocation": "/gitapi/config/clone/file/albert-OrionContent/Folder/orion.server/",
			      "ContentLocation": "/file/albert-OrionContent/Folder/orion.server/",
			      "DiffLocation": "/gitapi/diff/Default/file/albert-OrionContent/Folder/orion.server/",
			      "GitUrl": "https://github.com/albertcui/orion.server.git",
			      "HeadLocation": "/gitapi/commit/HEAD/file/albert-OrionContent/Folder/orion.server/",
			      "IndexLocation": "/gitapi/index/file/albert-OrionContent/Folder/orion.server/",
			      "Location": "/gitapi/clone/file/albert-OrionContent/Folder/orion.server/",
			      "Name": "orion.server",
			      "RemoteLocation": "/gitapi/remote/file/albert-OrionContent/Folder/orion.server/",
			      "StashLocation": "/gitapi/stash/file/albert-OrionContent/Folder/orion.server/",
			      "StatusLocation": "/gitapi/status/file/albert-OrionContent/Folder/orion.server/",
			      "TagLocation": "/gitapi/tag/file/albert-OrionContent/Folder/orion.server/",
			      "Type": "Clone"
			    }
			  ],
			  "Type": "Clone"
			});
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Length', ws.length);
			res.end(ws);
		},
		POST: function(req, res, next, rest) {
			console.log("potato")
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

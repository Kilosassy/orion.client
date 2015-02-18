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

function stageFile(workspaceDir, rest) {
        var repo;
        var index;

        var start = rest.substring(rest.indexOf("/A/") + 3);
        var it = rest.substring(rest.indexOf("/A/") + 3, 3 + rest.indexOf("/A/") + start.indexOf("/"));
        var dir = path.join(workspaceDir, it);
        var filename = rest.substring(1 + 3 + rest.indexOf("/A/") + start.indexOf("/"));

        git.Repository.open(dir + "/.git")
        .then(function(repoResult) {
            repo = repoResult;
          return repoResult;
        })
        .then(function(repo) {
          return repo.openIndex();
        })
        .then(function(indexResult) {
          index = indexResult;
          return index.read(1);
        })
        .then(function() {
          // this file is in the root of the directory and doesn't need a full path
          return index.addByPath(filename);
        })
        .then(function() {
          // this file is in a subdirectory and can use a relative path
          return index.addByPath(path.join(dir, filename));
        })
        .then(function() {
          // this will write both files to the index
          return index.write();
        })
        .then(function() {
          return index.writeTree();
        })
        .done(function(tree) {
          console.log("done");
        });
}

function putStage(workspaceDir, fileRoot, req, res, next, rest) {
    var req_data = req.body;
    var cache = [];
    if (req_data.hasOwnProperty("Path")) {
        for (var i = 0; i < req_data.Path.length; i++) {
            stageFile(workspaceDir, rest + req_data.Path[i]);
        }
        res.statusCode = 200;
        res.end();
    } else {
        stageFile(workspaceDir, rest);
        res.statusCode = 200;
        res.end();
    }
}

module.exports = {
    putStage: putStage
};

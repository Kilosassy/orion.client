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
var url = require('url');

function getDiffBetweenWorkingTreeAndHead(workspaceDir, fileRoot, req, res, next, rest, diffOnly, uriOnly) {
	var repoPath = rest.replace("diff/Default/file/", "");
	var filePath = repoPath.substring(repoPath.indexOf("/")+1);
    repoPath = repoPath.substring(0, repoPath.indexOf("/"));
	var fileDir = repoPath;
    repoPath = api.join(workspaceDir, repoPath);
    var body = "";

    git.Repository.open(repoPath)
    .then(function(repo) {
        return git.Diff.indexToWorkdir(repo, null, null);
    })
    .then(function(diff) {
        processDiff(diff, filePath, fileDir, res, diffOnly, uriOnly);
    })
}

function processDiff(diff, filePath, fileDir, res, diffOnly, uriOnly) {
    var patches = diff.patches();
    patches.forEach(function(patch) {

        var oldFile = patch.oldFile();
        var newFile = patch.newFile();
        var newFilePath = newFile.path();

        if (newFilePath === filePath) {

            URI = ""
            diffContent = ""

            if (!diffOnly) {
                URI += JSON.stringify({
                    "Base": "/gitapi/index/file/" + fileDir + "/" + newFilePath,
                    "Location": "/gitapi/diff/Default/file" + fileDir + "/" + newFilePath,
                    "New": "/file/" + fileDir + "/" + newFilePath,
                    "Old": "/gitapi/index/file/" + fileDir + "/" + newFilePath,
                    "Type": "Diff"
                })
                URI += "\n"
            }

            if (!uriOnly) {
                diffContent += "diff --git a/" + oldFile.path() + " b/" + newFile.path() + "\n";
                diffContent += "index " + oldFile.id().toString().substring(0, 7) + ".." + newFile.id().toString().substring(0, 7) + " " + newFile.mode().toString(8) + "\n";
                diffContent += "--- a/" + oldFile.path() + "\n";
                diffContent += "+++ b/" + newFile.path() + "\n"; 
                
                var hunks = patch.hunks();

                hunks.forEach(function(hunk, i) {

                    diffContent += hunk.header() + "\n"

                    var lines = hunk.lines()
                    /*
                     * For some reason, nodegit returns basically the entire content of the file
                     * for each line. 
                     * 
                     * The first line (separated by \n), seems to be what we want.
                     */
                    lines.forEach(function(line, index) {
                        var prefix = " "
                        switch(line.origin()) {
                            case git.Diff.LINE.ADDITION:
                                prefix = "+";
                                break;
                            case git.Diff.LINE.DELETION:
                                prefix ="-";
                                break;
                        }

                        diffContent += prefix + line.content().split("\n")[0] + "\n";
                    })
                })
            }

            var body = "";

            if (!uriOnly && !diffOnly) {
                body += "--BOUNDARY\n";
                body += "Content-Type: application/json\n\n";
                body += URI;
                body += "--BOUNDARY\n"
                body += "Content-Type: plain/text\n\n";
                body += diffContent;
            } else if (!uriOnly) {
                body += diffContent;
            } else {
                body += URI;
            }

            res.statusCode = 200;
            if (!diffOnly && !uriOnly) {
                res.setHeader('Content-Type', 'multipart/related; boundary="BOUNDARY"');    
            } else if (diffOnly) {
                res.setHeader('Content-Type', 'plain/text');
            } else {
                res.setHeader('Content-Type', 'application/json')
            }
            
            res.setHeader('Content-Length', body.length);
            return res.end(body);
        }
    })
}

function getDiffBetweenIndexAndHead(workspaceDir, fileRoot, req, res, next, rest, diffOnly, uriOnly) {
    var repoPath = rest.replace("diff/Cached/file/", "");
    var filePath = repoPath.substring(repoPath.indexOf("/")+1);
    repoPath = repoPath.substring(0, repoPath.indexOf("/"));
    var fileDir = repoPath;
    repoPath = api.join(workspaceDir, repoPath);
    var body = "";

    var repo;

    git.Repository.open(repoPath)
    .then(function(r) {
    	repo = r;
        return repo.head()
    })
    .then(function(ref) {
    	return repo.getReferenceCommit(ref)
    })
	.then(function(commit) {
		return commit.getTree()
	})
    .then(function(tree) {
        return git.Diff.treeToWorkdir(repo, tree, null);
    })
    .then(function(diff) {
        processDiff(diff, filePath, fileDir, res, diffOnly, uriOnly);
    }) 
}

function getDiffBetweenTwoCommits(workspaceDir, fileRoot, req, res, next, rest, diffOnly, uriOnly) {
}

module.exports = {
	getDiffBetweenWorkingTreeAndHead: getDiffBetweenWorkingTreeAndHead,
    getDiffBetweenIndexAndHead: getDiffBetweenIndexAndHead,
    getDiffBetweenTwoCommits: getDiffBetweenTwoCommits
};
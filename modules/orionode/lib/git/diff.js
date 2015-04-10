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

function getDiffBetweenWorkingTreeAndHead(workspaceDir, fileRoot, req, res, next, rest) {
	var repoPath = rest.replace("diff/Default/file/", "");
    var fileDir = repoPath;
    repoPath = api.join(workspaceDir, repoPath);
    var body = "";
    git.Repository.open(repoPath)
    .then(function(repo) {
        return git.Diff.indexToWorkdir(repo, null, null);
    })
    .then(function(diff) {
        var patches = diff.patches();


        patches.forEach(function(patch) {

            var oldFile = patch.oldFile();
            var newFile = patch.newFile();
            body += "diff --git a/" + oldFile.path() + " b/" + newFile.path() + "\n";
            body += "index " + oldFile.id().toString().substring(0, 7) + ".." + newFile.id().toString().substring(0, 7) + " " + newFile.mode().toString(8) + "\n";
            body += "--- a/" + oldFile.path() + "\n";
            body += "+++ b/" + newFile.path() + "\n"; 
            
            var hunks = patch.hunks();

            hunks.forEach(function(hunk, i) {

                body += hunk.header() + "\n"

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

                    body += prefix + line.content().split("\n")[0] + "\n";
                })
            })
        })

        console.log(body)
    })
}

module.exports = {
	getDiffBetweenWorkingTreeAndHead: getDiffBetweenWorkingTreeAndHead
};
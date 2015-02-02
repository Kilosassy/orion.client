/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env node, mocha*/
var assert = require("assert");
var mocha = require("mocha");
var request = require("supertest");
var clone = require("nodegit").Clone.clone;
var Commit = require("nodegit").Commit;

var fs = require("fs");

var clone_dir = "test/support/repo/";


describe("nodegit", function() {
	// Clone a given repository into a tmp folder.
	describe("clone", function(){
		this.timeout(0);
		it("can clone with http", function() {
		    var url = "http://github.com/nodegit/test.git";
		    var opts = { ignoreCertErrors: 1 };
		    return clone(url, clone_dir, opts).then(function(repository) {
		    	var data = fs.readFileSync(clone_dir + ".git/config");
		    	assert.notEqual(data, undefined);
		    	assert.notEqual(data, null);
		    });
		});
	});
/*
	describe("commit", function() {
		this.timeout(0);
		it("can commit to the repo", function() {
			var foo = fs.writeFileSync(clone_dir + "foo.txt", "hello foo!");
			var repo;
			var index;
			var oid;

			return nodegit.Repository.open(clone_dir + ".git")
			.then(function(repoResult) {
			  repo = repoResult;
			  return fse.ensureDir(path.join(repo.workdir(), directoryName));
			}).then(function(){
			  return fse.writeFile(path.join(repo.workdir(), fileName), fileContent);
			})
			.then(function() {
			  return fse.writeFile(
			    path.join(repo.workdir(), directoryName, fileName),
			    fileContent
			  );
			})
			.then(function() {
			  return repo.openIndex();
			})
			.then(function(indexResult) {
			  index = indexResult;
			  return index.read(1);
			})
			.then(function() {
			  return index.addByPath(fileName);
			})
			.then(function() {
			  return index.addByPath(path.join(directoryName, fileName));
			})
			.then(function() {
			  return index.write();
			})
			.then(function() {
			  return index.writeTree();
			})
			.then(function(oidResult) {
			  oid = oidResult;
			  return nodegit.Reference.nameToId(repo, "HEAD");
			})
			.then(function(head) {
			  return repo.getCommit(head);
			})
			.then(function(parent) {
			  var author = nodegit.Signature.create("Scott Chacon",
			    "schacon@gmail.com", 123456789, 60);
			  var committer = nodegit.Signature.create("Scott A Chacon",
			    "scott@github.com", 987654321, 90);

			  return repo.createCommit("HEAD", author, committer, "message", oid, [parent]);
			})
			.done(function(commitId) {
			  console.log("New Commit: ", commitId);
			});
		});
	});
*/
});

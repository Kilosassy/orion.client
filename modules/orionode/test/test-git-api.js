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
var assert = require('assert');
var path = require('path');
var testData = require('./support/test_data');
var git = require('nodegit');
var fs = require('fs');
var rmdir = require('rimraf');

var CONTEXT_PATH = '/orionn';
var PREFIX = CONTEXT_PATH + '/workspace', PREFIX_FILE = CONTEXT_PATH + '/file';
var WORKSPACE = path.join(__dirname, '.test_workspace');
var DEFAULT_WORKSPACE_NAME = 'Orionode Workspace';

var app = testData.createApp()
		.use(CONTEXT_PATH, require('../lib/workspace')({
			root: '/workspace',
			fileRoot: '/file',
			workspaceDir: WORKSPACE
		}))
		.use(CONTEXT_PATH, require('../lib/file')({
			root: '/file',
			workspaceRoot: '/workspace',
			workspaceDir: WORKSPACE
		}))
		.use(CONTEXT_PATH, require('../lib/git')({
			root: '/gitapi',
			fileRoot: '/file',
			workspaceDir: WORKSPACE
		}));

var TEST_REPO_NAME = 'test';
var repoPath = path.join(WORKSPACE, TEST_REPO_NAME);

function byName(a, b) {
	return String.prototype.localeCompare(a.Name, b.Name);
}

// Retrieves the 0th Workspace in the list and invoke the callback
function withDefaultWorkspace(callback) {
	app.request()
	.get(PREFIX)
	.end(function(err, res) {
		assert.ifError(err);
		callback(res.body.Workspaces[0]);
	});
}

/**
 * see http://wiki.eclipse.org/Orion/Server_API/Workspace_API
 */
describe('Git API', function(done) {
	before(function(done) { // testData.setUp.bind(null, parentDir)
		testData.setUp(WORKSPACE, done);
	});

	describe('Creates a new directory and init repository', function() {
		it('GET clone (initializes a git repo)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/clone/")
			.send({
				"Name":  TEST_REPO_NAME,
				"Location": PREFIX
			})
			.expect(201)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Location, "/gitapi/clone/file/" + TEST_REPO_NAME)
				finished();
			})
		});

		it('Check the directory was made', function() {
			var stat = fs.statSync(repoPath);
			assert(stat.isDirectory());
		})

		it('Check nodegit that the repo was initialized', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return repo.getReferenceCommit("HEAD");
			})
			.then(function(commit) {
				assert(commit.message(), "Initial commit")
			})
			.catch(function(err) {
				assert.ifError(err);
			})
			.done(function() {
				finished();
			})
		})
	});

	describe('Creating and adding a new file', function() {
		var filename = "test.txt"
		var filecontent = "hello world!"

		before(function(done) {
			fs.writeFile(path.join(repoPath, filename), filecontent, function (err) {
				done(err);
			});
		})

		it('PUT index (staging a file)', function(finished) {
			app.request()
			.put(CONTEXT_PATH + "/gitapi/index/file/" + TEST_REPO_NAME + "/" + filename)
			.expect(200)
			.end(function(err, res) {
				finished();
			})
		})

		it('GET status (check status for git repo)', function(finished) {
			app.request()
			.get(CONTEXT_PATH + "/gitapi/status/file/"+ TEST_REPO_NAME + "/")
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Added[0].Name, filename);
				finished();
			})
		})
	});

	describe('Committing an added file', function() {
		var message = "Test commit!"
		var author = "test"
		var authorEmail = "test@test.com"
		var committer = "test"
		var committerEmail = "test@test.com"

		it('POST commit (committing all files in the index)', function(finished) {
			app.request()
			.post(CONTEXT_PATH + "/gitapi/commit/HEAD/file/" + TEST_REPO_NAME)
			.send({
				Message: message,
				AuthorName: author,
				AuthorEmail: authorEmail,
				CommitterName: committer,
				CommitterEmail: committerEmail
			})
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.AuthorEmail, authorEmail);
				assert.equal(res.body.CommitterEmail, committerEmail);
				assert.equal(res.body.Message, message);
				assert.equal(res.body.Diffs[0].ChangeType, "ADDED");
				finished();
			})
		});

		it('GET commit (listing commits revision)', function(finished) {
			app.request()
			.get(CONTEXT_PATH + '/gitapi/commit/master..master/file/' + TEST_REPO_NAME)
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				assert.equal(res.body.Children[0].Message, message);
				finished();
			})
		});

		it('Check nodegit for commits', function(finished) {
			git.Repository.open(repoPath)
			.then(function(repo) {
				return repo.getReferenceCommit("HEAD");
			})
			.then(function(commit) {
				assert(commit.message(), message);
			})
			.catch(function(err) {
				assert.ifError(err);
			})
			.done(function() {
				finished();
			});
		});
	});

	describe('Removing a repository', function() {
		it('DELETE clone (delete a repository)', function(finished) {
			app.request()
			.delete(CONTEXT_PATH + "/gitapi/clone/file/" + TEST_REPO_NAME)
			.expect(200)
			.end(finished);
		});
	});
});
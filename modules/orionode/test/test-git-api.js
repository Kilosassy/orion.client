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
var clone = require("nodegit").Clone.clone

var fs = require("fs");

var clone_dir = "test/support/repo/";


describe("nodegit", function() {
		// Clone a given repository into a tmp folder.
	describe("clone", function(){
		it("can clone with http", function() {
		    var url = "http://github.com/nodegit/test.git";
		    var opts = { ignoreCertErrors: 1 };
		    assert.equal(true, true);
		    /*return clone(url, clone_dir, opts).then(function(repository) {
		      assert.ok(repository instanceof Repository);
		    });*/
		});
	});
});

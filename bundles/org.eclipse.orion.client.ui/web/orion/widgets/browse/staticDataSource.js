/*******************************************************************************
 *
 * @license
 * Copyright (c) 2010, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License v1.0
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html).
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
define([
	'orion/Deferred',
	"orion/editor/textStyler", 
	"orion/editor/stylers/application_javascript/syntax",
	"orion/editor/stylers/text_css/syntax",
	"orion/editor/stylers/text_html/syntax",
	"orion/editor/stylers/application_json/syntax",
	"orion/editor/stylers/text_x-php/syntax",
	"orion/editor/stylers/text_x-python/syntax",
	"orion/editor/stylers/text_x-ruby/syntax",
	"orion/editor/stylers/text_x-go/syntax",
	"orion/editor/stylers/text_x-objective-c/syntax",
	"orion/editor/stylers/text_x-swift/syntax",
	'orion/editor/stylers/application_x-ejs/syntax',
	'orion/editor/stylers/application_xml/syntax',
	'orion/editor/stylers/text_x-yaml/syntax',
], function(Deferred, mStyler, mJS, mCss, mHtml, mJson, mPhp, mPython, mRuby, mGo, mObjectiveC, mSwift, mEJS, mXml, mYaml) {
	var ContentTypes = [{	id: "text/plain",
			name: "Text",
			extension: ["txt"],
			imageClass: "file-sprite-text modelDecorationSprite"
		},
		{	id: "application/javascript",
			"extends": "text/plain",
			name: "JavaScript",
			extension: ["js"],
			imageClass: "file-sprite-javascript modelDecorationSprite"
		},
		{	id: "text/html",
			"extends": "text/plain",
			name: "HTML",
			extension: ["html", "htm"],
			imageClass: "file-sprite-html modelDecorationSprite"
		},
		{	id: "text/css",
			"extends": "text/plain",
			name: "CSS",
			extension: ["css"],
			imageClass: "file-sprite-css modelDecorationSprite"
		},
		{	id: "application/json",
			"extends": "text/plain",
			name: "JSON",
			extension: ["json"],
			imageClass: "file-sprite-text modelDecorationSprite"
		},
		{	id: "application/xml",
			"extends": "text/plain",
			name: "XML",
			extension: ["xml"],
			imageClass: "file-sprite-xml modelDecorationSprite"
		},
		{	id: "application/x-ejs",
			"extends": "text/plain",
			name: "Embedded Javascript",
			extension: ["ejs"],
			imageClass: "file-sprite-javascript modelDecorationSprite"
		},
		{	id: "text/x-java-source",
			"extends": "text/plain",
			name: "Java",
			extension: ["java"]
		},
		{	id: "text/x-python",
			"extends": "text/plain",
			name: "Python",
			extension: ["py", "rpy", "pyw", "cpy", "SConstruct", "Sconstruct", "sconstruct", "SConscript", "gyp", "gypi"]
		},
		{	id: "text/x-ruby",
			"extends": "text/plain",
			name: "Ruby",
			extension: ["rb", "rbx", "rjs", "Rakefile", "rake", "cgi", "fcgi", "gemspec", "irbrc", "capfile", "ru", "prawn", "Gemfile", "Guardfile", "Vagrantfile", "Appraisals", "Rantfile"]
		},
		{	id: "text/x-go",
			name: "Go",
			extension: ["go"],
			"extends": "text/plain"
		},
		{	id: "text/x-objective-c",
			"extends": "text/plain",
			name: "Objective-C",
			extension: ["m", "mm", "h"]
		},
		{	id: "text/x-php",
			"extends": "text/plain",
			name: "PHP",
			extension: ["php", "php3", "php4", "php5", "phpt", "phtml", "aw", "ctp"]
		},
		{	id: "text/x-swift",
			"extends": "text/plain",
			name: "Swift",
			extension: ["swift"]
		},
		{	id: "text/x-markdown",
			"extends": "text/plain",
			name: "Markdown",
			extension: ["md"]
		},
		{	id: "text/x-yaml",
			"extends": "text/plain",
			name: "YAML",
			extension: ["yaml", "yml"]
		},
		{	id: "text/conf",
			"extends": "text/plain",
			name: "Conf",
			extension: ["conf"]
		},
		{	id: "text/sh",
			"extends": "text/plain",
			name: "sh",
			extension: ["sh"]
		},
		{	id: "application/browser-renderable",
			name: "browser-renderable"
		},
		{	id: "application/pdf",
			"extends": "application/browser-renderable",
			name: "PDF",
			extension: ["pdf"]
		},
		{	id: "application/octet-stream",
			name: "octet-stream",
			extension: ["exe", "bin", "doc", "ppt"]
		},
		{	id: "application/zip",
			"extends": "application/octet-stream",
			name: "ZIP",
			extension: ["war", "jar", "zip", "rar"]
		},
		// Image types
		{	id: "image/gif",
			name: "GIF",
			extension: ["gif"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/jpeg",
			name: "JPG",
			extension: ["jpg", "jpeg", "jpe"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/ico",
			name: "ICO",
			extension: ["ico"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/png",
			name: "PNG",
			extension: ["png"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/tiff",
			name: "TIFF",
			extension: ["tif", "tiff"],
			imageClass: "file-sprite-image modelDecorationSprite"
		},
		{	id: "image/svg",
			name: "SVG",
			extension: ["svg"],
			imageClass: "file-sprite-image modelDecorationSprite"
	}];
	
	function SyntaxHighlighter() {
		this.styler = null;
	}
	
	SyntaxHighlighter.prototype = {
		setup: function(fileContentType, textView, annotationModel, fileName, allowAsync) {
			if (this.styler) {
				if (this.styler.destroy) {
					this.styler.destroy();
				}
				this.styler = null;
			}
			return this._highlight(fileContentType, textView, annotationModel);
		},
		highlight: function(fileName, contentType, editor) {
			var textView = editor.getTextView();
			var annotationModel = editor.getAnnotationModel();
			return this._highlight(contentType, textView, annotationModel);
		},
		_highlight: function(fileContentType, textView, annotationModel) {
			if (this.styler) {
				this.styler.destroy();
				this.styler = null;
			}
			var stylerAdapter = null;
			if (fileContentType) {
				switch(fileContentType.id) {
					case "application/javascript": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mJS.grammars, "orion.js", fileContentType.id); //$NON-NLS-0$
						break;
					case "application/x-ejs": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mEJS.grammars, "orion.ejs", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/css": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mCss.grammars, "orion.css", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/html": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mHtml.grammars, "orion.html", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-java-source": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mJS.grammars, "orion.java", fileContentType.id); //$NON-NLS-0$
						break;
					case "application/json": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mJson.grammars, "orion.json", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-python": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mPython.grammars, "orion.python", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-ruby": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mRuby.grammars, "orion.ruby", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-go": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mGo.grammars, "orion.go", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-objective-c": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mObjectiveC.grammars, "orion.objectiveC", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-php": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mPhp.grammars, "orion.php", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-swift": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mSwift.grammars, "orion.swift", fileContentType.id); //$NON-NLS-0$
						break;
					case "application/xml": //$NON-NLS-0$
					case "application/xhtml+xml": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mXml.grammars, "orion.xml", fileContentType.id); //$NON-NLS-0$
						break;
					case "text/x-yaml": //$NON-NLS-0$
						stylerAdapter = new mStyler.createPatternBasedAdapter(mYaml.grammars, "orion.yaml", fileContentType.id); //$NON-NLS-0$
						break;
				}
			}
			if(stylerAdapter) {
				this.styler = new mStyler.TextStyler(textView, annotationModel, stylerAdapter);
			}
			return new Deferred().resolve();
		},
		getStyler: function() {
			return this.styler;
		}
	};
	
	return {ContentTypes: ContentTypes,
			SyntaxHighlighter: SyntaxHighlighter};
});

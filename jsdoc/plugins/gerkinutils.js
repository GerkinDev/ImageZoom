const beautify = require('js-beautify').js_beautify;
const logger = require('jsdoc/util/logger');

var _filecontent, _filename, snippets;

exports.handlers = {
	beforeParse: function(event){
		_filecontent = event.source;
		_filename = event.filename;
		snippets = {};
	},
	parseComplete: function(event){
		for(var i in event.doclets){
			var doclet = event.doclets[i];
			if(doclet.description && doclet.description.indexOf("{@snippet ") > -1){
				doclet.description = doclet.description.replace(/{@snippet\s+(\w+?)(?:\s+(.*?))?}/g, function(matched, snippetCode, label){
					if(snippets[snippetCode]){
						return '<pre style="line-height: 1.25em;font-size: 0.9em;margin-top: 5px;border-left: 2px solid #eee;padding-left: 15px;margin-left: 10px;"">'+snippets[snippetCode].content.replace(new RegExp(doclet.name,"g"), '<span style="color: red">'+doclet.name+'</span>')+"</pre>";
					} else {
						logger.error('Reference to inexistant snippet "'+snippetCode+'"');
						return "";
					}
				});
			}
		}
	}
}


exports.defineTags = function(dictionary) {
	dictionary.defineTag("label",{
		mustHaveValue:true,
		onTagged: function(doclet, tag){
		}
	});
	dictionary.defineTag("snippet",{
		mustHaveValue:true,
		onTagged: function(doclet, tag){
			doclet["snippet"] = tag.value;
		}
	});
	dictionary.defineTag("snippetStart",{
		mustHaveValue:true,
		onTagged: function(doclet, tag){
			if(snippets[doclet.value] != null){
				logger.error('Redefinition of snippet name "'+doclet.value+'"');
			} else {
				snippets[tag.value] = {start:doclet.meta.range[1]};
			}
		}
	});
	dictionary.defineTag("snippetEnd",{
		mustHaveValue:true,
		onTagged: function(doclet, tag){
			if(snippets[tag.value] == null){
				logger.error('End of snippet name "'+doclet.value+'" found before its beginning. Did you forget the "@snippetStart '+doclet.value+'" doclet?');
			} else {
				snippets[tag.value].end = doclet.meta.range[0]
				var innerSnippet = beautify(
					_filecontent.slice(snippets[tag.value].start, snippets[tag.value].end), {
						indent_size: 4
					}
				);
				snippets[tag.value].content = innerSnippet;
			}
		}
	});
};
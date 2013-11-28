var os = require('os');
var path = require('path');
var fs = require('fs');
var builder = require('xmlbuilder');


var NUnitReporter = function(baseReporterDecorator, config, emitter, logger, helper, formatError) {
  var outputFile = path.resolve(config.basePath, config.nunitReporter.outputFile);
  var suiteName = config.nunitReporter.suiteName || 'unit';
  var log = logger.create('reporter.nunit');
  
  var xml;
  var testBrowsers;
  var allMessages = [];
  var pendingFileWritings = 0;
  var fileWritingFinished = function(){};
  var xmlTestsTotal = 0;
  var xmlTestsFailures = 0;
  var xmlTestsErrors = 0;
  var xmlTestsNotRun = 0;

  baseReporterDecorator(this);

  this.adapters = [function(msg) {
    allMessages.push(msg);
  }];

  this.onRunStart = function(browsers) {
    testBrowsers = {};
    xml = builder
    .create('test-results', {'version': '1.0', 'encoding': 'UTF-8'})
    .att('name', 'Javascript Specs');

    var testBrowser;
    browsers.forEach(function(browser) {
      testBrowser = testBrowsers[browser.id] = xml.ele('test-suite', {
        name: browser.name, 'type': suiteName, /*timestamp: timestamp,*/ id: 0, hostname: os.hostname()
      });
      testBrowser.suites = [];
      testBrowser.results = testBrowser.ele('results');
    });
  };
  this.onBrowserComplete = function(browser) {
    var suite = testBrowsers[browser.id];
    var result = browser.lastResult;

    suite.att('executed', 'True');
    suite.att('result', result.failed ==! 0 ? 'Failure' : 'Success');
    suite.att('success', result.failed === 0 ? 'True' : 'False');
    suite.att('failures', result.failed);
    suite.att('time', (result.netTime || 0) / 1000);

    suite.ele('system-out').dat(allMessages.join() + '\n');
    suite.ele('system-err');
	
	xmlTestsTotal += result.total;
	xmlTestsFailures += result.failed;
  };

  this.specSuccess = this.specSkipped = this.specFailure = function(browser, result) {
  	var currentLevel = testBrowsers[browser.id];
  	result.suite.forEach(function(suite) {
  		var id = suite + 'id';
  		if (currentLevel.suites[id]) {
  			currentLevel = currentLevel.suites[id];
  			return;
  		}
  		currentLevel.suites[id] = currentLevel.ele('test-suite', {name: suite});
  		currentLevel = currentLevel.suites[id];
  		currentLevel.suites = [];
  		currentLevel.results = currentLevel.ele('results');
  	});
    var spec = currentLevel.results.ele('test-case', {
      name: result.description,
      time: ((result.time || 0) / 1000),
      description: result.suite.join(' ').replace(/\./g, '_'),
      executed: 'True',
      result: result.skipped? 'Ignored': result.success? 'Success': 'Failure',
	  success: result.success? 'True': 'False'
    });

    if (!result.success) {
      result.log.forEach(function(err) {
        spec.ele('failure').ele('message', formatError(err));
      });
    }
  };

  this.onRunComplete = function() {
	xml.att('total', xmlTestsTotal);
	xml.att('failures', xmlTestsFailures);
	xml.att('errors', xmlTestsErrors);
	xml.att('not-run', xmlTestsNotRun);
    var xmlToOutput = xml;

    pendingFileWritings++;
    helper.mkdirIfNotExists(path.dirname(outputFile), function() {
      fs.writeFile(outputFile, xmlToOutput.end({pretty: true}), function(err) {
        if (err) {
          log.warn('Cannot write NUnit xml\n\t' + err.message);
        } else {
          log.debug('NUnit results written to "%s".', path.resolve(outputFile));
        }

        if (!--pendingFileWritings) {
          fileWritingFinished();
        }
      });
    });

    testBrowsers = xml = null;
    allMessages.length = 0;
  };

  // TODO(vojta): move to onExit
  // wait for writing all the xml files, before exiting
  emitter.on('exit', function(done) {
    if (pendingFileWritings) {
      fileWritingFinished = done;
    } else {
      done();
    }
  });

};

NUnitReporter.$inject = ['baseReporterDecorator', 'config', 'emitter', 'logger',
  'helper', 'formatError'
];

module.exports = {
  'reporter:nunit': ['type', NUnitReporter]
};

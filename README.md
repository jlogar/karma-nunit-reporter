# NOT MAINTAINED ANYMORE

You really should use https://github.com/martinmcwhorter/karma-nunit2-reporter

# karma-nunit-reporter

Reporter for the NUnit XML format. A direct port from karma-junit-reporter.

## Installation

The easiest way is to keep `karma-nunit-reporter` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "karma": "~0.10",
    "karma-nunit-reporter": "*"
  }
}
```

You can simple do it by:
```bash
npm install karma-nunit-reporter --save-dev
```

## Configuration
```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    reporters: ['progress', 'nunit'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-nunit-reporter'
            ],


    // the default configuration
    nunitReporter: {
      outputFile: 'test-results.xml',
      suite: ''
    }
  });
};
```

You can pass the list of reporters as a CLI argument too:
```bash
karma start --reporters nunit,dots
```

----

For more information on Karma see the [homepage].


[homepage]: http://karma-runner.github.com

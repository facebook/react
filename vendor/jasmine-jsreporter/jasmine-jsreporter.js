/*
  This file is part of the Jasmine JSReporter project from Ivan De Marino.

  Copyright (C) 2011 Ivan De Marino (aka detro, aka detronizator), http://blog.ivandemarino.me, ivan.de.marino@gmail.com

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL IVAN DE MARINO BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    // Ensure that Jasmine library is loaded first
    if (typeof jasmine === "undefined") {
        throw new Error("[Jasmine JSReporter] 'Jasmine' library not found");
    }

    /**
     * Calculate elapsed time, in Seconds.
     * @param startMs Start time in Milliseconds
     * @param finishMs Finish time in Milliseconds
     * @return Elapsed time in Seconds */
    function elapsedSec (startMs, finishMs) {
        return (finishMs - startMs) / 1000;
    }

    /**
     * Round an amount to the given number of Digits.
     * If no number of digits is given, than '2' is assumed.
     * @param amount Amount to round
     * @param numOfDecDigits Number of Digits to round to. Default value is '2'.
     * @return Rounded amount */
    function round (amount, numOfDecDigits) {
        numOfDecDigits = numOfDecDigits || 2;
        return Math.round(amount * Math.pow(10, numOfDecDigits)) / Math.pow(10, numOfDecDigits);
    }

    /**
     * Collect information about a Suite, recursively, and return a JSON result.
     * @param suite The Jasmine Suite to get data from
     */
    function getSuiteData (suite) {
        var suiteData = {
                description : suite.description,
                durationSec : 0,
                specs: [],
                suites: [],
                passed: true
            },
            specs = suite.specs(),
            suites = suite.suites(),
            i, ilen;

        // Loop over all the Suite's Specs
        for (i = 0, ilen = specs.length; i < ilen; ++i) {
            suiteData.specs[i] = {
                description : specs[i].description,
                durationSec : specs[i].durationSec,
                passed : specs[i].results().passedCount === specs[i].results().totalCount,
                skipped : specs[i].results().skipped,
                passedCount : specs[i].results().passedCount,
                failedCount : specs[i].results().failedCount,
                totalCount : specs[i].results().totalCount
            };
            suiteData.passed = !suiteData.specs[i].passed ? false : suiteData.passed;
            suiteData.durationSec += suiteData.specs[i].durationSec;
        }

        // Loop over all the Suite's sub-Suites
        for (i = 0, ilen = suites.length; i < ilen; ++i) {
            suiteData.suites[i] = getSuiteData(suites[i]); //< recursive population
            suiteData.passed = !suiteData.suites[i].passed ? false : suiteData.passed;
            suiteData.durationSec += suiteData.suites[i].durationSec;
        }

        // Rounding duration numbers to 3 decimal digits
        suiteData.durationSec = round(suiteData.durationSec, 4);

        return suiteData;
    }

    var JSReporter =  function () {
    };

    JSReporter.prototype = {
        reportRunnerStarting: function (runner) {
            // Nothing to do
        },

        reportSpecStarting: function (spec) {
            // Start timing this spec
            spec.startedAt = new Date();
        },

        reportSpecResults: function (spec) {
            // Finish timing this spec and calculate duration/delta (in sec)
            spec.finishedAt = new Date();
            // If the spec was skipped, reportSpecStarting is never called and spec.startedAt is undefined
            spec.durationSec = spec.startedAt ? elapsedSec(spec.startedAt.getTime(), spec.finishedAt.getTime()) : 0;
        },

        reportSuiteResults: function (suite) {
            // Nothing to do
        },

        reportRunnerResults: function (runner) {
            var suites = runner.suites(),
                i, ilen;

            // Attach results to the "jasmine" object to make those results easy to scrap/find
            jasmine.runnerResults = {
                suites: [],
                durationSec : 0,
                passed : true
            };

            // Loop over all the Suites
            for (i = 0, ilen = suites.length; i < ilen; ++i) {
                if (suites[i].parentSuite === null) {
                    jasmine.runnerResults.suites[i] = getSuiteData(suites[i]);
                    // If 1 suite fails, the whole runner fails
                    jasmine.runnerResults.passed = !jasmine.runnerResults.suites[i].passed ? false : jasmine.runnerResults.passed;
                    // Add up all the durations
                    jasmine.runnerResults.durationSec += jasmine.runnerResults.suites[i].durationSec;
                }
            }

            // Decorate the 'jasmine' object with getters
            jasmine.getJSReport = function () {
                if (jasmine.runnerResults) {
                    return jasmine.runnerResults;
                }
                return null;
            };
            jasmine.getJSReportAsString = function () {
                return JSON.stringify(jasmine.getJSReport());
            };
        }
    };

    // export public
    jasmine.JSReporter = JSReporter;
})();


// based on https://github.com/slashdotdash/jekyll-lunr-js-search
// refactored to remove jquery, uri and dateformat dependency

var lunrSearch = (function() {

    function forEach(o, iter, ctx) {
        for(var k in o) {
            iter.call(ctx, o[k], k)
        }
    }

    function getJSON(url, cb) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function (ev) {
            if (xhr.readyState === 4) {
                var data = JSON.parse(ev.target.response);
                cb(null, data);
            }
        };

        xhr.open("GET", url, true);
        xhr.send(null);
    }

    function extend(obj) {
        forEach(Array.prototype.slice.call(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    }

    function map(o, iter, ctx) {
        var result = [];

        forEach(o, function (v, k) {
            result.push(iter(v, k));
        }, ctx);

        return result;
    }

    var debounce = function(fn) {
        var timeout;
        var slice = Array.prototype.slice;

        return function() {
            var args = slice.call(arguments),
                ctx = this;

            clearTimeout(timeout);

            timeout = setTimeout(function () {
                fn.apply(ctx, args);
            }, 100);
        };
    };

    function queryString() {
        var pairs = location.search.slice(1).split('&');

        var result = {};
        forEach(pairs, function(pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        return JSON.parse(JSON.stringify(result));
    }

    var getFirst = function(selector, root) {
        var r = (root || document).querySelectorAll(selector);
        return r && r[0];
    }

    var LunrSearch = (function() {
        function LunrSearch(elem, options) {
            this.$elem = getFirst(elem);
            this.$results = getFirst(options.results);
            this.$entries = getFirst(options.entries, this.$results);
            this.indexDataUrl = options.indexUrl;
            this.index = this.createIndex();
            this.template = this.compileTemplate(getFirst(options.template));
            this.$elem.focus();
            this.initialize();
        }

        LunrSearch.prototype.initialize = function() {
            var self = this;

            this.loadIndexData(function(err, data) {
                self.populateIndex(data);
                self.populateSearchFromQuery();
                self.bindKeypress();
            });
        };

        // create lunr.js search index specifying that we want to index the title and body fields of documents.
        LunrSearch.prototype.createIndex = function() {
            return lunr(function() {
                this.field('title', { boost: 10 });
                this.field('body');
                this.ref('id');
            });
        };

        // compile search results template
        LunrSearch.prototype.compileTemplate = function($template) {
            var template = $template.innerHTML;
            Mustache.parse(template);
            return function (view, partials) {
                return Mustache.render(template, view, partials);
            };
        };

        // load the search index data
        LunrSearch.prototype.loadIndexData = function(callback) {
            getJSON(this.indexDataUrl, callback);
        };

        LunrSearch.prototype.populateIndex = function(data) {
            var index = this.index;

            // format the raw json into a form that is simpler to work with
            this.entries = map(data.entries, this.createEntry);
            var entryMap = this.entryMap = {};

            forEach(this.entries, function(entry) {
                index.add(entry);
                entryMap[entry.id] = entry;
            });
        };

        LunrSearch.prototype.createEntry = function(raw, index) {
            var entry = extend({
                id: parseInt(index + 1,10)
            }, raw);

            return entry;
        };

        LunrSearch.prototype.bindKeypress = function() {
            var self = this;
            var oldValue = this.$elem.value;

            this.$elem.addEventListener('keyup', debounce(function() {
                var newValue = self.$elem.value;
                if (newValue !== oldValue) {
                    self.search(newValue);
                }

                oldValue = newValue;
            }));
        };

        LunrSearch.prototype.search = function(query) {
            var entryLookup = function(result) {
                return this.entryMap[parseInt(result.ref, 10)];
            }.bind(this);

            if (query.length < 2) {
                this.$results.style.display = 'none';
                this.$entries.innerHTML = '';
            } else {
                var results = map(this.index.search(query), entryLookup);
                this.displayResults(results);
            }
        };

        LunrSearch.prototype.displayResults = function(entries) {
            var $entries = this.$entries,
                $results = this.$results;

            $entries.innerHTML = '';

            if (entries.length === 0) {
                $entries.innerHTML = '<p>Nothing found.</p>';
            } else {
                $entries.innerHTML = this.template({entries: entries});
            }

            $results.style.display = '';
        };

        // Populate the search input with 'q' querystring parameter if set
        LunrSearch.prototype.populateSearchFromQuery = function() {

            var qs = queryString();

            if (qs.hasOwnProperty('q')) {
                var clean = qs.q.toString().replace(/[_+]+/, ' ');
                this.$elem.value = clean;
                this.search(clean);
            }
        };

        return LunrSearch;
    })();

    var defaults = {
        indexUrl  : '/search.json',     // Url for the .json file containing search index source data (containing: title, url, date, body)
        results   : '#search-results',  // selector for containing search results element
        entries   : '.entries',         // selector for search entries containing element (contained within results above)
        template  : '#search-results-template'  // selector for Mustache.js template
    };

    return function(el, options) {
        // apply default options
        options = extend({}, defaults, options);

        // create search object
        new LunrSearch(el, options);

        return this;
    };

})();
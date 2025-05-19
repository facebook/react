const logDownloadItem = require("./download-policies-helpers").logDownloadItem;
var downloadPolicies = require("./download-policies-helpers").downloadPolicies;
var downloadItems = require("./download-policies-helpers").downloadItems;
var setDownloadPolicies = require("./download-policies-helpers").setDownloadPolicies;

const regexMatch = (regex, string) => regex.exec(string) != null;

const youShallNotPass = {
    name: 'YouShallNotPass',
    desc: 'You shall not pass!',
    owner: 'gandalf',
    oncall: 'white_council',
    check: item => {
        let filePath = item.filename.toLowerCase();
        let balrog = /balrog/i;
        return regexMatch(balrog, filePath);
    },
};
downloadPolicies = [
    youShallNotPass
];
setDownloadPolicies(downloadPolicies);

jest.mock('./utils');
const sendLog = require('./utils').sendLog;
sendLog.mockImplementation((log_type, logs, protego_version) => {
    return {then: ()=>{}}
});

jest.mock('./utils');
const prepareDownloadItem = require('./utils').prepareDownloadItem;
prepareDownloadItem.mockImplementation((action, downloadItem) => {});

jest.mock('./background-helpers');
const displayDownloadWarning = require('./background-helpers').displayDownloadWarning;
displayDownloadWarning.mockImplementation((downloadItem) => {});

test('logDownloadItem fires signal', () =>{
    // triggered by 'balrog', should show warning
    const balrog = {
        id: 1,
        filename: {current: 'balrog.jpg'},
        finalUrl: {current: 'http://example.com/balrog.jpg'},
        state: {current : 'complete'},
    };
    downloadItems[balrog.id] = {...balrog};
    logDownloadItem(balrog);
    expect(sendLog.mock.calls.length).toBe(1); // +1, means logs have been sent
    expect(displayDownloadWarning.mock.calls.length).toBe(1); // +1, means warning has been shown

    // not triggered by 'balrog', shouldn't show warning
    const goblin = {
        id: 2,
        filename: {current: 'goblin.jpg'},
        finalUrl: {current: 'http://example.com/goblin.jpg'},
        state: {current : 'complete'},
    };
    downloadItems[goblin.id] = {...goblin};
    logDownloadItem(goblin);
    expect(sendLog.mock.calls.length).toBe(2); // +1, means logs have been sent
    expect(displayDownloadWarning.mock.calls.length).toBe(1); // +0, means warning hasn't been shown

    // would be triggered by 'balrog', but non-http url
    // thus, shouldn't show warning
    const barlog_base64 = {
        id: 3,
        filename: {current: 'balrog.jpg'},
        // a small green rectangle in png format 8)
        finalUrl: {current: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAmCAYAAACyAQkgAAABXWlDQ1BJQ0MgUHJvZmlsZQAAKJF1kL1Lw1AUxU+0UmlFOzg4dMiqRCm1iC5C7aCCYGitX4OSpjEV0vSRRERwFGcn/wHFzVHqoKCDm5tgUbq5OLiI0EXL875WTat44XJ/HM673HeAjm6NMSsAoGh7Tnp6Sl5eWZWDz5DQhwjGEdJ0lyVVdY4s+J7tVbsnN9XdsNh1o+2vvYbnj6TqxUN0T5n562+rUN5wdZof1DGdOR4gKcTqtscE7xL3O3QU8YFgs8nHgnNNPm94FtIp4lviiF7Q8sRVYiXXopstXLS29K8bxPU9hp3NiD3UUSSRQZZaxiJUxCmH7D/+RMOfQgkMO3CwCRMFePQySQqDBYN4FjZ0jEAhjiNGnRA5/87P16xLYOIU6Jz0tfUn4MwEegd8bWiMvvICXFeY5mg/qUq1gLsxGm9yuAx0HXL+tgQEB4F6hfP3Muf1E9r/CFzVPgFxPGOrommImAAAAIplWElmTU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAIdpAAQAAAABAAAATgAAAAAAAACQAAAAAQAAAJAAAAABAAOShgAHAAAAEgAAAHigAgAEAAAAAQAAACqgAwAEAAAAAQAAACYAAAAAQVNDSUkAAABTY3JlZW5zaG90I72mEgAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAdRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+Mzg8L2V4aWY6UGl4ZWxZRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NDI8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpVc2VyQ29tbWVudD5TY3JlZW5zaG90PC9leGlmOlVzZXJDb21tZW50PgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4K6jtP5wAAABxpRE9UAAAAAgAAAAAAAAATAAAAKAAAABMAAAATAAAAdJqjUy8AAABASURBVFgJ7NJBDQAACMNAkIIOTOIYTPRDUgQs5LbsqY0Hlz4Kt6QoDBqKKkoL0HluVFFagM5zo4rSAnSeG6VFDwAA///T6qyOAAAAPklEQVTt0kENAAAIw0CQgg5M4hhM9ENSBCzktuypjQeXPgq3pCgMGooqSgvQeW5UUVqAznOjitICdJ4bpUUPmPtJCbPm7UwAAAAASUVORK5CYII='},
        state: {current : 'complete'},
    };
    downloadItems[goblin.id] = {...barlog_base64};
    logDownloadItem(goblin);
    expect(sendLog.mock.calls.length).toBe(3); // +1, means logs have been sent
    expect(displayDownloadWarning.mock.calls.length).toBe(1); // +0, means warning hasn't been shown

});

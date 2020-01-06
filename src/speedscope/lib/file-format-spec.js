export var FileFormat;
(function (FileFormat) {
    let ProfileType;
    (function (ProfileType) {
        ProfileType["EVENTED"] = "evented";
        ProfileType["SAMPLED"] = "sampled";
    })(ProfileType = FileFormat.ProfileType || (FileFormat.ProfileType = {}));
    let EventType;
    (function (EventType) {
        EventType["OPEN_FRAME"] = "O";
        EventType["CLOSE_FRAME"] = "C";
    })(EventType = FileFormat.EventType || (FileFormat.EventType = {}));
})(FileFormat || (FileFormat = {}));

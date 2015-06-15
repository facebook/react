issue_44_valid_ast_1: {
    options = { unused: true };
    input: {
        function a(b) {
            for (var i = 0, e = b.qoo(); ; i++) {}
        }
    }
    expect: {
        function a(b) {
            var i = 0;
            for (b.qoo(); ; i++);
        }
    }
}

issue_44_valid_ast_2: {
    options = { unused: true };
    input: {
        function a(b) {
            if (foo) for (var i = 0, e = b.qoo(); ; i++) {}
        }
    }
    expect: {
        function a(b) {
            if (foo) {
                var i = 0;
                for (b.qoo(); ; i++);
            }
        }
    }
}

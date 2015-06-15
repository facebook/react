exports.run = function() {

    var abc = function() { 
        a = 4;
        return true; 
    } 

    if (0) { console.log(1); } a = 3; if (0) { console.log(3) }

    if (0) {
        console.log(1);
        console.log(2);
        if (abc()) { console.log(3); console.log(4); }
        return;
    }

    var printhello = function() {
        a = 1;
    }

    var printgoodbye = function() {
        a + 2;
    }

    // Yo yo
    printhello();

    // Hey hey
    if (false) {
        if (0) {

            console.log(1);
        }

        a = function() {
            a = 1 + 1
                + 1 + 1
                       + 1 + 1;

                b = [ 1, 2, 
                    3, 4];

                c = [
                    1,
                    2, 3,
                    4
                ];

                if (1 && 2
                    && 3 && 4) {
                        e = 2;
                }
        }

        if (0) {
            console.log(2)
        }
    }
};
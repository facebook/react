holes_and_undefined: {
    input: {
        x = [1, 2, undefined];
        y = [1, , 2, ];
        z = [1, undefined, 3];
    }
    expect: {
        x=[1,2,void 0];
        y=[1,,2];
        z=[1,void 0,3];
    }
}

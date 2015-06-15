keep_name_of_getter: {
    options = { unused: true };
    input: { a = { get foo () {} } }
    expect: { a = { get foo () {} } }
}

keep_name_of_setter: {
    options = { unused: true };
    input: { a = { set foo () {} } }
    expect: { a = { set foo () {} } }
}

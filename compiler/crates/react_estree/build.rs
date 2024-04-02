use react_estree_codegen::estree;

// Example custom build script.
fn main() {
    // Re-run if the codegen files change
    println!("cargo:rerun-if-changed=../react_estree_codegen/src/codegen.rs");
    println!("cargo:rerun-if-changed=../react_estree_codegen/src/lib.rs");
    println!("cargo:rerun-if-changed=../react_estree_codegen/src/ecmascript.json");
    println!("cargo:rerun-if-changed=../react_estree_codegen");

    let src = estree();
    std::fs::write("src/generated.rs", src).unwrap();
}

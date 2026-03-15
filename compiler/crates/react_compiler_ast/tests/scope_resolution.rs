use std::path::PathBuf;

fn get_fixture_json_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("FIXTURE_JSON_DIR") {
        return PathBuf::from(dir);
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures")
}

/// Recursively sort all keys in a JSON value for order-independent comparison.
fn normalize_json(value: &serde_json::Value) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let mut sorted: Vec<(String, serde_json::Value)> = map
                .iter()
                .map(|(k, v)| (k.clone(), normalize_json(v)))
                .collect();
            sorted.sort_by(|a, b| a.0.cmp(&b.0));
            serde_json::Value::Object(sorted.into_iter().collect())
        }
        serde_json::Value::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(normalize_json).collect())
        }
        serde_json::Value::Number(n) => {
            if let Some(f) = n.as_f64() {
                if f.fract() == 0.0 && f.is_finite() && f.abs() < (i64::MAX as f64) {
                    serde_json::Value::Number(serde_json::Number::from(f as i64))
                } else {
                    value.clone()
                }
            } else {
                value.clone()
            }
        }
        other => other.clone(),
    }
}

fn compute_diff(original: &str, round_tripped: &str) -> String {
    use similar::{ChangeTag, TextDiff};
    let diff = TextDiff::from_lines(original, round_tripped);
    let mut output = String::new();
    let mut lines_written = 0;
    const MAX_DIFF_LINES: usize = 50;
    for change in diff.iter_all_changes() {
        if lines_written >= MAX_DIFF_LINES {
            output.push_str("... (diff truncated)\n");
            break;
        }
        let sign = match change.tag() {
            ChangeTag::Delete => "-",
            ChangeTag::Insert => "+",
            ChangeTag::Equal => continue,
        };
        output.push_str(&format!("{sign} {change}"));
        lines_written += 1;
    }
    output
}

#[test]
fn scope_info_round_trip() {
    let json_dir = get_fixture_json_dir();
    let mut failures: Vec<(String, String)> = Vec::new();
    let mut total = 0;
    let mut passed = 0;
    let mut skipped = 0;

    for entry in walkdir::WalkDir::new(&json_dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().extension().is_some_and(|ext| ext == "json")
                && !e.path().to_string_lossy().contains(".scope.")
        })
    {
        // Check for corresponding scope.json
        // If AST is `foo.js.json`, scope is `foo.js.scope.json`
        let ast_path_str = entry.path().to_string_lossy().to_string();
        let scope_path_str = ast_path_str.replace(".json", ".scope.json");
        let scope_path = std::path::Path::new(&scope_path_str);

        if !scope_path.exists() {
            skipped += 1;
            continue;
        }

        let fixture_name = entry
            .path()
            .strip_prefix(&json_dir)
            .unwrap()
            .display()
            .to_string();
        total += 1;

        let scope_json = std::fs::read_to_string(scope_path).unwrap();

        // Test 1: Deserialize scope info
        let scope_info: react_compiler_ast::scope::ScopeInfo = match serde_json::from_str(&scope_json) {
            Ok(info) => info,
            Err(e) => {
                failures.push((fixture_name, format!("Scope deserialization error: {e}")));
                continue;
            }
        };

        // Test 2: Re-serialize and compare (round-trip)
        let round_tripped = serde_json::to_string_pretty(&scope_info).unwrap();
        let original_value: serde_json::Value = serde_json::from_str(&scope_json).unwrap();
        let round_tripped_value: serde_json::Value = serde_json::from_str(&round_tripped).unwrap();

        let original_normalized = normalize_json(&original_value);
        let round_tripped_normalized = normalize_json(&round_tripped_value);

        if original_normalized != round_tripped_normalized {
            let orig_str = serde_json::to_string_pretty(&original_normalized).unwrap();
            let rt_str = serde_json::to_string_pretty(&round_tripped_normalized).unwrap();
            let diff = compute_diff(&orig_str, &rt_str);
            failures.push((fixture_name, format!("Round-trip mismatch:\n{diff}")));
            continue;
        }

        // Test 3: Internal consistency checks
        let mut consistency_error = None;

        // Verify every binding's scope points to a valid scope
        for binding in &scope_info.bindings {
            if binding.scope.0 as usize >= scope_info.scopes.len() {
                consistency_error = Some(format!(
                    "Binding {} has scope {} but only {} scopes exist",
                    binding.name, binding.scope.0, scope_info.scopes.len()
                ));
                break;
            }
        }

        // Verify every scope's bindings map points to valid bindings
        if consistency_error.is_none() {
            for scope in &scope_info.scopes {
                for (name, &bid) in &scope.bindings {
                    if bid.0 as usize >= scope_info.bindings.len() {
                        consistency_error = Some(format!(
                            "Scope {} has binding '{}' with id {} but only {} bindings exist",
                            scope.id.0, name, bid.0, scope_info.bindings.len()
                        ));
                        break;
                    }
                }
                if consistency_error.is_some() {
                    break;
                }
                if let Some(parent) = scope.parent {
                    if parent.0 as usize >= scope_info.scopes.len() {
                        consistency_error = Some(format!(
                            "Scope {} has parent {} but only {} scopes exist",
                            scope.id.0, parent.0, scope_info.scopes.len()
                        ));
                        break;
                    }
                }
            }
        }

        // Verify reference_to_binding values are valid
        if consistency_error.is_none() {
            for (&_offset, &bid) in &scope_info.reference_to_binding {
                if bid.0 as usize >= scope_info.bindings.len() {
                    consistency_error = Some(format!(
                        "reference_to_binding has binding id {} but only {} bindings exist",
                        bid.0, scope_info.bindings.len()
                    ));
                    break;
                }
            }
        }

        // Verify node_to_scope values are valid
        if consistency_error.is_none() {
            for (&_offset, &sid) in &scope_info.node_to_scope {
                if sid.0 as usize >= scope_info.scopes.len() {
                    consistency_error = Some(format!(
                        "node_to_scope has scope id {} but only {} scopes exist",
                        sid.0, scope_info.scopes.len()
                    ));
                    break;
                }
            }
        }

        if let Some(err) = consistency_error {
            failures.push((fixture_name, format!("Consistency error: {err}")));
            continue;
        }

        passed += 1;
    }

    println!("\n{passed}/{total} fixtures passed scope info round-trip ({skipped} skipped - no scope.json)");

    if !failures.is_empty() {
        let show_count = failures.len().min(5);
        let mut msg = format!(
            "\n{} of {total} fixtures failed scope info test (showing first {show_count}):\n\n",
            failures.len()
        );
        for (name, err) in failures.iter().take(show_count) {
            msg.push_str(&format!("--- {name} ---\n{err}\n\n"));
        }
        if failures.len() > show_count {
            msg.push_str(&format!(
                "... and {} more failures\n",
                failures.len() - show_count
            ));
        }
        panic!("{msg}");
    }
}

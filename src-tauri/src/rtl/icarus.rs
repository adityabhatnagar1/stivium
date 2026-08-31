//! Locates the Icarus Verilog toolchain (`iverilog` / `vvp`) shipped as part
//! of OSS CAD Suite. We never hardcode a machine-specific path: instead we
//! check, in order, an explicit override, the process `PATH`, and a small
//! set of common OSS CAD Suite install roots. If none contain both binaries
//! we return an actionable error instead of guessing.

use std::path::PathBuf;

const IVERILOG_BIN: &str = if cfg!(windows) {
    "iverilog.exe"
} else {
    "iverilog"
};

const VVP_BIN: &str = if cfg!(windows) { "vvp.exe" } else { "vvp" };

pub struct IcarusToolchain {
    pub iverilog: PathBuf,
    pub vvp: PathBuf,
}

/// Directories worth checking for `iverilog`/`vvp`, in priority order.
fn candidate_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();

    // 1. Explicit override. Lets a developer point Stivium at a non-standard
    //    OSS CAD Suite install without Stivium needing to know about it.
    if let Ok(explicit) = std::env::var("STIVIUM_ICARUS_HOME") {
        let root = PathBuf::from(explicit);
        dirs.push(root.join("bin"));
        dirs.push(root);
    }

    // 2. Whatever is already on PATH. This is how OSS CAD Suite's own
    //    `environment` / `activate` scripts expose their tools, so this
    //    covers the common case with zero configuration.
    if let Ok(path_var) = std::env::var("PATH") {
        dirs.extend(std::env::split_paths(&path_var));
    }

    // 3. Best-effort scan of common OSS CAD Suite install roots. This is a
    //    convenience fallback, not a guarantee - it does not assume any one
    //    developer's directory layout.
    for root in common_roots() {
        dirs.push(root.join("oss-cad-suite").join("bin"));
    }

    dirs
}

fn common_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();

    for var in ["ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA", "USERPROFILE"] {
        if let Ok(value) = std::env::var(var) {
            roots.push(PathBuf::from(value));
        }
    }

    if cfg!(windows) {
        roots.push(PathBuf::from(r"C:\"));
        roots.push(PathBuf::from(r"D:\"));
    } else {
        roots.push(PathBuf::from("/opt"));
        roots.push(PathBuf::from("/usr/local"));
    }

    roots
}

/// Resolve the Icarus Verilog toolchain, or return a clear, actionable error
/// describing how to make it discoverable.
pub fn resolve_toolchain() -> Result<IcarusToolchain, String> {
    for dir in candidate_dirs() {
        let iverilog = dir.join(IVERILOG_BIN);
        let vvp = dir.join(VVP_BIN);
        if iverilog.is_file() && vvp.is_file() {
            return Ok(IcarusToolchain { iverilog, vvp });
        }
    }

    Err(format!(
        "Icarus Verilog could not be found ({IVERILOG_BIN} / {VVP_BIN}).\n\n\
         Install OSS CAD Suite, then either:\n\
         \u{2022} add its bin/ directory to your PATH, or\n\
         \u{2022} set the STIVIUM_ICARUS_HOME environment variable to the OSS CAD Suite\n  \
           folder (the one that contains bin/{IVERILOG_BIN}).\n\n\
         Restart Stivium after changing environment variables."
    ))
}
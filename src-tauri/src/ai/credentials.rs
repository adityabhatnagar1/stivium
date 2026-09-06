use keyring::Entry;

const SERVICE: &str = "com.iasoft.stivium.ai";

fn entry(provider: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, provider).map_err(|e| e.to_string())
}

/// Stores an API key in the OS credential store (Windows Credential
/// Manager, via the `windows-native` keyring backend). Never written to
/// disk, never sent to the frontend after this call returns.
pub fn save_key(provider: &str, api_key: &str) -> Result<(), String> {
    entry(provider)?.set_password(api_key).map_err(|e| e.to_string())
}

pub fn get_key(provider: &str) -> Result<String, String> {
    entry(provider)?.get_password().map_err(|e| e.to_string())
}

pub fn delete_key(provider: &str) -> Result<(), String> {
    match entry(provider)?.delete_credential() {
        Ok(()) => Ok(()),
        // Deleting a key that was never set is not an error from the
        // frontend's point of view — "no key configured" either way.
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

pub fn has_key(provider: &str) -> bool {
    get_key(provider).is_ok()
}
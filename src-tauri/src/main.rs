use serde::Serialize;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
struct SidecarContract {
    host: &'static str,
    token_env: &'static str,
    default_port: u16,
    cloud_ai_default: bool,
}

#[tauri::command]
fn sidecar_contract() -> SidecarContract {
    SidecarContract {
        host: "127.0.0.1",
        token_env: "SIFT_TOKEN",
        default_port: 43170,
        cloud_ai_default: false,
    }
}

#[tauri::command]
async fn launch_sidecar(app: tauri::AppHandle, token: String, port: Option<u16>) -> Result<(), String> {
    let port = port.unwrap_or(43170).to_string();
    let sidecar = app
        .shell()
        .sidecar("siftd")
        .map_err(|error| format!("failed to prepare siftd sidecar: {error}"))?;

    let (_rx, _child) = sidecar
        .args(["--host", "127.0.0.1", "--port", &port, "--dev-token", &token])
        .spawn()
        .map_err(|error| format!("failed to launch siftd sidecar: {error}"))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app.get_webview_window("main").expect("main window should exist");
            window.set_title("Sift")?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![sidecar_contract, launch_sidecar])
        .run(tauri::generate_context!())
        .expect("error while running Sift");
}

fn main() {
    run();
}

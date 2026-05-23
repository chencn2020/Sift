use base64::Engine;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use tauri::{Manager, Runtime};
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
struct SidecarContract {
    host: &'static str,
    token_env: &'static str,
    default_port: u16,
    cloud_ai_default: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopImportPayload {
    project_name: String,
    files: Vec<DesktopPhotoFile>,
    ignored_count: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopPhotoFile {
    path: String,
    filename: String,
    relative_path: String,
    format: String,
    size_bytes: u64,
    modified_millis: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StorageInfo {
    data_dir: String,
    cache_dir: String,
    database_path: String,
    thumbnail_cache_dir: String,
    face_cache_dir: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ThumbnailCacheResult {
    path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FaceReferenceResult {
    path: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CatalogSnapshot {
    projects: Vec<Value>,
    deleted_projects: Vec<Value>,
    people: Vec<Value>,
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
async fn launch_sidecar(
    app: tauri::AppHandle,
    token: String,
    port: Option<u16>,
) -> Result<(), String> {
    let port = port.unwrap_or(43170).to_string();
    let sidecar = app
        .shell()
        .sidecar("siftd")
        .map_err(|error| format!("failed to prepare siftd sidecar: {error}"))?;

    let (_rx, _child) = sidecar
        .args([
            "--host",
            "127.0.0.1",
            "--port",
            &port,
            "--dev-token",
            &token,
        ])
        .spawn()
        .map_err(|error| format!("failed to launch siftd sidecar: {error}"))?;

    Ok(())
}

#[tauri::command]
fn scan_import_paths(paths: Vec<String>) -> Result<DesktopImportPayload, String> {
    let roots: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
    let project_name = infer_project_name(&roots);
    let mut files = Vec::new();
    let mut ignored_count = 0;

    for root in &roots {
        scan_path(root, root, &mut files, &mut ignored_count)?;
    }

    files.sort_by(|left, right| {
        natural_sort_key(&left.relative_path).cmp(&natural_sort_key(&right.relative_path))
    });

    Ok(DesktopImportPayload {
        project_name,
        files,
        ignored_count,
    })
}

#[tauri::command]
fn storage_info(app: tauri::AppHandle) -> Result<StorageInfo, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("failed to resolve app cache dir: {error}"))?;
    let thumbnail_cache_dir = cache_dir.join("thumbnails");
    let face_cache_dir = cache_dir.join("faces");
    fs::create_dir_all(&data_dir).map_err(|error| format!("failed to create data dir: {error}"))?;
    fs::create_dir_all(&thumbnail_cache_dir)
        .map_err(|error| format!("failed to create thumbnail cache dir: {error}"))?;
    fs::create_dir_all(&face_cache_dir)
        .map_err(|error| format!("failed to create face cache dir: {error}"))?;

    let scopes = app.state::<tauri::scope::Scopes>();
    let _ = scopes.allow_directory(&cache_dir, true);

    Ok(StorageInfo {
        database_path: data_dir.join("sift.sqlite").to_string_lossy().to_string(),
        data_dir: data_dir.to_string_lossy().to_string(),
        cache_dir: cache_dir.to_string_lossy().to_string(),
        thumbnail_cache_dir: thumbnail_cache_dir.to_string_lossy().to_string(),
        face_cache_dir: face_cache_dir.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn init_database(app: tauri::AppHandle) -> Result<(), String> {
    let connection = open_database(&app)?;
    migrate_database(&connection)
}

#[tauri::command]
fn load_catalog(app: tauri::AppHandle) -> Result<CatalogSnapshot, String> {
    let connection = open_database(&app)?;
    migrate_database(&connection)?;

    let mut statement = connection
        .prepare(
            "select json from projects order by coalesce(last_opened_at, imported_at, id) desc",
        )
        .map_err(|error| format!("failed to prepare catalog query: {error}"))?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| format!("failed to load catalog: {error}"))?;

    let mut projects = Vec::new();
    let mut deleted_projects = Vec::new();
    for row in rows {
        let json = row.map_err(|error| format!("failed to read catalog row: {error}"))?;
        let value: Value = serde_json::from_str(&json)
            .map_err(|error| format!("failed to parse catalog json: {error}"))?;
        if value.get("deletedAt").and_then(Value::as_str).is_some() {
            deleted_projects.push(value);
        } else {
            projects.push(value);
        }
    }

    let mut people_statement = connection
        .prepare("select json from people order by coalesce(created_at, id) desc")
        .map_err(|error| format!("failed to prepare people query: {error}"))?;
    let people_rows = people_statement
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| format!("failed to load people: {error}"))?;
    let mut people = Vec::new();
    for row in people_rows {
        let json = row.map_err(|error| format!("failed to read people row: {error}"))?;
        let value: Value = serde_json::from_str(&json)
            .map_err(|error| format!("failed to parse people json: {error}"))?;
        people.push(value);
    }

    Ok(CatalogSnapshot {
        projects,
        deleted_projects,
        people,
    })
}

#[tauri::command]
fn persist_catalog(app: tauri::AppHandle, snapshot: CatalogSnapshot) -> Result<(), String> {
    let mut connection = open_database(&app)?;
    migrate_database(&connection)?;
    let transaction = connection
        .transaction()
        .map_err(|error| format!("failed to start catalog transaction: {error}"))?;

    transaction
        .execute("delete from photos", [])
        .map_err(|error| format!("failed to clear photo catalog: {error}"))?;
    transaction
        .execute("delete from people", [])
        .map_err(|error| format!("failed to clear people catalog: {error}"))?;
    transaction
        .execute("delete from projects", [])
        .map_err(|error| format!("failed to clear project catalog: {error}"))?;

    for person in &snapshot.people {
        let person_id = person
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| "person is missing id".to_string())?;
        let name = person.get("name").and_then(Value::as_str).unwrap_or("");
        let kind = person
            .get("kind")
            .and_then(Value::as_str)
            .unwrap_or("registered");
        let refs = person
            .get("refs")
            .and_then(Value::as_i64)
            .unwrap_or_default();
        let cache_path = person.get("cachePath").and_then(Value::as_str);
        let created_at = person.get("createdAt").and_then(Value::as_str);
        let json = serde_json::to_string(person)
            .map_err(|error| format!("failed to serialize person: {error}"))?;

        transaction
            .execute(
                "insert into people (id, name, kind, refs, cache_path, created_at, json)
                 values (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![person_id, name, kind, refs, cache_path, created_at, json],
            )
            .map_err(|error| format!("failed to persist person: {error}"))?;
    }

    for project in snapshot
        .projects
        .iter()
        .chain(snapshot.deleted_projects.iter())
    {
        let project_id = project
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| "project is missing id".to_string())?;
        let name = project.get("name").and_then(Value::as_str).unwrap_or("");
        let status = project
            .get("status")
            .and_then(Value::as_str)
            .unwrap_or("ready");
        let total = project
            .get("total")
            .and_then(Value::as_i64)
            .unwrap_or_default();
        let imported_at = project.get("date").and_then(Value::as_str).unwrap_or("");
        let last_opened_at = project.get("lastOpenedAt").and_then(Value::as_str);
        let deleted_at = project.get("deletedAt").and_then(Value::as_str);
        let json = serde_json::to_string(project)
            .map_err(|error| format!("failed to serialize project: {error}"))?;

        transaction
            .execute(
                "insert into projects (id, name, status, total, imported_at, last_opened_at, deleted_at, json)
                 values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![project_id, name, status, total, imported_at, last_opened_at, deleted_at, json],
            )
            .map_err(|error| format!("failed to persist project: {error}"))?;

        if let Some(photos) = project.get("photos").and_then(Value::as_array) {
            for photo in photos {
                let photo_id = photo.get("id").and_then(Value::as_i64).unwrap_or_default();
                let filename = photo.get("filename").and_then(Value::as_str).unwrap_or("");
                let relative_path = photo.get("relativePath").and_then(Value::as_str);
                let source_path = photo.get("sourcePath").and_then(Value::as_str);
                let taken_at = photo.get("takenAt").and_then(Value::as_str);
                let rating = photo
                    .get("rating")
                    .and_then(Value::as_i64)
                    .unwrap_or_default();
                let state = photo.get("state").and_then(Value::as_str);
                let photo_json = serde_json::to_string(photo)
                    .map_err(|error| format!("failed to serialize photo: {error}"))?;

                transaction
                    .execute(
                        "insert into photos (project_id, photo_id, filename, relative_path, source_path, taken_at, rating, state, json)
                         values (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                        params![
                            project_id,
                            photo_id,
                            filename,
                            relative_path,
                            source_path,
                            taken_at,
                            rating,
                            state,
                            photo_json
                        ],
                    )
                    .map_err(|error| format!("failed to persist photo: {error}"))?;
            }
        }
    }

    transaction
        .commit()
        .map_err(|error| format!("failed to commit catalog transaction: {error}"))
}

#[tauri::command]
fn cached_thumbnail_path(
    app: tauri::AppHandle,
    cache_key: String,
) -> Result<Option<ThumbnailCacheResult>, String> {
    let path = thumbnail_path(&app, &cache_key)?;
    if path.exists() {
        let scopes = app.state::<tauri::scope::Scopes>();
        let _ = scopes.allow_file(&path);
        Ok(Some(ThumbnailCacheResult {
            path: path.to_string_lossy().to_string(),
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn save_thumbnail_data_url(
    app: tauri::AppHandle,
    cache_key: String,
    data_url: String,
) -> Result<ThumbnailCacheResult, String> {
    let path = thumbnail_path(&app, &cache_key)?;
    let bytes = decode_data_url(&data_url)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("failed to create thumbnail dir: {error}"))?;
    }
    let mut file =
        fs::File::create(&path).map_err(|error| format!("failed to write thumbnail: {error}"))?;
    file.write_all(&bytes)
        .map_err(|error| format!("failed to write thumbnail: {error}"))?;

    let scopes = app.state::<tauri::scope::Scopes>();
    let _ = scopes.allow_file(&path);

    Ok(ThumbnailCacheResult {
        path: path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn save_face_reference_data_url(
    app: tauri::AppHandle,
    person_id: String,
    ref_index: Option<usize>,
    data_url: String,
) -> Result<FaceReferenceResult, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("failed to resolve app cache dir: {error}"))?
        .join("faces");
    fs::create_dir_all(&cache_dir)
        .map_err(|error| format!("failed to create face cache dir: {error}"))?;
    let extension = extension_for_data_url(&data_url);
    let path = cache_dir.join(format!(
        "{}-{}.{}",
        sanitize_cache_key(&person_id),
        ref_index.unwrap_or_default(),
        extension
    ));
    let bytes = decode_data_url(&data_url)?;
    let mut file =
        fs::File::create(&path).map_err(|error| format!("failed to write face ref: {error}"))?;
    file.write_all(&bytes)
        .map_err(|error| format!("failed to write face ref: {error}"))?;

    let scopes = app.state::<tauri::scope::Scopes>();
    let _ = scopes.allow_file(&path);

    Ok(FaceReferenceResult {
        path: path.to_string_lossy().to_string(),
    })
}

fn extension_for_data_url(data_url: &str) -> &'static str {
    if data_url.starts_with("data:image/png") {
        "png"
    } else if data_url.starts_with("data:image/webp") {
        "webp"
    } else if data_url.starts_with("data:image/heic") || data_url.starts_with("data:image/heif") {
        "heic"
    } else {
        "jpg"
    }
}

#[tauri::command]
fn clear_thumbnail_cache(app: tauri::AppHandle) -> Result<(), String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("failed to resolve app cache dir: {error}"))?
        .join("thumbnails");
    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir)
            .map_err(|error| format!("failed to clear thumbnail cache: {error}"))?;
    }
    fs::create_dir_all(&cache_dir)
        .map_err(|error| format!("failed to recreate thumbnail cache: {error}"))?;
    Ok(())
}

#[tauri::command]
fn allow_source_paths(app: tauri::AppHandle, paths: Vec<String>) -> Result<(), String> {
    let scopes = app.state::<tauri::scope::Scopes>();
    for path in paths {
        let path = PathBuf::from(path);
        if path.exists() {
            let _ = scopes.allow_file(&path);
        }
    }
    Ok(())
}

fn thumbnail_path<R: Runtime>(
    app: &tauri::AppHandle<R>,
    cache_key: &str,
) -> Result<PathBuf, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("failed to resolve app cache dir: {error}"))?
        .join("thumbnails");
    Ok(cache_dir.join(format!("{}.jpg", sanitize_cache_key(cache_key))))
}

fn decode_data_url(data_url: &str) -> Result<Vec<u8>, String> {
    let payload = data_url
        .split_once(',')
        .map(|(_, payload)| payload)
        .ok_or_else(|| "invalid thumbnail data url".to_string())?;
    base64::engine::general_purpose::STANDARD
        .decode(payload)
        .map_err(|error| format!("failed to decode thumbnail: {error}"))
}

fn sanitize_cache_key(value: &str) -> String {
    value
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .chars()
        .take(96)
        .collect::<String>()
}

fn open_database<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<Connection, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("failed to resolve app data dir: {error}"))?;
    fs::create_dir_all(&data_dir).map_err(|error| format!("failed to create data dir: {error}"))?;
    Connection::open(data_dir.join("sift.sqlite"))
        .map_err(|error| format!("failed to open sqlite database: {error}"))
}

fn migrate_database(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "
            create table if not exists projects (
              id text primary key,
              name text not null,
              status text not null,
              total integer not null default 0,
              imported_at text,
              last_opened_at text,
              deleted_at text,
              json text not null
            );
            create table if not exists photos (
              project_id text not null,
              photo_id integer not null,
              filename text not null,
              relative_path text,
              source_path text,
              taken_at text,
              rating integer not null default 0,
              state text,
              json text not null,
              primary key (project_id, photo_id),
              foreign key (project_id) references projects(id) on delete cascade
            );
            create index if not exists idx_projects_deleted_at on projects(deleted_at);
            create index if not exists idx_photos_project_id on photos(project_id);
            create index if not exists idx_photos_filename on photos(filename);
            create table if not exists people (
              id text primary key,
              name text not null,
              kind text not null,
              refs integer not null default 0,
              cache_path text,
              created_at text,
              json text not null
            );
            ",
        )
        .map_err(|error| format!("failed to migrate sqlite database: {error}"))
}

fn scan_path(
    path: &Path,
    root: &Path,
    files: &mut Vec<DesktopPhotoFile>,
    ignored_count: &mut usize,
) -> Result<(), String> {
    let metadata = fs::metadata(path)
        .map_err(|error| format!("failed to read {}: {error}", path.display()))?;

    if metadata.is_dir() {
        let entries = fs::read_dir(path)
            .map_err(|error| format!("failed to scan {}: {error}", path.display()))?;
        for entry in entries {
            let entry =
                entry.map_err(|error| format!("failed to read directory entry: {error}"))?;
            scan_path(&entry.path(), root, files, ignored_count)?;
        }
        return Ok(());
    }

    if !metadata.is_file() {
        *ignored_count += 1;
        return Ok(());
    }

    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_lowercase();

    if !is_supported_photo(&extension) {
        *ignored_count += 1;
        return Ok(());
    }

    files.push(DesktopPhotoFile {
        path: path.to_string_lossy().to_string(),
        filename: path
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_string(),
        relative_path: relative_path(path, root),
        format: extension,
        size_bytes: metadata.len(),
        modified_millis: metadata
            .modified()
            .ok()
            .and_then(|value| value.duration_since(UNIX_EPOCH).ok())
            .map(|value| value.as_millis().min(u64::MAX as u128) as u64)
            .unwrap_or_default(),
    });

    Ok(())
}

fn infer_project_name(roots: &[PathBuf]) -> String {
    if roots.len() == 1 {
        return roots[0]
            .file_name()
            .and_then(|value| value.to_str())
            .filter(|value| !value.is_empty())
            .unwrap_or("Sift Import")
            .to_string();
    }

    roots
        .first()
        .and_then(|path| path.parent())
        .and_then(|path| path.file_name())
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .unwrap_or("Sift Import")
        .to_string()
}

fn relative_path(path: &Path, root: &Path) -> String {
    if root.is_dir() {
        let root_name = root
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default();
        let child = path.strip_prefix(root).unwrap_or(path).to_string_lossy();
        if root_name.is_empty() {
            child.to_string()
        } else {
            format!("{root_name}/{child}")
        }
    } else {
        path.file_name()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_string()
    }
}

fn is_supported_photo(extension: &str) -> bool {
    matches!(
        extension,
        "jpg"
            | "jpeg"
            | "png"
            | "heic"
            | "heif"
            | "webp"
            | "gif"
            | "avif"
            | "cr2"
            | "cr3"
            | "nef"
            | "arw"
            | "raf"
            | "orf"
            | "dng"
    )
}

fn natural_sort_key(value: &str) -> String {
    value.to_lowercase()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("main window should exist");
            window.set_title("Sift")?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            sidecar_contract,
            launch_sidecar,
            scan_import_paths,
            storage_info,
            init_database,
            load_catalog,
            persist_catalog,
            cached_thumbnail_path,
            save_thumbnail_data_url,
            save_face_reference_data_url,
            clear_thumbnail_cache,
            allow_source_paths
        ])
        .run(tauri::generate_context!())
        .expect("error while running Sift");
}

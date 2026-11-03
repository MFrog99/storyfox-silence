"""Общий сервис StoryFox Silence: Яндекс Музыка + локальное хранилище.

Используется и в Windows-версии (pywebview), и в Android-версии (Chaquopy).
Интерфейс с UI — одна функция `dispatch(method, args_json) -> json`.
"""

import json
import os
import threading
import time
import traceback
from typing import Any, Dict, List, Optional

from yandex_music import Client
from yandex_music.exceptions import DeviceAuthError, UnauthorizedError

_data_dir: Optional[str] = None
_lock = threading.RLock()
_client: Optional[Client] = None
_client_token: Optional[str] = None


# ---------------------------------------------------------------- хранилище


def init(data_dir: str) -> None:
    """Задаёт каталог для данных приложения (настройки, токен, плейлист)."""
    global _data_dir
    os.makedirs(data_dir, exist_ok=True)
    _data_dir = data_dir


def _store_path() -> str:
    assert _data_dir is not None, 'ym_service.init() не вызван'
    return os.path.join(_data_dir, 'storage.json')


def _load_store() -> Dict[str, Any]:
    try:
        with open(_store_path(), encoding='utf-8') as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _save_store(data: Dict[str, Any]) -> None:
    tmp = _store_path() + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, _store_path())


def store_get(key: str) -> Any:
    with _lock:
        return _load_store().get(key)


def store_set(key: str, value: Any) -> bool:
    with _lock:
        data = _load_store()
        if value is None:
            data.pop(key, None)
        else:
            data[key] = value
        _save_store(data)
    return True


def store_all() -> Dict[str, Any]:
    with _lock:
        data = _load_store()
    data.pop('ym_token', None)
    return data


# ---------------------------------------------------------------- клиент


def _get_client(require_auth: bool = True) -> Client:
    global _client, _client_token
    token = store_get('ym_token')
    if require_auth and not token:
        raise PermissionError('not_logged_in')
    with _lock:
        if _client is None or _client_token != token:
            _client = Client(token or None)
            if token:
                _client.init()
            _client_token = token
        return _client


def _track(t: Any) -> Optional[Dict[str, Any]]:
    if t is None:
        return None
    cover = None
    if getattr(t, 'cover_uri', None):
        cover = 'https://' + t.cover_uri.replace('%%', '200x200')
    return {
        'id': t.track_id,
        'title': t.title or 'Без названия',
        'artists': ', '.join(t.artists_name()) if t.artists else '',
        'duration': t.duration_ms or 0,
        'cover': cover,
        'available': t.available is not False,
    }


# ---------------------------------------------------------------- авторизация


def auth_start() -> Dict[str, Any]:
    client = _get_client(require_auth=False)
    code = client.request_device_code(device_name='StoryFox Silence')
    return {
        'user_code': code.user_code,
        'verification_url': code.verification_url,
        'device_code': code.device_code,
        'interval': code.interval,
        'expires_in': code.expires_in,
    }


def auth_poll(device_code: str) -> Dict[str, Any]:
    client = _get_client(require_auth=False)
    try:
        token = client.poll_device_token(device_code)
    except DeviceAuthError as e:
        return {'status': 'error', 'error': str(e)}
    if token is None:
        return {'status': 'pending'}
    store_set('ym_token', token.access_token)
    return {'status': 'ok', 'account': account()}


def set_token(token: str) -> Dict[str, Any]:
    token = (token or '').strip()
    store_set('ym_token', token or None)
    if not token:
        return {'logged_in': False}
    try:
        return account()
    except UnauthorizedError:
        store_set('ym_token', None)
        raise PermissionError('bad_token')


def logout() -> bool:
    store_set('ym_token', None)
    return True


def account() -> Dict[str, Any]:
    if not store_get('ym_token'):
        return {'logged_in': False}
    client = _get_client()
    status = client.account_status()
    acc = status.account if status else None
    return {
        'logged_in': True,
        'name': (acc.display_name or acc.login or acc.full_name) if acc else '',
        'login': acc.login if acc else '',
        'plus': bool(status and status.plus and status.plus.has_plus),
    }


# ---------------------------------------------------------------- каталог


def search(query: str, page: int = 0) -> List[Dict[str, Any]]:
    client = _get_client()
    res = client.search(query, type_='track', page=page)
    if not res or not res.tracks:
        return []
    return [x for x in (_track(t) for t in res.tracks.results) if x]


def likes(limit: int = 100) -> List[Dict[str, Any]]:
    client = _get_client()
    liked = client.users_likes_tracks()
    if not liked:
        return []
    ids = [t.track_id for t in liked.tracks[:limit]]
    if not ids:
        return []
    return [x for x in (_track(t) for t in client.tracks(ids)) if x]


def playlists() -> List[Dict[str, Any]]:
    client = _get_client()
    result = []
    for p in client.users_playlists_list():
        cover = None
        if p.cover and p.cover.uri:
            cover = 'https://' + p.cover.uri.replace('%%', '200x200')
        elif p.cover and p.cover.items_uri:
            cover = 'https://' + p.cover.items_uri[0].replace('%%', '200x200')
        result.append({'kind': p.kind, 'title': p.title, 'count': p.track_count or 0, 'cover': cover})
    return result


def playlist_tracks(kind: int, limit: int = 200) -> List[Dict[str, Any]]:
    client = _get_client()
    pl = client.users_playlists(kind)
    if isinstance(pl, list):
        pl = pl[0] if pl else None
    if pl is None:
        return []
    shorts = pl.tracks or pl.fetch_tracks()
    out = []
    missing = []
    for s in shorts[:limit]:
        if s.track is not None:
            out.append(_track(s.track))
        else:
            missing.append(s.track_id)
    if missing:
        out.extend(_track(t) for t in client.tracks(missing))
    return [x for x in out if x]


_url_cache: Dict[str, Any] = {}


def stream_url(track_id: str) -> Dict[str, Any]:
    """Прямая ссылка на mp3 лучшего доступного качества."""
    cached = _url_cache.get(track_id)
    if cached and cached[1] > time.time():
        return cached[0]
    client = _get_client()
    infos = client.tracks_download_info(track_id)
    mp3 = [i for i in infos if i.codec == 'mp3'] or infos
    if not mp3:
        raise LookupError('no_stream')
    mp3.sort(key=lambda i: (not i.preview, i.bitrate_in_kbps), reverse=True)
    best = mp3[0]
    result = {'url': best.get_direct_link(), 'preview': bool(best.preview), 'bitrate': best.bitrate_in_kbps}
    _url_cache[track_id] = (result, time.time() + 600)
    return result


# ---------------------------------------------------------------- диспетчер

_METHODS = {
    'store_get': store_get,
    'store_set': store_set,
    'store_all': store_all,
    'auth_start': auth_start,
    'auth_poll': auth_poll,
    'set_token': set_token,
    'logout': logout,
    'account': account,
    'search': search,
    'likes': likes,
    'playlists': playlists,
    'playlist_tracks': playlist_tracks,
    'stream_url': stream_url,
}


def _error_code(e: Exception) -> str:
    if isinstance(e, UnauthorizedError):
        return 'unauthorized'
    if isinstance(e, PermissionError):
        return str(e) or 'not_logged_in'
    name = type(e).__name__
    if name in ('NetworkError', 'TimedOutError', 'ConnectionError', 'Timeout'):
        return 'network'
    return 'error'


def dispatch(method: str, args_json: str = '[]') -> str:
    """Вызов метода по имени. Аргументы и результат — JSON-строки."""
    try:
        fn = _METHODS[method]
        args = json.loads(args_json or '[]')
        result = fn(*args) if isinstance(args, list) else fn(**args)
        return json.dumps({'ok': True, 'result': result}, ensure_ascii=False)
    except Exception as e:  # noqa: BLE001 — ошибки отдаём в UI
        traceback.print_exc()
        return json.dumps({'ok': False, 'code': _error_code(e), 'error': str(e)}, ensure_ascii=False)

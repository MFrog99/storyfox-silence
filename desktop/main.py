"""StoryFox Silence для Windows: окно pywebview (Edge WebView2) + общий Python-сервис."""

import os
import sys
import webbrowser

import webview

if getattr(sys, 'frozen', False):
    BASE = sys._MEIPASS  # type: ignore[attr-defined]
else:
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BASE = ROOT
    sys.path.insert(0, os.path.join(ROOT, 'core'))

import ym_service  # noqa: E402

WEB_DIR = os.path.join(BASE, 'web')
# по метке StoryFoxDesktop интерфейс понимает, что надо ждать pywebview API
USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
    'Chrome/130.0 Safari/537.36 Edg/130.0 StoryFoxDesktop/1.0'
)
DATA_DIR =os.path.join(os.environ.get('APPDATA') or os.path.expanduser('~'), 'StoryFox Silence')


class Api:
    def call(self, method: str, args_json: str) -> str:
        return ym_service.dispatch(method, args_json)

    def open_url(self, url: str) -> None:
        if url.startswith('https://'):
            webbrowser.open(url)


def main() -> None:
    ym_service.init(DATA_DIR)
    webview.create_window(
        'StoryFox Silence',
        os.path.join(WEB_DIR, 'index.html'),
        js_api=Api(),
        width=1180,
        height=780,
        min_size=(380, 600),
        background_color='#0b0e1f',
    )
    webview.start(
        gui='edgechromium',
        private_mode=False,
        storage_path=os.path.join(DATA_DIR, 'webview'),
        user_agent=USER_AGENT,
    )


if __name__ == '__main__':
    main()

# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['desktop.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('frontend/dist', 'frontend/dist'),  # Include built frontend
        ('backend', 'backend'),  # Include backend module
    ],
    hiddenimports=[
        'pywebview',
        'webview',
        'webview.platforms.winforms',  # Add platform-specific imports
        'webview.platforms.gtk',
        'webview.platforms.cocoa',
        'uvicorn',
        'backend.main',
        'fastapi',
        'starlette',
        'pydantic',
        'typing_extensions',
        'anyio',
        'idna',
        'sniffio',
        'certifi',
        'charset-normalizer',
        'urllib3',
        'requests',
        'click',
        'h11',
        'rfc3986',
        'websockets',
        'uvloop',
        'httptools',
        'watchfiles',
        'exceptiongroup',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='UnchainedLauncher',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Set to True for console app
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Add path to your .ico file here if you have one
)

import { useEffect } from "react";

type KeyName = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Enter";

interface KeyState {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  Enter: boolean;
}

function createKeyboardEvent(type: string, key: string, keyCode = 0, code = key): Event {
  // Preferred modern constructor
  try {
    const ev = new KeyboardEvent(type, {
      key,
      code,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      composed: true
    });

    // Ensure read-only props are accessible to older listeners
    try {
      Object.defineProperty(ev, "keyCode", { get: () => keyCode });
      Object.defineProperty(ev, "which", { get: () => keyCode });
      Object.defineProperty(ev, "key", { get: () => key });
      Object.defineProperty(ev, "code", { get: () => code });
    } catch (err) { }

    return ev;
  } catch (e) { }

  // Older fallback (some browsers)
  try {
    const ev: any = document.createEvent("KeyboardEvent");
    const initMethod = typeof ev.initKeyboardEvent !== "undefined" ? "initKeyboardEvent" : "initKeyEvent";
    if (initMethod === "initKeyboardEvent") {
      try { ev.initKeyboardEvent(type, true, true, window, key, 0, "", false, ""); } catch (_) {
        try { ev.initKeyboardEvent(type, true, true, window, key, 0, "", false); } catch (_) { }
      }
    } else {
      try { ev.initKeyEvent(type, true, true, window, false, false, false, false, keyCode, 0); } catch (_) { }
    }
    try {
      Object.defineProperty(ev, "keyCode", { get: () => keyCode });
      Object.defineProperty(ev, "which", { get: () => keyCode });
      Object.defineProperty(ev, "key", { get: () => key });
      Object.defineProperty(ev, "code", { get: () => code });
    } catch (_) { }
    return ev as Event;
  } catch (_) { }

  // Last resort
  return new CustomEvent(type, { bubbles: true, detail: { key, code, keyCode } });
}

function dispatchKeySequence(target: Element | Document | null | undefined, key: string, keyCode = 0): boolean {
  const t: any = target ?? (document.activeElement as Element | null) ?? document.body ?? document;

  // Ensure element is focusable and focused
  try {
    if (t !== document && t !== document.body && typeof t.focus === "function") {
      t.focus({ preventScroll: true });
    } else {
      // ensure some element is focused
      if (document.activeElement === document.body && document.body.tabIndex === -1) {
        document.body.tabIndex = 0;
      }
      document.body.focus({ preventScroll: true });
    }
  } catch (_) { }

  function send(type: string) {
    const ev = createKeyboardEvent(type, key, keyCode);
    try { return t.dispatchEvent(ev); } catch (_) { return false; }
  }

  // Keydown
  send("keydown");
  // Many handlers expect keypress for printable/Enter keys
  send("keypress");
  // Keyup after slight delay to allow handlers that measure keydown duration
  setTimeout(() => send("keyup"), 40);
  return true;
}

function dispatchSingle(type: string, key: string, keyCode = 0, target: Element | Document | null | undefined = null): boolean {
  const t: any = target ?? (document.activeElement as Element | null) ?? document.body ?? document;
  // Ensure focused as above
  try {
    if (t !== document && t !== document.body && typeof t.focus === "function") t.focus({ preventScroll: true });
    else document.body.focus({ preventScroll: true });
  } catch (_) { }
  const ev = createKeyboardEvent(type, key, keyCode);
  try { t.dispatchEvent(ev); return true; } catch (_) { return false; }
}

export function useGamepad(): void {
  useEffect(() => {
    let running = true;
    const lastState: KeyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Enter: false };

    function arrowKeyCode(keyName: KeyName): number {
      switch (keyName) {
        case "ArrowUp": return 38;
        case "ArrowDown": return 40;
        case "ArrowLeft": return 37;
        case "ArrowRight": return 39;
        case "Enter": return 13;
        default: return 0;
      }
    }

    function sampleGamepad(): Gamepad | null {
      const gps = navigator.getGamepads ? navigator.getGamepads() : null;
      if (!gps) return null;
      for (let i = 0; i < gps.length; i++) {
        const g = gps[i];
        if (g) return g;
      }
      return null;
    }

    function processGamepad(g: Gamepad | null): KeyState {
      const state: KeyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Enter: false };
      if (!g) return state;

      const b: readonly GamepadButton[] = g.buttons ?? [];
      const a: readonly number[] = g.axes ?? [];

      if (b[12]?.pressed) state.ArrowUp = true;
      if (b[13]?.pressed) state.ArrowDown = true;
      if (b[14]?.pressed) state.ArrowLeft = true;
      if (b[15]?.pressed) state.ArrowRight = true;

      if (!state.ArrowLeft && !state.ArrowRight && a.length > 0) {
        if ((a[0] || 0) <= -0.5) state.ArrowLeft = true;
        if ((a[0] || 0) >= 0.5) state.ArrowRight = true;
      }
      if (!state.ArrowUp && !state.ArrowDown && a.length > 1) {
        if ((a[1] || 0) <= -0.5) state.ArrowUp = true;
        if ((a[1] || 0) >= 0.5) state.ArrowDown = true;
      }

      if (b[0]?.pressed) state.Enter = true;
      return state;
    }

    function emitTransitions(state: KeyState) {
      (Object.keys(state) as KeyName[]).forEach((key) => {
        if (state[key] && !lastState[key]) {
          // Pressed now
          if (key === "Enter") {
            console.debug("[useGamepad] dispatch Enter press sequence");
            dispatchKeySequence(document.activeElement, "Enter", 13);
          } else {
            console.debug("[useGamepad] dispatch keydown", key);
            dispatchSingle("keydown", key, arrowKeyCode(key), document.activeElement);
          }
        } else if (!state[key] && lastState[key]) {
          // Released now
          if (key === "Enter") {
            console.debug("[useGamepad] dispatch Enter keyup");
            dispatchSingle("keyup", key, 13, document.activeElement);
          } else {
            console.debug("[useGamepad] dispatch keyup", key);
            dispatchSingle("keyup", key, arrowKeyCode(key), document.activeElement);
          }
        }
        lastState[key] = state[key];
      });
    }

    function loop() {
      if (!running) return;
      const g = sampleGamepad();
      emitTransitions(processGamepad(g));
      requestAnimationFrame(loop);
    }

    function onConnect(e: GamepadEvent) {
      console.info("[useGamepad] connected", e.gamepad.id);
      console.debug("[useGamepad] raw gamepad", e.gamepad);
    }
    function onDisconnect(_e: GamepadEvent) {
      console.info("[useGamepad] disconnected");
    }

    window.addEventListener("gamepadconnected", onConnect as EventListener);
    window.addEventListener("gamepaddisconnected", onDisconnect as EventListener);

    // Start loop and do an initial immediate poll
    requestAnimationFrame(loop);

    return () => {
      running = false;
      window.removeEventListener("gamepadconnected", onConnect as EventListener);
      window.removeEventListener("gamepaddisconnected", onDisconnect as EventListener);
    };
  }, []);
}


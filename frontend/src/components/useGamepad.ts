import { useEffect } from "react";

type KeyName = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Enter" | "Escape";
interface KeyState {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  Enter: boolean;
  Escape: boolean;
}

function makeKeyboardEvent(type: string, key: string, keyCode = 0, code = key): KeyboardEvent {
  const ev = new KeyboardEvent(type, {
    key,
    code,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
    composed: true
  });

  try {
    Object.defineProperty(ev, "keyCode", { get: () => keyCode });
    Object.defineProperty(ev, "which", { get: () => keyCode });
    Object.defineProperty(ev, "key", { get: () => key });
    Object.defineProperty(ev, "code", { get: () => code });
  } catch (_) { }

  return ev;
}

export function useGamepad(): void {
  useEffect(() => {
    let running = true;
    const lastState: KeyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Enter: false, Escape: false };

    // Track per-key active target so keyup goes to same element that got keydown
    const activeTargets: Partial<Record<KeyName, { target: Element | Document; }>> = {};

    function arrowKeyCode(keyName: KeyName | "Escape"): number {
      switch (keyName) {
        case "ArrowUp": return 38;
        case "ArrowDown": return 40;
        case "ArrowLeft": return 37;
        case "ArrowRight": return 39;
        case "Enter": return 13;
        case "Escape": return 27;
        default: return 0;
      }
    }

    function getTarget(): Element | Document {
      const t: any = (document.activeElement as Element | null) ?? document;
      // Ensure focusable
      try {
        if (t !== document && t !== document.body && typeof t.focus === "function") t.focus({ preventScroll: true });
        else document.body.focus({ preventScroll: true });
      } catch (_) { }
      return t;
    }

    function sendKeyboard(type: string, key: string, keyCode = 0, target: Element | Document) {
      const ev = makeKeyboardEvent(type, key, keyCode, key);
      try {
        (target as any).dispatchEvent(ev);
      } catch (err) {
        console.error("[useGamepad] dispatch error", err);
      }
    }

    function pressKey(key: KeyName) {
      // if already pressed, do nothing
      if (lastState[key]) return;
      const target = getTarget();
      activeTargets[key] = { target };
      const code = arrowKeyCode(key);
      console.info(`[useGamepad] PRESS detected: ${key} target=`, target);
      // keydown
      sendKeyboard("keydown", key, code, target);
      // keypress for Enter (and historically printable keys)
      if (key === "Enter") sendKeyboard("keypress", "Enter", code, target);
      // keep lastState updated here; keyup will clear it
      lastState[key] = true;
    }

    function releaseKey(key: KeyName) {
      if (!lastState[key]) return;
      const entry = activeTargets[key];
      const target = entry?.target ?? getTarget();
      const code = arrowKeyCode(key);
      console.info(`[useGamepad] RELEASE detected: ${key} target=`, target);
      sendKeyboard("keyup", key, code, target);
      lastState[key] = false;
      delete activeTargets[key];
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
      const state: KeyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Enter: false, Escape: false };
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

      // Map A (button 0) -> Enter, B (button 1) -> Escape
      if (b[0]?.pressed) state.Enter = true;
      if (b[1]?.pressed) state.Escape = true;

      return state;
    }

    function emitTransitions(state: KeyState) {
      (Object.keys(state) as KeyName[]).forEach((key) => {
        if (state[key] && !lastState[key]) {
          // press
          pressKey(key);
        } else if (!state[key] && lastState[key]) {
          // release
          releaseKey(key);
        }
      });
    }

    function loop() {
      if (!running) return;
      const g = sampleGamepad();
      if (g) {
        emitTransitions(processGamepad(g));
      } else {
        // if no gamepad, release all keys to avoid stuck state
        (Object.keys(lastState) as KeyName[]).forEach((k) => {
          if (lastState[k]) releaseKey(k);
        });
      }
      requestAnimationFrame(loop);
    }

    function onConnect(e: GamepadEvent) {
      console.info("[useGamepad] connected", e.gamepad.id);
    }
    function onDisconnect(_e: GamepadEvent) {
      console.info("[useGamepad] disconnected");
    }

    window.addEventListener("gamepadconnected", onConnect as EventListener);
    window.addEventListener("gamepaddisconnected", onDisconnect as EventListener);

    requestAnimationFrame(loop);

    return () => {
      running = false;
      // release any pressed keys
      (Object.keys(lastState) as KeyName[]).forEach((k) => {
        if (lastState[k]) {
          const entry = activeTargets[k];
          const target = entry?.target ?? document;
          sendKeyboard("keyup", k, arrowKeyCode(k), target);
        }
      });
      window.removeEventListener("gamepadconnected", onConnect as EventListener);
      window.removeEventListener("gamepaddisconnected", onDisconnect as EventListener);
    };
  }, []);
}


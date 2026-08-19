import { useEffect, useRef, useState, useCallback } from 'react';

export interface GamepadActions {
  onDeploySlot: (slotIndex: number) => void;
  onUpgradeWorkerCat: () => void;
  onFireCannon: () => void;
  onToggleAuto: () => void;
  onToggleSpeed: () => void;
  onTogglePause: () => void;
  onPanCamera: (delta: number) => void;
  selectedSlotIndex: number;
  setSelectedSlotIndex: (idx: number | ((prev: number) => number)) => void;
}

export function useGamepad(actions: GamepadActions, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [controllerName, setControllerName] = useState<string>('');
  const prevButtonsRef = useRef<{ [key: number]: boolean }>({});
  const lastDpadTimeRef = useRef(0);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Listen for gamepad connect/disconnect events
  useEffect(() => {
    const handleConnected = (e: GamepadEvent) => {
      setIsConnected(true);
      setControllerName(e.gamepad.id || 'ゲームパッド');
    };

    const handleDisconnected = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const anyConnected = Array.from(gamepads).some((gp) => gp !== null && gp.connected);
      setIsConnected(anyConnected);
      if (!anyConnected) setControllerName('');
    };

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
    };
  }, []);

  // Gamepad Polling Loop
  useEffect(() => {
    if (!enabled) return;
    let animId: number;

    const pollGamepad = () => {
      if (typeof navigator.getGamepads === 'function') {
        const gamepads = navigator.getGamepads();
        const gp = Array.from(gamepads).find((g) => g !== null && g.connected);

        if (gp) {
          if (!isConnected) {
            setIsConnected(true);
            setControllerName(gp.id || 'ゲームパッド');
          }

          const now = Date.now();
          const buttons = gp.buttons;
          const axes = gp.axes;

          // Helper to check button down transition (press event)
          const isPressed = (btnIndex: number) => {
            const current = buttons[btnIndex]?.pressed || false;
            const prev = prevButtonsRef.current[btnIndex] || false;
            return current && !prev;
          };

          // D-Pad / Left Stick Navigation with Repeat Throttling
          const axisX = axes[0] || 0;
          const axisY = axes[1] || 0;
          const dpadUp = buttons[12]?.pressed || axisY < -0.5;
          const dpadDown = buttons[13]?.pressed || axisY > 0.5;
          const dpadLeft = buttons[14]?.pressed || axisX < -0.5;
          const dpadRight = buttons[15]?.pressed || axisX > 0.5;

          if (now - lastDpadTimeRef.current > 180) {
            if (dpadLeft) {
              actionsRef.current.setSelectedSlotIndex((prev) => (prev > 0 ? prev - 1 : 9));
              lastDpadTimeRef.current = now;
            } else if (dpadRight) {
              actionsRef.current.setSelectedSlotIndex((prev) => (prev < 9 ? prev + 1 : 0));
              lastDpadTimeRef.current = now;
            } else if (dpadUp || dpadDown) {
              // Toggle between top row (0..4) and bottom row (5..9)
              actionsRef.current.setSelectedSlotIndex((prev) => (prev < 5 ? prev + 5 : prev - 5));
              lastDpadTimeRef.current = now;
            }
          }

          // Camera Pan with Triggers / Bumpers or Right Stick
          const axisRx = axes[2] || 0;
          const leftBumper = buttons[4]?.pressed || buttons[6]?.pressed;
          const rightBumper = buttons[5]?.pressed || buttons[7]?.pressed;

          if (leftBumper || axisRx < -0.3) {
            actionsRef.current.onPanCamera(-14);
          }
          if (rightBumper || axisRx > 0.3) {
            actionsRef.current.onPanCamera(14);
          }

          // Action Buttons:
          // Button 0 (Switch A / Xbox A / PS Cross): Deploy selected unit
          if (isPressed(0)) {
            actionsRef.current.onDeploySlot(actionsRef.current.selectedSlotIndex);
          }

          // Button 1 (Switch B / Xbox B / PS Circle): Upgrade Worker Cat
          if (isPressed(1)) {
            actionsRef.current.onUpgradeWorkerCat();
          }

          // Button 2 (Switch X / Xbox X / PS Square): Fire Cat Cannon
          if (isPressed(2)) {
            actionsRef.current.onFireCannon();
          }

          // Button 3 (Switch Y / Xbox Y / PS Triangle): Toggle Auto CPU
          if (isPressed(3)) {
            actionsRef.current.onToggleAuto();
          }

          // Button 8 (Minus / Select / Back): Toggle Battle Speed
          if (isPressed(8)) {
            actionsRef.current.onToggleSpeed();
          }

          // Button 9 (Plus / Start / Options): Toggle Pause
          if (isPressed(9)) {
            actionsRef.current.onTogglePause();
          }

          // Store current button states
          buttons.forEach((btn, idx) => {
            prevButtonsRef.current[idx] = btn.pressed;
          });
        }
      }

      animId = requestAnimationFrame(pollGamepad);
    };

    animId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animId);
  }, [enabled, isConnected]);

  // Keyboard Shortcuts (Switch-style keyboard controls)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut trigger when typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        // Direct Slot Deployment (Keys 1 to 9 and 0)
        case '1': actionsRef.current.onDeploySlot(0); break;
        case '2': actionsRef.current.onDeploySlot(1); break;
        case '3': actionsRef.current.onDeploySlot(2); break;
        case '4': actionsRef.current.onDeploySlot(3); break;
        case '5': actionsRef.current.onDeploySlot(4); break;
        case '6': actionsRef.current.onDeploySlot(5); break;
        case '7': actionsRef.current.onDeploySlot(6); break;
        case '8': actionsRef.current.onDeploySlot(7); break;
        case '9': actionsRef.current.onDeploySlot(8); break;
        case '0': actionsRef.current.onDeploySlot(9); break;

        // Deploy currently highlighted slot (Space or Enter)
        case 'Enter':
        case ' ':
          e.preventDefault();
          actionsRef.current.onDeploySlot(actionsRef.current.selectedSlotIndex);
          break;

        // Slot Navigation
        case 'ArrowLeft':
          e.preventDefault();
          actionsRef.current.setSelectedSlotIndex((prev) => (prev > 0 ? prev - 1 : 9));
          break;
        case 'ArrowRight':
          e.preventDefault();
          actionsRef.current.setSelectedSlotIndex((prev) => (prev < 9 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          actionsRef.current.setSelectedSlotIndex((prev) => (prev < 5 ? prev + 5 : prev - 5));
          break;

        // Camera Pan (Q / E or , / .)
        case 'q':
        case 'Q':
        case ',':
          actionsRef.current.onPanCamera(-30);
          break;
        case 'e':
        case 'E':
        case '.':
          actionsRef.current.onPanCamera(30);
          break;

        // Actions
        case 'w':
        case 'W':
          actionsRef.current.onUpgradeWorkerCat();
          break;
        case 'c':
        case 'C':
        case 'x':
        case 'X':
          actionsRef.current.onFireCannon();
          break;
        case 'a':
        case 'A':
          actionsRef.current.onToggleAuto();
          break;
        case 's':
        case 'S':
          actionsRef.current.onToggleSpeed();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          actionsRef.current.onTogglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return {
    isConnected,
    controllerName,
  };
}

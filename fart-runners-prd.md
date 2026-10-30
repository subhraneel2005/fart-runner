# Fart Runner — Product Requirements

## Core Concept
A browser-based, 3D endless runner inspired by Subway Surfers, where farting powers the character's movement.

## 1. Landing Page
- Game title: **Fart Runner**
- One input field: **Enter your X username**
- One button: **LET IT RIP**
- No account registration or login required.

## 2. X Profile Personalization
When the user enters their X username:
1. Retrieve their public profile information through the X API, where access permits.
2. Fetch their profile photo and display name.
3. Apply their profile photo as the playable character's head.
4. Display their X username above the character.

If profile retrieval fails, allow the user to play with a default character.

## 3. Gameplay
- Third-person, 3D endless runner.
- The character moves forward using fart-powered propulsion.
- Charge and release farts for stronger acceleration and higher jumps.
- Fart in midair to control movement.
- Collect beans and avoid obstacles.
- Use power-ups such as Fart Rocket, Nuclear Burrito, and Anti-Gravity Gas.
- Difficulty increases over time.
- Track distance, score, and collectibles.

## 4. Game Over
Display:
- Distance travelled.
- Final score.
- Beans collected.
- A funny, procedurally selected headline.
- Restart button.
- Share button.

## 5. Technical Stack
- React + TypeScript + Vite.
- Three.js + React Three Fiber.
- Rapier physics.
- Zustand for game state.
- Server-side API integration for X profile retrieval.

## 6. Requirements
- Desktop keyboard and mobile touch controls.
- Responsive interface.
- No authentication or database required for the initial release.
- Never expose X API credentials in frontend code.
- Game must work without X API access using a default character.
- No rival characters, relationship mechanics, or second username field.

## Core Principle
**The X username is only for personalizing the player's character. The game itself is a standalone, fart-powered endless runner.**

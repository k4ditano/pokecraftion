# Pokecraftion

Juego web personal (portfolio, sin ánimo de lucro) que mezcla:

- **Potion Craft** — mecánica de exploración: mapa alquímico con niebla, portales, hazards, movimiento por trayectorias de ingredientes que se consumen, caldero + mortero, tienda.
- **pokelike.xyz** — combate Pokémon roguelite: 1v1 turn-based, tipos, items, MTs.
- **Slay-the-Spire** — path con nodos visibles a priori entre fases de mapa (entrenador, comerciante, evento, élite, jefe).

> Inspirado por Pokémon. Usa datos y sprites de PokéAPI. No afiliado a Nintendo, Game Freak ni The Pokémon Company. Proyecto fan, no comercial.

## Stack

- Vite + React 19 + TypeScript
- **Phaser 4** (mapa + sistemas en canvas)
- **Zustand** (state compartido React ↔ Phaser)
- **Dexie / IndexedDB** (meta-progreso persistente entre runs)
- Fonts Google: `IM Fell English SC` + `VT323` + `Silkscreen`

## Estructura

```
src/
  game/           ← Phaser (escenas, sistemas, utils geom)
    scenes/MapScene.ts     ← mapa con niebla, portales, hazards, movimiento
    pathUtils.ts           ← rotar/cortar paths por fraction de longitud
    types.ts               ← Vec2, IngredientDef, Collectible, RunNode, etc.
  ui/             ← React (HUD + modales overlay)
    Hud.tsx                ← top-left/right scrolls + bottom wood tray
    PathScreen.tsx         ← modal del path roguelike
    BattleScreen.tsx       ← combate 2 columnas pokelike
    MetaShop.tsx           ← tienda de esencias entre runs
    TeamMemberPanel.tsx    ← gestión de movimientos vía MTs
    PhaserCanvas.tsx       ← bridge React → Phaser
  state/
    gameStore.ts           ← Zustand store principal (run state)
    metaStore.ts           ← Zustand store meta (persiste a IndexedDB)
  data/           ← contenido tipado (ingredientes, mapa, pokémon, movimientos, path, MTs)
  services/
    pokeapi.ts             ← URLs de sprites PokéAPI (cache local)
    db.ts                  ← Dexie wrapper
  index.css                ← design tokens + estilos completos
```

## Estado del juego

Loop core funcionando end-to-end:

1. **Mapa Phaser** (fase exploración Potion Craft):
   - Niebla de guerra tile-based (grid 40px, vision radius 115).
   - Player en centro (pozo).
   - 3 ingredientes con paths distintos (recta, curva S, salto parabólico).
   - Hold-to-grind con mortero → preview path crece 0% → 100%.
   - Click en canvas fija dirección de aim (no follow cursor).
   - Verter → peón recorre porción molida, captura pokémon al tocar, golpea hazards (X rojas) o entra a portales (parejas teleport).
   - Manantial al estar en centro cura party (cuesta 1 agua).
2. **Path roguelike** (botón "Salir al camino" en HUD):
   - 6 nodos lineales: trainer → event → merchant → trainer → elite → boss.
   - Cada nodo se previsualiza (qué pokémon trae el entrenador, qué vende el mercader, etc.).
3. **Combate pokelike** (entrenadores):
   - 2 columnas full-party visible.
   - Cada Pokémon tiene **un movimiento** (sustituible por MTs **solo de tipos compatibles**).
   - Auto-tick: 1 ataque por tick, ordenado por velocidad. Flash de color del tipo en defensor.
   - Skip acelera. Auto-switch al desmayarse.
4. **Meta-progreso**:
   - Esencias se ganan al derrotar al boss.
   - Tienda meta con 8 upgrades (ingredientes extra, agua, oro, MTs starter).
   - Persistencia en IndexedDB.

## Qué necesita la pasada de diseño

Estado visual actual: aproximación CSS al estilo Potion Craft (paleta pergamino + madera + bronce + viales). Es funcional pero **no se parece visualmente** al Potion Craft real ni al pokelike.

Áreas a rediseñar idealmente:

- **Mapa Phaser**: pasar de fondo plano con manchas CSS a un pergamino con textura hand-drawn, montañas/marcas a tinta, peón como mini caldero pixel-art real, pozo dibujado, portales y hazards con sprites custom.
- **HUD bottom**: la "bandeja de madera" hoy es CSS stripes. Sustituir por sprite madera tallada con compartimentos. Ingredientes hoy son viales CSS clip-path — pasar a sprites pixel-art de viales etiquetados. Caldero hoy es CSS semicircle — debería ser caldero pixel ilustrado con líquido animado.
- **Mortero**: hoy es solo un botón. Podría ser un widget con animación de moler.
- **Battle screen**: layout pokelike OK, pero el marco y los slots podrían tener arte de madera tallada y plataformas tipo Potion Craft.
- **Path screen**: ahora nodos son cards pergamino simples. Podrían dibujarse sobre un mapa hand-drawn con caminos curvos entre nodos.
- **Sprite del entrenador**: hoy es emoji. Pixel art real.
- **Frame ornamental**: el Potion Craft real tiene marco de madera tallado alrededor de toda la pantalla. Falta.

Las mecánicas no deberían cambiar — solo presentación. La estructura React/Phaser está estable; el rediseño puede tocar libremente CSS, asset pipeline, y los `add.graphics`/`add.image` de las escenas Phaser para usar sprites custom.

## Desarrollo

```sh
npm install
npm run dev
```

Servidor en `http://localhost:5173/`.

## Referencias visuales

- [Potion Craft](https://store.steampowered.com/app/1210320/Potion_Craft_Alchemist_Simulator/) — fuente principal de inspiración (mecánica + estética).
- [pokelike.xyz](https://pokelike.xyz/) — referencia del estilo de combate roguelite por arenas.
- [PokéRogue](https://pokerogue.net/) — referencia secundaria del género.
